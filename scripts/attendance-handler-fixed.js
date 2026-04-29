// Исправленная версия для action-oauth маршрута
const attendanceHandler = async (req, res) => {
  try {
    const { employeeId, action, timestamp } = req.body;  // Валидация
    if (!employeeId || !action || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be checkin or checkout' });
    }  // Получаем токен из заголовка
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Токен авторизации отсутствует' });
    }  // Верифицируем JWT токен
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Проверяем, что токен принадлежит сотруднику
    if (decoded.employeeId !== parseInt(employeeId)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }  // Проверяем последнюю запись для предотвращения дублирования
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId)
      },
      orderBy: {
        date: 'desc'
      },
      take: 1
    });  // Проверка на дублирование и последовательность
    if (lastAttendance) {
      let lastAction = 'unknown';
      let isCompleted = false;    // Определяем последнее действие на основе checkInTime и checkOutTime
      if (lastAttendance.checkInTime && !lastAttendance.checkOutTime) {
        lastAction = 'checkin';
        isCompleted = false;
      } else if (lastAttendance.checkInTime && lastAttendance.checkOutTime) {
        lastAction = 'checkout';
        isCompleted = true;
      }    const lastTimestamp = new Date(lastAttendance.date);
      const currentTimestamp = new Date(timestamp);    // Если то же самое действие и прошло меньше 1 минуты, считаем дубликатом
      if (lastAction === action && (currentTimestamp - lastTimestamp) < 60000) {
        return res.status(400).json({
          error: 'Duplicate action detected',
          details: `Вы уже выполнили действие "${action === 'checkin' ? 'приход' : 'уход'}" недавно`
        });
      }    // Проверяем правильную последовательность:
      // - После незавершенного checkin можно сделать только checkout
      // - После завершенной записи можно сделать только checkin
      if (!isCompleted && action === 'checkin') {
        return res.status(400).json({
          error: 'Invalid action sequence',
          details: 'Сначала необходимо отметиться об уходе'
        });
      }

      if (isCompleted && action === 'checkout') {
        return res.status(400).json({
          error: 'Invalid action sequence',
          details: 'Сначала необходимо отметиться о приходе'
        });
      }
    }  // Создаем запись посещаемости
    let attendance;  if (action === 'checkin') {
      // Создаем новую запись для прихода
      attendance = await prisma.attendance.create({
        data: {
          employeeId: parseInt(employeeId),
          date: new Date(timestamp),
          checkInTime: new Date(timestamp)
        }
      });
    } else if (action === 'checkout') {
      // Находим последнюю незавершенную запись и обновляем ее
      const incompleteRecord = await prisma.attendance.findFirst({
        where: {
          employeeId: parseInt(employeeId),
          checkInTime: { not: null },
          checkOutTime: null
        },
        orderBy: {
          createdAt: 'desc'
        }
      });    if (!incompleteRecord) {
        return res.status(400).json({
          error: 'Сначала необходимо отметиться о приходе.',
          details: 'Не найдена незавершенная запись о приходе'
        });
      }    // Обновляем существующую запись
      attendance = await prisma.attendance.update({
        where: { id: incompleteRecord.id },
        data: {
          checkOutTime: new Date(timestamp)
        }
      });
    }  // Отправляем уведомление через WebSocket
    try {
      const io = req.app.get('io');
      if (io) {
        const employee = await prisma.employee.findUnique({
          where: { id: parseInt(employeeId) },
          select: {
            firstName: true,
            lastName: true
          }
        });      io.emit('attendance_action', {
          employeeId: parseInt(employeeId),
          action: action,
          timestamp: attendance.date,
          employee: {
            firstName: employee.firstName,
            lastName: employee.lastName
          }
        });
      }
    } catch (socketError) {
      console.error('WebSocket notification error:', socketError);
    }  res.json({
      success: true,
      action: action,
      time: attendance.date,
      message: `${action === 'checkin' ? 'Приход' : 'Уход'} успешно записан`
    });} catch (error) {
    console.error('Error performing attendance action (OAuth):', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен авторизации' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = attendanceHandler;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function safeConvertToManager() {
  try {
    console.log('=== Безопасное преобразование в менеджера ===');

    // Находим сотрудника
    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (employee) {
      console.log('Найден сотрудник, удаляем связанные записи...');

      // Удаляем все записи attendance_logs для этого сотрудника
      const deletedLogs = await prisma.attendanceLog.deleteMany({
        where: { employeeId: employee.id }
      });
      console.log(`✅ Удалено ${deletedLogs.count} записей attendance_logs`);

      // Удаляем другие связанные записи (если есть)
      try {
        await prisma.cycle.deleteMany({
          where: { employeeId: employee.id }
        });
        console.log('✅ Удалены записи cycles');
      } catch (e) {
        console.log('Циклы не найдены или уже удалены');
      }

      // Теперь удаляем сотрудника
      await prisma.employee.delete({
        where: { id: employee.id }
      });
      console.log('✅ Сотрудник удален');
    }  // Проверяем, есть ли уже менеджер с таким логином
    const existingManager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1706@gmail.com' }
    });  if (existingManager) {
      console.log('✅ Менеджер уже существует!');
      console.log('- ID:', existingManager.id);
      console.log('- Login:', existingManager.login);
      console.log('- Name:', `${existingManager.firstName} ${existingManager.lastName}`);

      // Обновляем пароль
      const password = '2005061701';
      const hashedPassword = await bcrypt.hash(password, 10);    await prisma.manager.update({
        where: { id: existingManager.id },
        data: { password: hashedPassword }
      });    console.log('✅ Пароль обновлен');
      return;
    }  // Создаем нового менеджера
    console.log('Создаем нового менеджера...');
    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  const manager = await prisma.manager.create({
      data: {
        login: 'hayrulloh1706@gmail.com',
        password: hashedPassword,
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1',
        phone: '+996224209651',
        registrationLatitude: 42.8746,
        registrationLongitude: 74.6122,
        isActive: true,
        tariffId: 56,
        maxEmployees: 100
      }
    });  console.log('✅ Менеджер создан:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Password:', password);
    console.log('- Max Employees:', manager.maxEmployees);

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

safeConvertToManager();

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testAttendanceHistory() {
  try {
    console.log('=== Testing Attendance History ===');

    // 1. Создаем тестового пользователя
    const testEmployee = await prisma.employee.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.history@example.com',
        phone: '+996123456789',
        login: 'test.history@example.com',
        password: 'password123',
        managerId: 1 // Предполагаем что менеджер с ID 1 существует
      }
    });  console.log('✅ Test employee created:', testEmployee.id);  // 2. Создаем запись о приходе
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: testEmployee.id,
        checkInTime: new Date(),
        date: new Date()
      }
    });  console.log('✅ Attendance record created:', attendance.id);  // 3. Создаем запись в истории
    const historyRecord = await prisma.attendanceHistory.create({
      data: {
        employeeId: testEmployee.id,
        checkInTime: attendance.checkInTime,
        date: new Date(),
        originalRecordId: attendance.id
      }
    });  console.log('✅ History record created:', historyRecord.id);  // 4. Обновляем запись о приходе (checkout)
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() }
    });  console.log('✅ Attendance record updated with checkout');  // 5. Создаем еще одну запись в истории
    const checkoutHistoryRecord = await prisma.attendanceHistory.create({
      data: {
        employeeId: testEmployee.id,
        checkInTime: attendance.checkInTime,
        checkOutTime: new Date(),
        date: new Date(),
        originalRecordId: attendance.id
      }
    });  console.log('✅ Checkout history record created:', checkoutHistoryRecord.id);  // 6. Получаем историю
    const history = await prisma.attendanceHistory.findMany({
      where: { employeeId: testEmployee.id },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });  console.log('✅ Found history records:', history.length);
    console.log('History:', JSON.stringify(history, null, 2));  // 7. Очищаем
    await prisma.attendanceHistory.deleteMany({
      where: { employeeId: testEmployee.id }
    });  await prisma.attendance.deleteMany({
      where: { employeeId: testEmployee.id }
    });  await prisma.employee.delete({
      where: { id: testEmployee.id }
    });  console.log('✅ Test data cleaned up');} catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAttendanceHistory();

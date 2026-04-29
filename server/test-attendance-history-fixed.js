const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestManager() {
  try {
    console.log('=== Creating Test Manager ===');

    // Создаем тестового менеджера
    const manager = await prisma.manager.create({
      data: {
        firstName: 'Test',
        lastName: 'Manager',
        phone: '+996123456789',
        login: 'test.manager@example.com',
        password: 'manager123',
        isActive: true
      }
    });  console.log('✅ Test manager created:', manager.id);  // Теперь создаем тестового пользователя
    const testEmployee = await prisma.employee.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.history@example.com',
        phone: '+996123456799',
        login: 'test.history@example.com',
        password: 'password123',
        managerId: manager.id
      }
    });  console.log('✅ Test employee created:', testEmployee.id);  // Создаем запись о приходе
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: testEmployee.id,
        checkInTime: new Date(),
        date: new Date()
      }
    });  console.log('✅ Attendance record created:', attendance.id);  // Создаем запись в истории
    const historyRecord = await prisma.attendanceHistory.create({
      data: {
        employeeId: testEmployee.id,
        checkInTime: attendance.checkInTime,
        date: new Date(),
        originalRecordId: attendance.id
      }
    });  console.log('✅ History record created:', historyRecord.id);  // Получаем историю
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
    console.log('History:', JSON.stringify(history, null, 2));} catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestManager();

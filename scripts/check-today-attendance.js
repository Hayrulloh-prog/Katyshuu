const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodayAttendance() {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('Today:', today.toISOString().split('T')[0]);
    console.log('Start date:', startDate.toISOString());
    console.log('End date:', endDate.toISOString());
    
    // Получаем все записи за сегодня для менеджера ID 4
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employee: {
          managerId: 4,
          isActive: true
        },
        date: { gte: startDate, lt: endDate }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('\nAll attendance records for today:');
    attendanceRecords.forEach(record => {
      console.log(`Employee: ${record.employee.firstName} ${record.employee.lastName}`);
      console.log(`Date: ${record.date}`);
      console.log(`CheckIn: ${record.checkInTime}`);
      console.log(`CheckOut: ${record.checkOutTime}`);
      console.log('---');
    });
    
    // Считаем уникальных сотрудников с checkInTime
    const uniqueEmployees = new Set();
    attendanceRecords.forEach(record => {
      if (record.checkInTime) {
        uniqueEmployees.add(record.employeeId);
      }
    });
    
    console.log(`\nUnique employees with checkInTime: ${uniqueEmployees.size}`);
    console.log('Employee IDs:', Array.from(uniqueEmployees));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayAttendance();

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkManagerEmployees() {
  try {
    console.log('=== ПРОВЕРКА МЕНЕДЖЕРА И СОТРУДНИКОВ ===');
    
    const managerId = 10;
    console.log('Проверяем менеджера с ID:', managerId);
    
    // Проверяем менеджера
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { employees: true }
    });
    
    if (manager) {
      console.log('✅ Менеджер найден:', {
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName,
        isActive: manager.isActive,
        employeesCount: manager.employees.length
      });
      
      if (manager.employees.length > 0) {
        console.log('Сотрудники:');
        manager.employees.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.firstName} ${emp.lastName} (ID: ${emp.id})`);
        });
        
        // Проверяем последнюю запись посещаемости первого сотрудника
        const firstEmployee = manager.employees[0];
        const recentAttendance = await prisma.attendance.findMany({
          where: {
            employeeId: firstEmployee.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        });
        
        console.log(`Последние записи посещаемости для ${firstEmployee.firstName}:`);
        recentAttendance.forEach((record, index) => {
          console.log(`  ${index + 1}. Check-in: ${record.checkInTime}, Check-out: ${record.checkOutTime}`);
        });
        
      } else {
        console.log('❌ У менеджера нет сотрудников - должна быть регистрация сотрудника');
      }
    } else {
      console.log('❌ Менеджер не найден');
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagerEmployees();

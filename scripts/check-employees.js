const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    const managerId = 1;
    const employees = await prisma.employee.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('=== СОТРУДНИКИ МЕНЕДЖЕРА 1 ===');
    console.log('Всего сотрудников:', employees.length);
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} - ${emp.email} - ${emp.phone} - Активен: ${emp.isActive}`);
    });
    
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: { maxEmployees: true }
    });
    
    console.log('\nЛИМИТ СОТРУДНИКОВ:');
    console.log('Максимум:', manager?.maxEmployees);
    console.log('Текущее:', employees.length);
    console.log('Осталось:', (manager?.maxEmployees || 0) - employees.length);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();

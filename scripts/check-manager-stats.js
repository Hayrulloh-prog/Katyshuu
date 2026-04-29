const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkManagerStats() {
  try {
    // Проверяем всех менеджеров
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        login: true,
        isActive: true,
        maxEmployees: true
      }
    });
    
    console.log('All managers:');
    managers.forEach(manager => {
      console.log(`${manager.id}: ${manager.firstName} ${manager.lastName} (${manager.login}) - Active: ${manager.isActive}, Max: ${manager.maxEmployees}`);
    });
    
    // Для каждого менеджера считаем сотрудников
    for (const manager of managers) {
      const employees = await prisma.employee.findMany({
        where: { managerId: manager.id },
        select: { id: true, firstName: true, lastName: true, isActive: true }
      });
      
      console.log(`\nManager ${manager.firstName} ${manager.lastName} (${manager.id}):`);
      console.log(`Total employees: ${employees.length}`);
      
      employees.forEach(emp => {
        console.log(`  ${emp.id}: ${emp.firstName} ${emp.lastName} - Active: ${emp.isActive}`);
      });
    }
    
    // Проверяем конкретного менеджера (предположим ID 4)
    const targetManagerId = 4;
    const targetEmployees = await prisma.employee.findMany({
      where: { managerId: targetManagerId },
      select: { id: true, firstName: true, lastName: true, isActive: true }
    });
    
    console.log(`\n=== Manager ID ${targetManagerId} ===`);
    console.log(`Total employees: ${targetEmployees.length}`);
    console.log(`Active employees: ${targetEmployees.filter(e => e.isActive).length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagerStats();

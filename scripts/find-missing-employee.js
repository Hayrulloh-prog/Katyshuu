const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMissingEmployee() {
  try {
    console.log('=== Поиск недостающего сотрудника ===');
    
    // Ищем сотрудников, которые не привязаны к hayrulloh1@gmail.com
    const allEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true,
        managerId: true,
        isActive: true,
        manager: {
          select: {
            login: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    const targetManagerId = 4; // hayrulloh1@gmail.com
    
    // Ищем сотрудников с похожими данными
    const candidates = allEmployees.filter(emp => {
      return (emp.firstName.includes('Khairulloh') || emp.lastName.includes('Youldashev')) &&
             emp.managerId !== targetManagerId &&
             emp.phone && emp.phone.startsWith('+9962242096');
    });
    
    console.log('Найденные кандидаты:');
    candidates.forEach(emp => {
      console.log(`- ID: ${emp.id}, ${emp.firstName} ${emp.lastName}, ${emp.phone}`);
      console.log(`  Текущий менеджер: ${emp.manager?.login}`);
      console.log(`  Текущий managerId: ${emp.managerId}`);
    });
    
    // Ищем по номеру +996224209601 (нужный телефон)
    const phoneCandidate = allEmployees.find(emp => emp.phone === '+996224209601');
    
    if (phoneCandidate) {
      console.log('\n✅ Найден сотрудник с нужным телефоном:');
      console.log(`- ID: ${phoneCandidate.id}, ${phoneCandidate.firstName} ${phoneCandidate.lastName}`);
      console.log(`  Телефон: ${phoneCandidate.phone}`);
      console.log(`  Текущий менеджер: ${phoneCandidate.manager?.login}`);
      
      // Переносим его к нашему менеджеру
      try {
        await prisma.employee.update({
          where: { id: phoneCandidate.id },
          data: { 
            managerId: targetManagerId,
            isActive: true
          }
        });
        console.log('✅ Сотрудник перенесен к hayrulloh1@gmail.com');
      } catch (e) {
        console.log('❌ Ошибка переноса:', e.message);
      }
    } else {
      console.log('\n❌ Сотрудник с телефоном +996224209601 не найден');
      console.log('Нужно создавать нового сотрудника');
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingEmployee();

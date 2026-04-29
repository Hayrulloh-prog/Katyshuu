const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findLostEmployees() {
  try {
    console.log('=== Поиск потерянных сотрудников ===');
    
    // Ищем всех сотрудников с похожими именами
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
    
    console.log('Все сотрудники в базе:', allEmployees.length);
    
    // Ищем сотрудников, которые могли принадлежать нашему менеджеру
    const targetManagerId = 4; // ID hayrulloh1@gmail.com
    
    // Ищем по телефонам с префиксом +9962242096
    const possibleEmployees = allEmployees.filter(emp => 
      emp.phone && emp.phone.startsWith('+9962242096') &&
      (emp.firstName.includes('Khairulloh') || 
       emp.lastName.includes('Youldashev') ||
       emp.firstName.includes('Кызыз') ||
       emp.lastName.includes('Кызыз'))
    );
    
    console.log('\nНайденные возможные сотрудники:');
    possibleEmployees.forEach(emp => {
      console.log(`- ID: ${emp.id}, ${emp.firstName} ${emp.lastName}, ${emp.phone}`);
      console.log(`  Менеджер: ${emp.manager?.login} (${emp.manager?.firstName} ${emp.manager?.lastName})`);
      console.log(`  Текущий managerId: ${emp.managerId}`);
    });
    
    // Если нашли, переносим их к нашему менеджеру
    if (possibleEmployees.length > 0) {
      console.log('\nПереносим сотрудников к менеджеру hayrulloh1@gmail.com...');
      
      for (const emp of possibleEmployees) {
        try {
          await prisma.employee.update({
            where: { id: emp.id },
            data: { 
              managerId: targetManagerId,
              isActive: true
            }
          });
          console.log(`✅ Перенесен: ${emp.firstName} ${emp.lastName}`);
        } catch (e) {
          console.log(`❌ Ошибка переноса ${emp.firstName}: ${e.message}`);
        }
      }
    } else {
      console.log('\n❌ Сотрудники не найдены');
      console.log('Возможно, они были удалены. Нужно создавать новых.');
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findLostEmployees();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function transferAllEmployees() {
  try {
    console.log('=== Перенос всех сотрудников к hayrulloh1@gmail.com ===');

    // Находим всех сотрудников менеджера khairulloh0617@gmail.com
    const sourceManager = await prisma.manager.findFirst({
      where: { login: 'khairulloh0617@gmail.com' }
    });  const targetManager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!sourceManager || !targetManager) {
      console.log('❌ Один из менеджеров не найден!');
      return;
    }  console.log('Источник:', sourceManager.login, '(ID:', sourceManager.id, ')');
    console.log('Цель:', targetManager.login, '(ID:', targetManager.id, ')');  // Находим всех сотрудников исходного менеджера
    const employees = await prisma.employee.findMany({
      where: { managerId: sourceManager.id }
    });  console.log('Найдено сотрудников для переноса:', employees.length);  // Переносим каждого сотрудника
    let transferred = 0;
    for (const emp of employees) {
      try {
        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            managerId: targetManager.id,
            isActive: true
          }
        });
        console.log(`✅ Перенесен: ${emp.firstName} ${emp.lastName}`);
        transferred++;
      } catch (e) {
        console.log(`❌ Ошибка переноса ${emp.firstName}: ${e.message}`);
      }
    }  // Проверяем итоговое количество
    const finalCount = await prisma.employee.count({
      where: { managerId: targetManager.id }
    });  console.log(`\n🎉 Результат:`);
    console.log(`- Перенесено: ${transferred}/${employees.length}`);
    console.log(`- Всего сотрудников у hayrulloh1@gmail.com: ${finalCount}/10`);  if (finalCount >= 10) {
      console.log('✅ Все сотрудники на месте!');
    } else {
      console.log(`⚠️ Нужно еще ${10 - finalCount} сотрудников`);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

transferAllEmployees();

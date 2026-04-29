const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixManagerPhone() {
  try {
    console.log('=== Исправление телефона менеджера ===');

    const manager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('Текущие данные менеджера:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Текущий телефон:', manager.phone);

    // Обновляем телефон на нужный
    await prisma.manager.update({
      where: { id: manager.id },
      data: {
        phone: '+996224209601',
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });

    console.log('\n✅ Менеджер обновлен:');
    console.log('- Новый телефон: +996224209601');
    console.log('- Имя: Khairulloh1 Youldashev1');
    console.log('- Логин: hayrulloh1@gmail.com');

    // Проверяем количество сотрудников
    const employeeCount = await prisma.employee.count({
      where: { managerId: manager.id }
    });

    console.log(`\n📊 Текущее количество сотрудников: ${employeeCount}/10`);

    if (employeeCount === 10) {
      console.log('✅ Все 10 сотрудников на месте!');
    } else {
      console.log(`⚠️ Нужно еще ${10 - employeeCount} сотрудников`);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixManagerPhone();

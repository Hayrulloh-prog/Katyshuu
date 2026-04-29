const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createMissingEmployee() {
  try {
    console.log('=== Создание недостающего сотрудника ===');

    const manager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('✅ Менеджер найден:', manager.id);

    // Создаем 10-го сотрудника с нужным телефоном
    const employeeData = {
      login: 'khairulloh1.employee10@company.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Khairulloh1',
      lastName: 'Youldashev1',
      phone: '+996224209601', // Нужный телефон
      managerId: manager.id,
      isActive: true
    };  const employee = await prisma.employee.create({
      data: employeeData
    });  console.log('✅ Сотрудник создан:');
    console.log('- ID:', employee.id);
    console.log('- Имя:', `${employee.firstName} ${employee.lastName}`);
    console.log('- Телефон:', employee.phone);
    console.log('- Логин:', employee.login);
    console.log('- Пароль: password123');
    console.log('- Менеджер:', manager.login);

    // Проверяем итоговое количество
    const finalCount = await prisma.employee.count({
      where: { managerId: manager.id }
    });

    console.log(`\n🎉 Итого сотрудников: ${finalCount}/10`);

    if (finalCount === 10) {
      console.log('✅ Все 10 сотрудников на месте!');
    } else {
      console.log(`❌ Все еще не хватает ${10 - finalCount} сотрудников`);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingEmployee();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentManager() {
  try {
    console.log('=== Проверка текущего менеджера ===');

    const manager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('✅ Менеджер найден:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Phone:', manager.phone);

    // Получаем всех сотрудников этого менеджера
    const employees = await prisma.employee.findMany({
      where: { managerId: manager.id },
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log('\nСотрудники менеджера:', employees.length);
    employees.forEach(emp => {
      console.log(`${emp.id}. ${emp.firstName} ${emp.lastName} - ${emp.phone} (${emp.isActive ? 'активен' : 'неактивен'})`);
      console.log(`   Логин: ${emp.login}`);
    });

    if (employees.length < 10) {
      console.log(`\n❌ Нужно еще ${10 - employees.length} сотрудников`);
    } else {
      console.log('\n✅ Все 10 сотрудников на месте!');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentManager();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhoneOwner() {
  try {
    console.log('=== Проверка владельца телефона +996224209601 ===');

    // Ищем, у кого этот телефон
    const phoneOwner = await prisma.manager.findFirst({
      where: { phone: '+996224209601' }
    });  if (phoneOwner) {
      console.log('✅ Телефон найден у менеджера:');
      console.log('- ID:', phoneOwner.id);
      console.log('- Login:', phoneOwner.login);
      console.log('- Name:', `${phoneOwner.firstName} ${phoneOwner.lastName}`);
      console.log('- Phone:', phoneOwner.phone);
    } else {
      console.log('❌ Телефон не найден у менеджеров');

      // Проверяем у сотрудников
      const employeeOwner = await prisma.employee.findFirst({
        where: { phone: '+996224209601' },
        include: {
          manager: {
            select: {
              login: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });    if (employeeOwner) {
        console.log('✅ Телефон найден у сотрудника:');
        console.log('- ID:', employeeOwner.id);
        console.log('- Name:', `${employeeOwner.firstName} ${employeeOwner.lastName}`);
        console.log('- Phone:', employeeOwner.phone);
        console.log('- Менеджер:', `${employeeOwner.manager.firstName} ${employeeOwner.manager.lastName}`);
        console.log('- Менеджер login:', employeeOwner.manager.login);
      } else {
        console.log('❌ Телефон нигде не найден');
      }
    }

    // Показываем все телефоны с похожим началом
    console.log('\nВсе телефоны с +9962242096:');
    const allManagers = await prisma.manager.findMany({
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    });

    allManagers.forEach(m => {
      if (m.phone && m.phone.startsWith('+9962242096')) {
        console.log(`- ID: ${m.id}, ${m.login}, ${m.phone}`);
      }
    });

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhoneOwner();

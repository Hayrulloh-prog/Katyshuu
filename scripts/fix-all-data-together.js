const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllDataTogether() {
  try {
    console.log('=== Объединение всех данных ===');

    // Находим менеджера с нужным телефоном
    const phoneOwner = await prisma.manager.findFirst({
      where: { phone: '+996224209601' }
    });  // Находим нашего менеджера
    const targetManager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  console.log('Владелец телефона +996224209601:');
    if (phoneOwner) {
      console.log('- ID:', phoneOwner.id);
      console.log('- Login:', phoneOwner.login);
      console.log('- Name:', `${phoneOwner.firstName} ${phoneOwner.lastName}`);
    }  console.log('\nНаш менеджер:');
    if (targetManager) {
      console.log('- ID:', targetManager.id);
      console.log('- Login:', targetManager.login);
      console.log('- Name:', `${targetManager.firstName} ${targetManager.lastName}`);
      console.log('- Phone:', targetManager.phone);
    }  // Если телефон занят другим менеджером, меняем ему телефон
    if (phoneOwner && phoneOwner.id !== targetManager.id) {
      console.log('\nМеняем телефон владельцу...');
      await prisma.manager.update({
        where: { id: phoneOwner.id },
        data: { phone: '+996224209699' } // Другой телефон
      });
      console.log('✅ Владельцу телефона дан новый: +996224209699');
    }  // Теперь обновляем нашего менеджера
    if (targetManager) {
      console.log('\nОбновляем нашего менеджера...');
      await prisma.manager.update({
        where: { id: targetManager.id },
        data: {
          phone: '+996224209601',
          firstName: 'Khairulloh1',
          lastName: 'Youldashev1'
        }
      });
      console.log('✅ Менеджер обновлен!');
    }  // Проверяем результат
    const finalManager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (finalManager) {
      console.log('\n🎉 ИТОГОВЫЕ ДАННЫЕ:');
      console.log('- Имя:', `${finalManager.firstName} ${finalManager.lastName}`);
      console.log('- Телефон:', finalManager.phone);
      console.log('- Логин:', finalManager.login);
      console.log('- Пароль: 2005061701');

      const employeeCount = await prisma.employee.count({
        where: { managerId: finalManager.id }
      });
      console.log('- Сотрудники:', employeeCount, '/10');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllDataTogether();

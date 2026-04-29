const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateHayrulloh1Manager() {
  try {
    console.log('=== Обновление менеджера hayrulloh1@gmail.com ===');

    const manager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('Текущие данные:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Phone:', manager.phone);

    // Обновляем пароль
    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  await prisma.manager.update({
      where: { id: manager.id },
      data: {
        password: hashedPassword,
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1',
        phone: '+996224209651'
      }
    });

    console.log('\n✅ Менеджер обновлен:');
    console.log('- Login: hayrulloh1@gmail.com');
    console.log('- Новый пароль:', password);
    console.log('- Имя: Khairulloh1 Youldashev1');
    console.log('- Телефон: +996224209651');

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateHayrulloh1Manager();

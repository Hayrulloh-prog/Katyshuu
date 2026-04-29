const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateManager1() {
  try {
    console.log('=== Обновление менеджера ID 1 ===');

    const manager = await prisma.manager.findFirst({
      where: { id: 1 }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('Текущие данные:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Phone:', manager.phone);

    // Обновляем до нужных данных
    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  await prisma.manager.update({
      where: { id: 1 },
      data: {
        login: 'hayrulloh1706@gmail.com',
        password: hashedPassword,
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1',
        phone: '+996224209651'
      }
    });

    console.log('\n✅ Менеджер обновлен:');
    console.log('- Новый login: hayrulloh1706@gmail.com');
    console.log('- Новый пароль:', password);
    console.log('- Имя: Khairulloh1 Youldashev1');
    console.log('- Телефон: +996224209651');

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateManager1();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createManagerSimple() {
  try {
    console.log('=== Создание менеджера с минимальными данными ===');

    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  const manager = await prisma.manager.create({
      data: {
        login: 'hayrulloh1706@gmail.com',
        password: hashedPassword,
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1',
        phone: '+996224209999', // Другой телефон
        registrationLatitude: 42.8746,
        registrationLongitude: 74.6122,
        isActive: true,
        maxEmployees: 100
      }
    });  console.log('✅ Менеджер создан:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Password:', password);

  } catch (error) {
    console.error('Ошибка:', error.message);
    console.error('Код:', error.code);

    // Проверим, что уже существует
    const existing = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1706@gmail.com' }
    });

    if (existing) {
      console.log('\n✅ Менеджер уже существует:');
      console.log('- ID:', existing.id);
      console.log('- Login:', existing.login);
      console.log('- Name:', `${existing.firstName} ${existing.lastName}`);

      // Обновим пароль
      await prisma.manager.update({
        where: { id: existing.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Пароль обновлен на:', password);
    }

  } finally {
    await prisma.$disconnect();
  }
}

createManagerSimple();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createFinalManager() {
  try {
    console.log('=== Создание финального менеджера ===');

    // Проверим, что уже существует
    const existing = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1706@gmail.com' }
    });

    if (existing) {
      console.log('✅ Менеджер уже существует:');
      console.log('- ID:', existing.id);
      console.log('- Login:', existing.login);
      console.log('- Name:', `${existing.firstName} ${existing.lastName}`);

      // Обновим данные
      const password = '2005061701';
      const hashedPassword = await bcrypt.hash(password, 10);    await prisma.manager.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          firstName: 'Khairulloh1',
          lastName: 'Youldashev1',
          phone: '+996224209651'
        }
      });

      console.log('✅ Данные обновлены');
      console.log('- Новый пароль:', password);
      return;
    }

    // Создаем нового
    console.log('Создаем нового менеджера...');
    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  const manager = await prisma.manager.create({
      data: {
        login: 'hayrulloh1706@gmail.com',
        password: hashedPassword,
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1',
        phone: '+996224209651',
        registrationLatitude: 42.8746,
        registrationLongitude: 74.6122,
        isActive: true,
        tariffId: 56,
        maxEmployees: 100
      }
    });  console.log('✅ Менеджер создан:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Password:', password);
    console.log('- Max Employees:', manager.maxEmployees);

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createFinalManager();

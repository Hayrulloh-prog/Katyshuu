const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExistingManager() {
  try {
    console.log('=== Проверка существующего менеджера ===');

    const manager = await prisma.manager.findFirst({
      where: { id: 2 }, // Берем существующего менеджера
      include: { tariff: true }
    });  if (manager) {
      console.log('Существующий менеджер:');
      console.log('- ID:', manager.id);
      console.log('- Login:', manager.login);
      console.log('- Tariff ID:', manager.tariffId);
      console.log('- Tariff:', manager.tariff);

      // Теперь создадим нового менеджера с правильной структурой
      const bcrypt = require('bcryptjs');
      const password = '2005061701';
      const hashedPassword = await bcrypt.hash(password, 10);    const newManager = await prisma.manager.create({
        data: {
          login: 'hayrulloh1@gmail.com',
          password: hashedPassword,
          firstName: 'Khairulloh',
          lastName: 'Youldashev',
          company: 'Test Company',
          phone: '+996224209651',
          registrationLatitude: 42.8746,
          registrationLongitude: 74.6122,
          isActive: true,
          tariffType: 'UNLIMITED',
          employeeLimit: 100,
          maxEmployees: 100,
          tariffId: manager.tariffId // Используем тот же тариф
        }
      });    console.log('\n✅ Новый менеджер создан:');
      console.log('- ID:', newManager.id);
      console.log('- Login:', newManager.login);
      console.log('- Password:', password);
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingManager();

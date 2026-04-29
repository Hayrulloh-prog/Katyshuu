const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createCorrectManager() {
  try {
    console.log('=== Создание менеджера hayrulloh1@gmail.com ===');

    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  const newManager = await prisma.manager.create({
      data: {
        login: 'hayrulloh1@gmail.com',
        password: hashedPassword,
        firstName: 'Khairulloh',
        lastName: 'Youldashev',
        phone: '+996224209651',
        registrationLatitude: 42.8746,
        registrationLongitude: 74.6122,
        isActive: true,
        tariffId: 56,
        maxEmployees: 100
      }
    });  console.log('✅ Менеджер создан:');
    console.log('- ID:', newManager.id);
    console.log('- Login:', newManager.login);
    console.log('- Name:', `${newManager.firstName} ${newManager.lastName}`);
    console.log('- Password:', password);
    console.log('- Max Employees:', newManager.maxEmployees);

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCorrectManager();

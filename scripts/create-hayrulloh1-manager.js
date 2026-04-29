const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createManager() {
  try {
    console.log('=== Создание менеджера hayrulloh1@gmail.com ===');

    // Проверяем, существует ли уже такой менеджер
    const existingManager = await prisma.manager.findFirst({
      where: {
        login: 'hayrulloh1@gmail.com'
      }
    });  if (existingManager) {
      console.log('Менеджер уже существует!');
      return;
    }  // Создаем пароль
    const password = '2005061701';
    const hashedPassword = await bcrypt.hash(password, 10);  // Создаем менеджера
    const manager = await prisma.manager.create({
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
        maxEmployees: 100
      }
    });  console.log('✅ Менеджер создан успешно:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- Password:', password);
    console.log('- Employee Limit:', manager.employeeLimit);

  } catch (error) {
    console.error('Ошибка при создании менеджера:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createManager();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🌱 Создаю тестовые данные...');try {
    // Создаем тариф
    const tariff = await prisma.tariff.create({
      data: {
        name: 'Тестовый тариф',
        price: 1000,
        duration: 30,
        maxEmployees: 50
      }
    });
    console.log('✅ Тариф создан:', tariff.name);  // Создаем менеджера
    const manager = await prisma.manager.create({
      data: {
        firstName: 'Тестовый',
        lastName: 'Менеджер',
        phone: '+996700123456',
        login: 'test.manager@gmail.com',
        password: 'password123', // В реальном приложении нужно хешировать
        tariffId: tariff.id,
        maxEmployees: 50
      }
    });
    console.log('✅ Менеджер создан:', manager.firstName, manager.lastName);  // Создаем QR токен
    const qrToken = await prisma.qrToken.create({
      data: {
        token: 'test123456789012345678901234',
        managerId: manager.id,
        type: 'EMPLOYEE_REG'
      }
    });
    console.log('✅ QR токен создан:', qrToken.token);  console.log('🎉 Тестовые данные созданы успешно!');
    console.log('📝 Логин менеджера: test.manager@gmail.com');
    console.log('🔑 Пароль: password123');
    console.log('📱 QR токен: test123456789012345678901234');} catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };

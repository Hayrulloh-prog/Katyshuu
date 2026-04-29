const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testNewManager() {
  try {
    console.log('=== Тест нового менеджера ===');

    const manager = await prisma.manager.findFirst({
      where: {
        login: 'hayrulloh1@gmail.com'
      }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('✅ Менеджер найден:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
    console.log('- isActive:', manager.isActive);

    // Проверяем пароль
    const testPassword = '2005061701';
    const isValid = await bcrypt.compare(testPassword, manager.password);
    console.log(`- Пароль "${testPassword}": ${isValid ? '✅ верный' : '❌ неверный'}`);

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testNewManager();

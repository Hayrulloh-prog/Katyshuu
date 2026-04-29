const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('=== Проверка структуры модели Manager ===');

    // Получаем первого менеджера и смотрим все поля
    const manager = await prisma.manager.findFirst({
      where: { id: 2 }
    });  if (manager) {
      console.log('Все поля менеджера:');
      console.log(Object.keys(manager));

      console.log('\nЗначения полей:');
      Object.entries(manager).forEach(([key, value]) => {
        console.log(`- ${key}: ${value}`);
      });
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

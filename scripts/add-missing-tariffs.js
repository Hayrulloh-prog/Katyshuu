const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addMissingTariffs() {
  try {
    const missingTariffs = [
      { name: '4 месяца', duration: 120, maxEmployees: 10, price: 1300 },
      { name: '5 месяцев', duration: 150, maxEmployees: 10, price: 1600 },
      { name: '7 месяцев', duration: 210, maxEmployees: 15, price: 2800 },
      { name: '8 месяцев', duration: 240, maxEmployees: 15, price: 3200 },
      { name: '9 месяцев', duration: 270, maxEmployees: 20, price: 3500 },
      { name: '10 месяцев', duration: 300, maxEmployees: 20, price: 4000 },
      { name: '11 месяцев', duration: 330, maxEmployees: 25, price: 4500 }
    ];  console.log('Добавляем недостающие тарифы...');  for (const tariff of missingTariffs) {
      // Проверяем, существует ли тариф
      const existing = await prisma.tariff.findFirst({
        where: { name: tariff.name }
      });    if (!existing) {
        await prisma.tariff.create({
          data: tariff
        });
        console.log(`✅ Добавлен тариф: ${tariff.name}`);
      } else {
        console.log(`⚠️ Тариф ${tariff.name} уже существует`);
      }
    }  // Удаляем тариф "12 месяцев"
    const twelveMonths = await prisma.tariff.findFirst({
      where: { name: '12 месяцев' }
    });  if (twelveMonths) {
      await prisma.tariff.delete({
        where: { id: twelveMonths.id }
      });
      console.log(`🗑️ Удален тариф: 12 месяцев`);
    }  console.log('\n📋 Все тарифы в базе:');
    const allTariffs = await prisma.tariff.findMany({
      orderBy: { duration: 'asc' }
    });  allTariffs.forEach(t => {
      console.log(`ID: ${t.id}, Name: ${t.name}, Duration: ${t.duration} дней`);
    });} catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingTariffs();

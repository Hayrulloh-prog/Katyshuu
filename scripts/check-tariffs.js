const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTariffs() {
  try {
    console.log('Проверка тарифов в базе данных...\n');

    const tariffs = await prisma.tariff.findMany({
      orderBy: { duration: 'asc' }
    });  console.log(`Всего тарифов в базе: ${tariffs.length}\n`);  tariffs.forEach((tariff, index) => {
      console.log(`${index + 1}. ID: ${tariff.id}, Название: "${tariff.name}", Длительность: ${tariff.duration} дней`);
    });  console.log('\nПроверка отсутствующих тарифов...');

    const expectedTariffs = [
      { name: 'Пробный', duration: 7 },
      { name: '1 месяц', duration: 30 },
      { name: '2 месяца', duration: 60 },
      { name: '3 месяца', duration: 90 },
      { name: '4 месяца', duration: 120 },
      { name: '5 месяцев', duration: 150 },
      { name: '6 месяцев', duration: 180 },
      { name: '7 месяцев', duration: 210 },
      { name: '8 месяцев', duration: 240 },
      { name: '9 месяцев', duration: 270 },
      { name: '10 месяцев', duration: 300 },
      { name: '11 месяцев', duration: 330 },
      { name: '1 год', duration: 365 }
    ];  expectedTariffs.forEach(expected => {
      const exists = tariffs.some(t =>
        t.name === expected.name && t.duration === expected.duration
      );

      if (!exists) {
        console.log(`❌ Отсутствует: "${expected.name}" (${expected.duration} дней)`);
      } else {
        console.log(`✅ Есть: "${expected.name}" (${expected.duration} дней)`);
      }
    });} catch (error) {
    console.error('Ошибка при проверке тарифов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTariffs();

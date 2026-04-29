const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');// Check if tariffs exist and add missing ones
  const tariffsCount = await prisma.tariff.count();// Define all required tariffs
  const requiredTariffs = [
    { name: 'Пробный', duration: 2, maxEmployees: 10, price: 0 },
    { name: '1 месяц', duration: 30, maxEmployees: 10, price: 1000 },
    { name: '2 месяца', duration: 60, maxEmployees: 10, price: 1800 },
    { name: '3 месяца', duration: 90, maxEmployees: 20, price: 2500 },
    { name: '4 месяца', duration: 120, maxEmployees: 25, price: 3200 },
    { name: '5 месяцев', duration: 150, maxEmployees: 25, price: 3800 },
    { name: '6 месяцев', duration: 180, maxEmployees: 30, price: 4500 },
    { name: '7 месяцев', duration: 210, maxEmployees: 35, price: 5200 },
    { name: '8 месяцев', duration: 240, maxEmployees: 35, price: 5800 },
    { name: '9 месяцев', duration: 270, maxEmployees: 40, price: 6500 },
    { name: '10 месяцев', duration: 300, maxEmployees: 40, price: 7200 },
    { name: '11 месяцев', duration: 330, maxEmployees: 45, price: 7800 },
    { name: '1 год', duration: 365, maxEmployees: 50, price: 9000 },
  ];if (tariffsCount === 0) {
    // First time - create all tariffs
    await prisma.tariff.createMany({ data: requiredTariffs });
    console.log('✅ Default tariffs created successfully');
  } else {
    // Check for missing tariffs and add them
    const existingTariffs = await prisma.tariff.findMany();
    const existingNames = existingTariffs.map(t => t.name);  const missingTariffs = requiredTariffs.filter(tariff => !existingNames.includes(tariff.name));  if (missingTariffs.length > 0) {
      await prisma.tariff.createMany({ data: missingTariffs });
      console.log(`✅ Added ${missingTariffs.length} missing tariffs:`, missingTariffs.map(t => t.name));
    }  // Remove 12 месяцев if it exists (дубликат 1 год)
    const twelveMonths = existingTariffs.find(t => t.name === '12 месяцев');
    if (twelveMonths) {
      await prisma.tariff.delete({ where: { id: twelveMonths.id } });
      console.log('✅ Removed duplicate "12 месяцев" tariff');
    }
  }console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Error initializing default data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

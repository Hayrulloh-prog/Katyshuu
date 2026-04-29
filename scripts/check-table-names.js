const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableNames() {
  try {
    console.log('=== Проверка названий таблиц ===');
    
    // Получаем все модели Prisma
    const models = Object.keys(prisma._dataMap.models || {});
    console.log('Доступные модели:');
    models.forEach(model => {
      console.log(`- ${model}`);
    });
    
    // Проверяем конкретные таблицы
    console.log('\nПроверка конкретных таблиц:');
    
    try {
      const count1 = await prisma.attendanceLog.count();
      console.log(`✅ attendanceLog: ${count1} записей`);
    } catch (e) {
      console.log(`❌ attendanceLog: ${e.message}`);
    }
    
    try {
      const count2 = await prisma.attendance_logs.count();
      console.log(`✅ attendance_logs: ${count2} записей`);
    } catch (e) {
      console.log(`❌ attendance_logs: ${e.message}`);
    }
    
    try {
      const count3 = await prisma.cycle.count();
      console.log(`✅ cycle: ${count3} записей`);
    } catch (e) {
      console.log(`❌ cycle: ${e.message}`);
    }
    
    try {
      const count4 = await prisma.cycles.count();
      console.log(`✅ cycles: ${count4} записей`);
    } catch (e) {
      console.log(`❌ cycles: ${e.message}`);
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableNames();

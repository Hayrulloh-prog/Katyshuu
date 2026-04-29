const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQRStructure() {
  try {
    console.log('=== Проверка структуры QR-кодов ===');
    
    // Получаем несколько записей чтобы увидеть поля
    const records = await prisma.qrToken.findMany({
      take: 3
    });
    
    if (records.length > 0) {
      console.log('Поля в модели QrToken:');
      Object.keys(records[0]).forEach(key => {
        console.log(`- ${key}: ${typeof records[0][key]}`);
      });
      
      console.log('\nПример записи:');
      console.log(JSON.stringify(records[0], null, 2));
      
      // Считаем активные/неактивные на основе доступных полей
      const allCount = await prisma.qrToken.count();
      console.log('\nВсего QR-кодов:', allCount);
      
      // Пробуем найти использованные
      try {
        const usedCount = await prisma.qrToken.count({
          where: { usedAt: { not: null } }
        });
        console.log('Использованных QR-кодов:', usedCount);
        console.log('Неиспользованных:', allCount - usedCount);
      } catch (e) {
        console.log('Не удалось посчитать использованные:', e.message);
      }
      
    } else {
      console.log('QR-коды не найдены');
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRStructure();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findQRModel() {
  try {
    console.log('=== Поиск модели QR-кодов ===');
    
    // Пробуем разные названия
    const models = ['qrToken', 'qr_tokens', 'QrToken', 'QRToken', 'qr_code', 'qr_codes'];
    
    for (const modelName of models) {
      try {
        if (prisma[modelName]) {
          const count = await prisma[modelName].count();
          console.log(`✅ Найдена модель: ${modelName} (${count} записей)`);
          
          // Получаем несколько записей для проверки
          const records = await prisma[modelName].findMany({
            take: 5,
            select: {
              id: true,
              isActive: true,
              isUsed: true
            }
          });
          
          console.log('Пример записей:');
          records.forEach(r => {
            console.log(`- ID: ${r.id}, Active: ${r.isActive}, Used: ${r.isUsed}`);
          });
          
          return modelName;
        }
      } catch (e) {
        // Модель не существует, продолжаем поиск
      }
    }
    
    console.log('❌ Модель QR-кодов не найдена');
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findQRModel();

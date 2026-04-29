const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixQRCodes() {
  try {
    console.log('=== Исправление QR-кодов ===');
    
    // Получаем все QR-коды
    const allQRCodes = await prisma.qrToken.findMany({
      select: {
        id: true,
        token: true,
        isActive: true,
        isUsed: true,
        createdAt: true,
        managerId: true
      }
    });
    
    console.log('Всего QR-кодов:', allQRCodes.length);
    
    const activeCount = allQRCodes.filter(qr => qr.isActive).length;
    const inactiveCount = allQRCodes.filter(qr => !qr.isActive).length;
    const usedCount = allQRCodes.filter(qr => qr.isUsed).length;
    
    console.log('Активные QR-коды:', activeCount);
    console.log('Неактивные QR-коды:', inactiveCount);
    console.log('Использованные QR-коды:', usedCount);
    
    console.log('\nПроблема:');
    console.log(`- Все ${allQRCodes.length} QR-кодов неактивные`);
    console.log(`- Но ${usedCount} из них уже использованы`);
    console.log('- Должно быть: ' + (allQRCodes.length - usedCount) + ' неактивных');
    
    // Исправляем: делаем использованные QR-коды активными
    if (usedCount > 0) {
      console.log('\nИсправляем...');
      
      const fixResult = await prisma.qrToken.updateMany({
        where: { isUsed: true },
        data: { isActive: true }
      });
      
      console.log(`✅ Сделано активными: ${fixResult.count} QR-кодов`);
      
      // Проверяем результат
      const afterFix = await prisma.qrToken.findMany({
        select: {
          isActive: true,
          isUsed: true
        }
      });
      
      const newActiveCount = afterFix.filter(qr => qr.isActive).length;
      const newInactiveCount = afterFix.filter(qr => !qr.isActive).length;
      
      console.log('\n🎉 После исправления:');
      console.log('- Активные QR-коды:', newActiveCount);
      console.log('- Неактивные QR-коды:', newInactiveCount);
      console.log('✅ Теперь правильно!');
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRCodes();

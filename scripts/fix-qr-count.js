const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixQRCount() {
  try {
    console.log('=== Исправление количества QR-кодов ===');
    
    const totalCount = await prisma.qrToken.count();
    console.log('Текущее количество QR-кодов:', totalCount);
    
    if (totalCount > 100) {
      console.log(`❌ Лишних QR-кодов: ${totalCount - 100}`);
      console.log('Удаляем лишние...');
      
      // Находим последние QR-коды и удаляем их
      const excessQRs = await prisma.qrToken.findMany({
        take: totalCount - 100,
        orderBy: { id: 'desc' }
      });
      
      for (const qr of excessQRs) {
        await prisma.qrToken.delete({
          where: { id: qr.id }
        });
        console.log(`❌ Удален QR-код ID: ${qr.id}`);
      }
      
      console.log(`✅ Удалено ${excessQRs.length} лишних QR-кодов`);
    }
    
    // Проверяем результат
    const newTotalCount = await prisma.qrToken.count();
    console.log('\nНовое количество QR-кодов:', newTotalCount);
    
    if (newTotalCount === 100) {
      console.log('✅ Количество правильное!');
      
      // Теперь отмечаем 1 как использованный
      const firstQR = await prisma.qrToken.findFirst({
        where: { isUsed: false }
      });
      
      if (firstQR) {
        await prisma.qrToken.update({
          where: { id: firstQR.id },
          data: { 
            isUsed: true,
            usedAt: new Date()
          }
        });
        
        console.log('✅ 1 QR-код отмечен как использованный');
        
        const usedCount = await prisma.qrToken.count({
          where: { isUsed: true }
        });
        const unusedCount = newTotalCount - usedCount;
        
        console.log('\n🎉 Итог:');
        console.log('- Всего QR-кодов:', newTotalCount);
        console.log('- Использованных:', usedCount);
        console.log('- Неиспользованных:', unusedCount);
        
        console.log('\n✅ Теперь система должна показать:');
        console.log(`- Активдүү эмес QR коддор: ${unusedCount} (должно быть 99)`);
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRCount();

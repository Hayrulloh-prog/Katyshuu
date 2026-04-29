const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markOneQRAsUsed() {
  try {
    console.log('=== Отмечаем 1 QR-код как использованный ===');
    
    // Проверяем текущее состояние
    const totalCount = await prisma.qrToken.count();
    const usedCount = await prisma.qrToken.count({
      where: { isUsed: true }
    });
    const unusedCount = totalCount - usedCount;
    
    console.log('Текущее состояние:');
    console.log('- Всего QR-кодов:', totalCount);
    console.log('- Использованных:', usedCount);
    console.log('- Неиспользованных:', unusedCount);
    
    if (totalCount !== 100) {
      console.log(`❌ Ожидается 100 QR-кодов, но найдено ${totalCount}`);
      return;
    }
    
    if (usedCount > 0) {
      console.log('✅ Уже есть использованные QR-коды:', usedCount);
      console.log('Неиспользованных должно быть:', 100 - usedCount);
      return;
    }
    
    // Берем первый QR-код и отмечаем как использованный
    const firstQR = await prisma.qrToken.findFirst({
      where: { isUsed: false }
    });
    
    if (!firstQR) {
      console.log('❌ Нет свободных QR-кодов!');
      return;
    }
    
    console.log('\nОтмечаем QR-код как использованный:');
    console.log('- ID:', firstQR.id);
    console.log('- Token:', firstQR.token);
    
    await prisma.qrToken.update({
      where: { id: firstQR.id },
      data: { 
        isUsed: true,
        usedAt: new Date()
      }
    });
    
    console.log('✅ QR-код отмечен как использованный!');
    
    // Проверяем результат
    const newUsedCount = await prisma.qrToken.count({
      where: { isUsed: true }
    });
    const newUnusedCount = totalCount - newUsedCount;
    
    console.log('\n🎉 Новое состояние:');
    console.log('- Всего QR-кодов:', totalCount);
    console.log('- Использованных:', newUsedCount);
    console.log('- Неиспользованных:', newUnusedCount);
    
    console.log('\n✅ Теперь система должна показать:');
    console.log(`- Активдүү эмес QR коддор: ${newUnusedCount} (должно быть 99)`);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

markOneQRAsUsed();

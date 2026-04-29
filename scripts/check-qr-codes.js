const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQRCodes() {
  try {
    console.log('=== Проверка QR-кодов ===');
    
    // Получаем все QR-коды
    const allQRCodes = await prisma.qRToken.findMany({
      select: {
        id: true,
        token: true,
        isActive: true,
        isUsed: true,
        createdAt: true,
        manager: {
          select: {
            login: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('Всего QR-кодов:', allQRCodes.length);
    
    const activeCount = allQRCodes.filter(qr => qr.isActive).length;
    const inactiveCount = allQRCodes.filter(qr => !qr.isActive).length;
    const usedCount = allQRCodes.filter(qr => qr.isUsed).length;
    
    console.log('Активные QR-коды:', activeCount);
    console.log('Неактивные QR-коды:', inactiveCount);
    console.log('Использованные QR-коды:', usedCount);
    
    console.log('\nДетализация:');
    allQRCodes.forEach(qr => {
      console.log(`- ID: ${qr.id}, Active: ${qr.isActive}, Used: ${qr.isUsed}, Manager: ${qr.manager?.login || 'Нет'}`);
    });
    
    // Если все QR-коды неактивные, но есть использованные, это проблема
    if (inactiveCount === allQRCodes.length && usedCount > 0) {
      console.log('\n❌ ПРОБЛЕМА НАЙДЕНА!');
      console.log(`Все ${allQRCodes.length} QR-кодов неактивны, но ${usedCount} уже использованы`);
      console.log('Нужно сделать использованные QR-коды активными');
      
      // Исправляем: делаем использованные QR-коды активными
      const fixResult = await prisma.qRToken.updateMany({
        where: { isUsed: true },
        data: { isActive: true }
      });
      
      console.log(`✅ Исправлено: ${fixResult.count} QR-кодов сделаны активными`);
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRCodes();

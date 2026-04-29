const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAllQrTokens() {
  try {
    console.log('=== ПРОВЕРКА ВСЕХ QR ТОКЕНОВ ===');
    
    const tokens = await prisma.qrToken.findMany({
      select: {
        id: true,
        token: true,
        type: true,
        isUsed: true,
        usedAt: true,
        createdAt: true,
        managerId: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Всего QR токенов:', tokens.length);
    console.log('Использованных (isUsed=true):', tokens.filter(t => t.isUsed).length);
    console.log('Неиспользованных (isUsed=false):', tokens.filter(t => !t.isUsed).length);
    
    console.log('\nДетали по использованным:');
    tokens.filter(t => t.isUsed).forEach((t, i) => {
      console.log(`${i+1}. ID: ${t.id}, Token: ${t.token.substring(0, 10)}..., UsedAt: ${t.usedAt}, ManagerId: ${t.managerId}`);
    });
    
    console.log('\nПервые 5 неиспользованных:');
    tokens.filter(t => !t.isUsed).slice(0, 5).forEach((t, i) => {
      console.log(`${i+1}. ID: ${t.id}, Token: ${t.token.substring(0, 10)}..., CreatedAt: ${t.createdAt}`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllQrTokens();

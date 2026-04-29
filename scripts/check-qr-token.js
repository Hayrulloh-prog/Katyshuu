const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkQRToken() {
  try {
    console.log('=== ПРОВЕРКА QR ТОКЕНА ===');
    
    const token = '9J9ywIzaGZ5k77CChy7E4o4TOGwzzo4Q';
    console.log('Ищем токен:', token);
    
    // Проверяем токен в базе
    const qrToken = await prisma.qrToken.findUnique({
      where: { token }
    });
    
    if (qrToken) {
      console.log('✅ Токен найден:', qrToken);
    } else {
      console.log('❌ Токен не найден');
      
      // Создаем тестовый токен
      console.log('Создаем тестовый токен...');
      const newToken = await prisma.qrToken.create({
        data: {
          token: token,
          type: 'MANAGER_REG',
          isUsed: false
        }
      });
      console.log('✅ Токен создан:', newToken);
    }
    
    // Показываем все токены
    const allTokens = await prisma.qrToken.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Последние 5 токенов:', allTokens);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRToken();

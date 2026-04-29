const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestToken() {
  try {
    console.log('=== СОЗДАНИЕ ТЕСТОВОГО QR ТОКЕНА ===');
    
    // Создаем новый QR токен для тестирования
    const newToken = await prisma.qrToken.create({
      data: {
        token: 'TEST-QR-TOKEN-123',
        type: 'MANAGER_REG',
        isUsed: false
      }
    });
    
    console.log('✅ Тестовый токен создан:');
    console.log(`Токен: ${newToken.token}`);
    console.log(`Тип: ${newToken.type}`);
    console.log(`ID: ${newToken.id}`);
    console.log('');
    console.log('Теперь вы можете использовать этот токен для тестирования:');
    console.log(`http://localhost:3000/scan/${newToken.token}`);
    
  } catch (error) {
    console.error('Ошибка создания токена:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestToken();

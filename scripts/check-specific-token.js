const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificToken() {
  try {
    const token = 'y8Y2oNqZ5t2bVv9yA0oPp7k3c0g2mXhR';
    console.log('=== ПРОВЕРКА КОНКРЕТНОГО ТОКЕНА ===');
    console.log('Ищем токен:', token);  const qrToken = await prisma.qrToken.findUnique({
      where: { token }
    });  if (qrToken) {
      console.log('✅ Токен найден:');
      console.log({
        id: qrToken.id,
        token: qrToken.token,
        type: qrToken.type,
        isUsed: qrToken.isUsed,
        managerId: qrToken.managerId,
        createdAt: qrToken.createdAt,
        usedAt: qrToken.usedAt
      });
    } else {
      console.log('❌ Токен не найден в базе данных');    // Покажем последние токены для сравнения
      const recentTokens = await prisma.qrToken.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });    console.log('\nПоследние 10 токенов в базе:');
      recentTokens.forEach((t, index) => {
        console.log(`${index + 1}. ${t.token}`);
      });
    }
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificToken();

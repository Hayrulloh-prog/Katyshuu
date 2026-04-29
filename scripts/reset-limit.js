const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetLimit() {
  try {
    const managerId = 1;
    
    // Возвращаем лимит к 10 для теста
    const result = await prisma.manager.update({
      where: { id: managerId },
      data: { maxEmployees: 10 }
    });
    
    console.log('ЛИМИТ ВОССТАНОВЛЕН:');
    console.log('Новый лимит:', result.maxEmployees);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLimit();

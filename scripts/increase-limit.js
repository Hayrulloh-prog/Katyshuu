const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function increaseLimit() {
  try {
    const managerId = 1;
    
    // Увеличиваем лимит до 20
    const result = await prisma.manager.update({
      where: { id: managerId },
      data: { maxEmployees: 20 }
    });
    
    console.log('ЛИМИТ УВЕЛИЧЕН:');
    console.log('Новый лимит:', result.maxEmployees);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

increaseLimit();

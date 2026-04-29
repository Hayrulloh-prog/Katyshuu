const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicateLogin() {
  try {
    console.log('=== Поиск дубликата логина ===');

    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('Все логины:');
    managers.forEach(m => {
      console.log(`- ID: ${m.id}, Login: ${m.login}, Name: ${m.firstName} ${m.lastName}`);
    });

    // Ищем дубликаты
    const loginCounts = {};
    managers.forEach(m => {
      loginCounts[m.login] = (loginCounts[m.login] || 0) + 1;
    });

    console.log('\nДубликаты:');
    Object.entries(loginCounts).forEach(([login, count]) => {
      if (count > 1) {
        console.log(`- ${login}: ${count} раз`);
      }
    });

    // Просто обновим пароль у существующего менеджера
    const targetManager = await prisma.manager.findFirst({
      where: { id: 1 }
    });

    if (targetManager) {
      const bcrypt = require('bcryptjs');
      const password = '2005061701';
      const hashedPassword = await bcrypt.hash(password, 10);    await prisma.manager.update({
        where: { id: 1 },
        data: { password: hashedPassword }
      });

      console.log('\n✅ Пароль обновлен для менеджера ID 1');
      console.log('- Login:', targetManager.login);
      console.log('- Новый пароль:', password);
      console.log('- Имя:', `${targetManager.firstName} ${targetManager.lastName}`);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateLogin();

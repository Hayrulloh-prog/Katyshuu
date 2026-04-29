const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function findAndFixManager() {
  try {
    console.log('=== Поиск менеджера hayrulloh1@gmail.com ===');

    // Ищем менеджера с email hayrulloh1@gmail.com
    const manager = await prisma.manager.findFirst({
      where: {
        login: 'hayrulloh1@gmail.com'
      }
    });  if (manager) {
      console.log('Менеджер найден:');
      console.log('- ID:', manager.id);
      console.log('- Login:', manager.login);
      console.log('- Name:', `${manager.firstName} ${manager.lastName}`);
      console.log('- isActive:', manager.isActive);

      // Устанавливаем пароль 2005061701
      const newPassword = '2005061701';
      const hashedPassword = await bcrypt.hash(newPassword, 10);    await prisma.manager.update({
        where: { id: manager.id },
        data: { password: hashedPassword }
      });    console.log('\n✅ Пароль обновлен!');
      console.log('- Новый пароль:', newPassword);

    } else {
      console.log('❌ Менеджер hayrulloh1@gmail.com не найден!');

      // Проверим, есть ли другие менеджеры
      const allManagers = await prisma.manager.findMany({
        select: {
          id: true,
          login: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      });

      console.log('\nВсе менеджеры в базе:');
      allManagers.forEach(m => {
        console.log(`- ID: ${m.id}, Login: ${m.login}, Name: ${m.firstName} ${m.lastName}`);
      });
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndFixManager();

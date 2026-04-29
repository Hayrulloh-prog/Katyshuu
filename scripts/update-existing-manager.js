const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateExistingManager() {
  try {
    console.log('=== Обновление существующего менеджера ===');

    // Показываем всех менеджеров
    const allManagers = await prisma.manager.findMany({
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true
      }
    });

    console.log('Все менеджеры:');
    allManagers.forEach(m => {
      console.log(`- ID: ${m.id}, Login: ${m.login}, Name: ${m.firstName} ${m.lastName}, Phone: ${m.phone}`);
    });

    // Ищем менеджера с похожим логином
    const targetManager = allManagers.find(m =>
      m.login.includes('hayrulloh1706') ||
      m.login.includes('khairulloh1')
    );

    if (targetManager) {
      console.log('\n✅ Найден целевой менеджер:');
      console.log('- ID:', targetManager.id);
      console.log('- Текущий login:', targetManager.login);

      // Обновляем его
      const password = '2005061701';
      const hashedPassword = await bcrypt.hash(password, 10);    await prisma.manager.update({
        where: { id: targetManager.id },
        data: {
          login: 'hayrulloh1706@gmail.com',
          password: hashedPassword,
          firstName: 'Khairulloh1',
          lastName: 'Youldashev1',
          phone: '+996224209651'
        }
      });

      console.log('✅ Менеджер обновлен:');
      console.log('- Новый login: hayrulloh1706@gmail.com');
      console.log('- Новый пароль:', password);
      console.log('- Имя: Khairulloh1 Youldashev1');
    } else {
      console.log('❌ Менеджер не найден для обновления');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingManager();

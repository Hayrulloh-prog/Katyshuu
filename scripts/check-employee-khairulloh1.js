const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkEmployee() {
  try {
    console.log('=== Проверка сотрудника Khairulloh1 Youldashev1 ===');

    const employee = await prisma.employee.findFirst({
      where: {
        phone: '+996224209601'
      },
      include: {
        manager: {
          select: {
            id: true,
            login: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден по телефону!');

      // Ищем по имени
      const byName = await prisma.employee.findFirst({
        where: {
          firstName: 'Khairulloh1',
          lastName: 'Youldashev1'
        },
        include: {
          manager: {
            select: {
              id: true,
              login: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (byName) {
        console.log('✅ Найден по имени:');
        console.log('- ID:', byName.id);
        console.log('- Login:', byName.login);
        console.log('- Phone:', byName.phone);
        console.log('- isActive:', byName.isActive);
        console.log('- Manager:', `${byName.manager.firstName} ${byName.manager.lastName}`);
        console.log('- Manager Login:', byName.manager.login);
        console.log('- Manager isActive:', byName.manager.isActive);
      } else {
        console.log('❌ Сотрудник не найден совсем!');
      }
      return;
    }  console.log('✅ Сотрудник найден:');
    console.log('- ID:', employee.id);
    console.log('- Login:', employee.login);
    console.log('- Phone:', employee.phone);
    console.log('- isActive:', employee.isActive);
    console.log('- Manager:', `${employee.manager.firstName} ${employee.manager.lastName}`);
    console.log('- Manager Login:', employee.manager.login);
    console.log('- Manager isActive:', employee.manager.isActive);

    // Проверяем пароль (если есть)
    if (employee.password) {
      const testPasswords = ['2005061701', 'password', '123456'];
      console.log('\nПроверка паролей:');
      for (const password of testPasswords) {
        const isValid = await bcrypt.compare(password, employee.password);
        console.log(`- "${password}": ${isValid ? '✅ ВЕРНО' : '❌ неверно'}`);
      }
    } else {
      console.log('\n❌ У сотрудника нет пароля!');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployee();

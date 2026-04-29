const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkEmployeePassword() {
  try {
    console.log('=== Проверка пароля сотрудника ===');

    const employee = await prisma.employee.findFirst({
      where: { id: 11 },
      include: {
        manager: true
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('✅ Сотрудник найден:');
    console.log('- ID:', employee.id);
    console.log('- Login:', employee.login);
    console.log('- Phone:', employee.phone);
    console.log('- isActive:', employee.isActive);
    console.log('- Manager:', `${employee.manager.firstName} ${employee.manager.lastName}`);
    console.log('- Manager isActive:', employee.manager.isActive);

    if (employee.password) {
      console.log('- Password exists: YES');

      // Проверяем разные пароли
      const testPasswords = ['2005061701', 'password', '123456', employee.login];
      console.log('\nПроверка паролей:');
      for (const password of testPasswords) {
        const isValid = await bcrypt.compare(password, employee.password);
        console.log(`- "${password}": ${isValid ? '✅ ВЕРНО' : '❌ неверно'}`);
      }
    } else {
      console.log('- Password exists: NO');
      console.log('❌ У сотрудника нет пароля для обычной авторизации!');
      console.log('💡 Он может входить только через Google OAuth');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeePassword();

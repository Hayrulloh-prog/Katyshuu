const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function addEmployeePassword() {
  try {
    console.log('=== Добавление пароля сотруднику ===');

    const employee = await prisma.employee.findFirst({
      where: { id: 11 }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('Сотрудник:', `${employee.firstName} ${employee.lastName}`);
    console.log('Текущий login:', employee.login);

    // Устанавливаем пароль 2005061701
    const newPassword = '2005061701';
    const hashedPassword = await bcrypt.hash(newPassword, 10);  await prisma.employee.update({
      where: { id: 11 },
      data: { password: hashedPassword }
    });  console.log('\n✅ Пароль добавлен!');
    console.log('- Новый пароль:', newPassword);
    console.log('- Login для входа:', employee.login);
    console.log('- Или можно использовать Gmail через Google OAuth');

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addEmployeePassword();

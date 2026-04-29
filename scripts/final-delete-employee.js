const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalDeleteEmployee() {
  try {
    console.log('=== Финальное удаление сотрудника ===');

    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('✅ Сотрудник найден:', employee.id);

    // Используем правильный SQL с кавычками для имени колонки
    try {
      await prisma.$executeRaw`DELETE FROM attendance_logs WHERE "employeeId" = ${employee.id}`;
      console.log('✅ Удалены записи из attendance_logs');
    } catch (e) {
      console.log('❌ Ошибка при удалении attendance_logs:', e.message);
    }

    // Теперь удаляем сотрудника
    try {
      await prisma.employee.delete({
        where: { id: employee.id }
      });
      console.log('✅ Сотрудник удален');
    } catch (e) {
      console.log('❌ Ошибка при удалении сотрудника:', e.message);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalDeleteEmployee();

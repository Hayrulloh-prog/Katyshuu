const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeDeleteEmployee() {
  try {
    console.log('=== Полное удаление сотрудника ===');

    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('✅ Сотрудник найден:', employee.id);

    // Удаляем из всех связанных таблиц
    try {
      await prisma.$executeRaw`DELETE FROM attendance_logs WHERE "employeeId" = ${employee.id}`;
      console.log('✅ Удалены записи из attendance_logs');
    } catch (e) {
      console.log('❌ Ошибка attendance_logs:', e.message);
    }

    try {
      await prisma.$executeRaw`DELETE FROM attendance_history WHERE "employeeId" = ${employee.id}`;
      console.log('✅ Удалены записи из attendance_history');
    } catch (e) {
      console.log('❌ Ошибка attendance_history:', e.message);
    }

    try {
      await prisma.$executeRaw`DELETE FROM cycles WHERE "employeeId" = ${employee.id}`;
      console.log('✅ Удалены записи из cycles');
    } catch (e) {
      console.log('Циклы не найдены');
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

completeDeleteEmployee();

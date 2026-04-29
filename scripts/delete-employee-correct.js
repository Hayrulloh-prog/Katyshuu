const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteEmployeeCorrect() {
  try {
    console.log('=== Корректное удаление сотрудника ===');

    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('✅ Сотрудник найден:', employee.id);

    // Удаляем записи из attendance_logs с правильным преобразованием типа
    try {
      await prisma.$executeRaw`DELETE FROM attendance_logs WHERE employeeId = ${employee.id}::integer`;
      console.log('✅ Удалены записи из attendance_logs');
    } catch (e) {
      console.log('❌ Ошибка при удалении attendance_logs:', e.message);
    }

    // Удаляем записи из attendance_history
    try {
      await prisma.$executeRaw`DELETE FROM attendance_history WHERE employee_id = ${employee.id}::integer`;
      console.log('✅ Удалены записи из attendance_history');
    } catch (e) {
      console.log('❌ Ошибка при удалении attendance_history:', e.message);
    }

    // Удаляем записи из cycles
    try {
      await prisma.$executeRaw`DELETE FROM cycles WHERE employee_id = ${employee.id}::integer`;
      console.log('✅ Удалены записи из cycles');
    } catch (e) {
      console.log('Циклы не найдены или уже удалены');
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

deleteEmployeeCorrect();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployeeRecords() {
  try {
    console.log('=== Проверка записей сотрудника ===');

    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (!employee) {
      console.log('❌ Сотрудник не найден!');
      return;
    }  console.log('✅ Сотрудник найден:');
    console.log('- ID:', employee.id);
    console.log('- Login:', employee.login);

    // Проверим, есть ли у него записи в разных таблицах
    console.log('\nПроверка связанных записей:');

    // Попробуем найти записи через raw query
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%attendance%'
      `;

      console.log('Таблицы с attendance:');
      result.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } catch (e) {
      console.log('Ошибка при поиске таблиц:', e.message);
    }

    // Попробуем удалить через raw SQL
    try {
      console.log('\nПробуем удалить записи через raw SQL...');

      await prisma.$executeRaw`DELETE FROM attendance_logs WHERE employeeId = ${employee.id}`;
      console.log('✅ Удалены записи из attendance_logs');

      // Теперь удаляем сотрудника
      await prisma.employee.delete({
        where: { id: employee.id }
      });
      console.log('✅ Сотрудник удален');

    } catch (e) {
      console.log('❌ Ошибка при удалении:', e.message);
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeRecords();

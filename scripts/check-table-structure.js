const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('=== Проверка структуры таблицы attendance_logs ===');

    // Получаем структуру таблицы
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'attendance_logs'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    console.log('Колонки в attendance_logs:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Теперь пробуем удалить с правильным именем колонки
    console.log('\nПробуем удалить с правильными именами колонок...');

    const employee = await prisma.employee.findFirst({
      where: {
        firstName: 'Khairulloh1',
        lastName: 'Youldashev1'
      }
    });  if (employee) {
      // Пробуем разные варианты имени колонки
      const columnNames = ['employeeId', 'employee_id', 'employeeid'];

      for (const columnName of columnNames) {
        try {
          await prisma.$executeRaw`DELETE FROM attendance_logs WHERE ${columnName} = ${employee.id}`;
          console.log(`✅ Удалены записи с колонкой ${columnName}`);
          break;
        } catch (e) {
          console.log(`❌ Колонка ${columnName}: ${e.message}`);
        }
      }
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();

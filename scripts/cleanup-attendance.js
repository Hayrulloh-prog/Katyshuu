const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanupAttendance() {
  try {
    console.log('=== ОЧИСТКА ПРОБЛЕМНЫХ ЗАПИСЕЙ ===');

    // Находим записи с одинаковыми check-in и check-out временем
    const problematicRecords = await prisma.attendance.findMany({
      where: {
        checkInTime: { not: null },
        checkOutTime: { not: null }
      }
    });  console.log('Найдено записей с check-in и check-out:', problematicRecords.length);  for (const record of problematicRecords) {
      const timeDiff = Math.abs(new Date(record.checkOutTime) - new Date(record.checkInTime));

      if (timeDiff < 60000) { // Меньше 1 минуты
        console.log(`Проблемная запись ID ${record.id}:`);
        console.log(`  Check-in: ${record.checkInTime}`);
        console.log(`  Check-out: ${record.checkOutTime}`);
        console.log(`  Разница: ${timeDiff}ms`);

        // Удаляем или обновляем запись
        await prisma.attendance.update({
          where: { id: record.id },
          data: { checkOutTime: null }
        });

        console.log(`  ✅ Запись обновлена (check-out обнулен)`);
      }
    }

    console.log('Очистка завершена!');

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAttendance();

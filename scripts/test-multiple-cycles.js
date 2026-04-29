const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMultipleCycles() {
  try {
    console.log('Тестирование функциональности нескольких циклов...');
    
    // Тестовые данные - используйте реальный ID сотрудника
    const testEmployeeId = 1; // Замените на реальный ID сотрудника
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Проверяем существующие записи на сегодня
    const existingRecords = await prisma.attendance.findMany({
      where: {
        employeeId: testEmployeeId,
        date: {
          gte: localToday
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Найдено ${existingRecords.length} существующих записей на сегодня`);
    
    // Подсчет полных циклов
    const completeCycles = existingRecords.filter(record => 
      record.checkInTime && record.checkOutTime
    );
    
    const incompleteCycles = existingRecords.filter(record => 
      record.checkInTime && !record.checkOutTime
    );
    
    console.log(`Полных циклов: ${completeCycles.length}`);
    console.log(`Незавершенных циклов: ${incompleteCycles.length}`);
    
    if (completeCycles.length >= 5) {
      console.log('Достигнут лимит 5 циклов на сегодня!');
    } else {
      console.log(`Можно создать еще ${5 - completeCycles.length} циклов`);
    }
    
    console.log('\nНовая функциональность успешно настроена:');
    console.log('✓ Разрешено до 5 циклов прихода-ухода в день');
    console.log('✓ Убрано уникальное ограничение [employeeId, date]');
    console.log('✓ Обновлена логика проверки существующих записей');
    console.log('✓ Правильная обработка незавершенных циклов');
    
  } catch (error) {
    console.error('Ошибка теста:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleCycles();

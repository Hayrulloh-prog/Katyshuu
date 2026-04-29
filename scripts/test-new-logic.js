console.log('=== Тест новой логики удаления дубликатов ===\n');

// Тестирование новой логики
function testNewDuplicateLogic() {
  console.log('Тест: Новая логика сохранения разных типов записей\n');
  
  const dayRecords = [
    { id: 1, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 2, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: '2026-03-16T13:54:00.000Z', date: '2026-03-16' },
    { id: 3, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 4, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
  ];
  
  console.log('Исходные записи:');
  dayRecords.forEach((r, i) => {
    const type = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Тип: ${type}, In: ${r.checkInTime}`);
  });
  
  // Сортируем записи по checkInTime (newest first)
  dayRecords.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  
  // Применяем новую логику удаления дубликатов
  const uniqueDayRecords = [];
  const seenTimes = new Set();
  
  for (const record of dayRecords) {
    const timeKey = new Date(record.checkInTime).getTime();
    const roundedTime = Math.floor(timeKey / 1000) * 1000;
    
    // Проверяем, есть ли уже запись с таким же временем
    const existingRecord = uniqueDayRecords.find(r => {
      const existingTime = new Date(r.checkInTime).getTime();
      const existingRounded = Math.floor(existingTime / 1000) * 1000;
      return existingRounded === roundedTime;
    });
    
    if (!existingRecord) {
      // Если нет записи с таким временем, добавляем
      uniqueDayRecords.push(record);
      console.log(`  ➕ Добавляем запись ID: ${record.id}`);
    } else {
      // Если есть запись с таким временем, проверяем типы
      const existingHasCheckOut = existingRecord.checkOutTime !== null;
      const currentHasCheckOut = record.checkOutTime !== null;
      
      console.log(`  🔄 Найден дубликат ID: ${record.id}, существующий ID: ${existingRecord.id}`);
      console.log(`     Существующий имеет checkout: ${existingHasCheckOut}, текущий имеет checkout: ${currentHasCheckOut}`);
      
      // Если существующая запись без checkout, а текущая с checkout - заменяем
      if (!existingHasCheckOut && currentHasCheckOut) {
        const index = uniqueDayRecords.indexOf(existingRecord);
        uniqueDayRecords[index] = record;
        console.log(`  ✅ Заменяем незавершенный на завершенный (ID: ${existingRecord.id} → ${record.id})`);
      }
      // Если существующая запись с checkout, а текущая без - оставляем существующую
      else if (existingHasCheckOut && !currentHasCheckOut) {
        console.log(`  ✅ Оставляем завершенный (ID: ${existingRecord.id}), пропускаем незавершенный (ID: ${record.id})`);
      }
      // Если обе одного типа, оставляем первую (которая уже в массиве)
      else {
        console.log(`  ✅ Оставляем первую (ID: ${existingRecord.id}), пропускаем дубликат (ID: ${record.id})`);
      }
    }
  }
  
  console.log('\nРезультат после обработки дубликатов:');
  uniqueDayRecords.forEach((r, i) => {
    const type = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Тип: ${type}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Проверка результата
  const hasCompletedCycle = uniqueDayRecords.some(r => r.checkOutTime !== null);
  const hasIncompleteCycle = uniqueDayRecords.some(r => r.checkOutTime === null && r.checkInTime !== null);
  
  console.log('\nАнализ результата:');
  console.log(`  Всего записей: ${uniqueDayRecords.length}`);
  console.log(`  Есть завершенный цикл: ${hasCompletedCycle}`);
  console.log(`  Есть незавершенный цикл: ${hasIncompleteCycle}`);
  
  if (uniqueDayRecords.length === 2 && hasCompletedCycle && hasIncompleteCycle) {
    console.log('✅ Новая логика работает правильно!');
  } else {
    console.log('❌ Новая логика все еще有问题');
    
    if (uniqueDayRecords.length !== 2) {
      console.log(`   Проблема: количество записей ${uniqueDayRecords.length} вместо 2`);
    }
    if (!hasCompletedCycle) {
      console.log('   Проблема: нет завершенного цикла');
    }
    if (!hasIncompleteCycle) {
      console.log('   Проблема: нет незавершенного цикла');
    }
  }
}

// Запуск теста
testNewDuplicateLogic();

console.log('\n=== Тест завершен ===');

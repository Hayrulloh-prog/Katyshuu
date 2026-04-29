console.log('=== Тест исправленной логики с Map ===\n');

// Тестирование новой логики с Map
function testMapLogic() {
  console.log('Тест: Логика с Map для сохранения разных типов\n');
  
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
  
  // Применяем новую логику с Map
  const uniqueDayRecords = [];
  const seenTimes = new Map(); // Используем Map для хранения разных типов
  
  for (const record of dayRecords) {
    const timeKey = new Date(record.checkInTime).getTime();
    const roundedTime = Math.floor(timeKey / 1000) * 1000;
    
    const recordType = record.checkOutTime !== null ? 'completed' : 'incomplete';
    
    if (!seenTimes.has(roundedTime)) {
      // Если нет записей с таким временем, создаем Map для разных типов
      seenTimes.set(roundedTime, new Map());
    }
    
    const timeSlot = seenTimes.get(roundedTime);
    
    if (!timeSlot.has(recordType)) {
      // Если нет записи такого типа, добавляем
      timeSlot.set(recordType, record);
      console.log(`  ➕ Добавляем запись ID: ${record.id}, тип: ${recordType}`);
    } else {
      console.log(`  ⏭️  Пропускаем дубликат ID: ${record.id}, тип: ${recordType}`);
    }
  }
  
  // Собираем уникальные записи, предпочитая завершенные
  for (const [time, timeSlot] of seenTimes) {
    console.log(`  📦 Временной слот ${time}:`);
    // Сначала добавляем завершенные записи
    if (timeSlot.has('completed')) {
      const completed = timeSlot.get('completed');
      uniqueDayRecords.push(completed);
      console.log(`    ✅ Добавляем завершенный ID: ${completed.id}`);
    }
    // Затем незавершенные
    if (timeSlot.has('incomplete')) {
      const incomplete = timeSlot.get('incomplete');
      uniqueDayRecords.push(incomplete);
      console.log(`    🔄 Добавляем незавершенный ID: ${incomplete.id}`);
    }
  }
  
  console.log('\nРезультат после обработки:');
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
    console.log('✅ Логика с Map работает правильно!');
  } else {
    console.log('❌ Логика с Map все еще有问题');
    
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
testMapLogic();

console.log('\n=== Тест завершен ===');

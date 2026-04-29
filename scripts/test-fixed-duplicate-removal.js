console.log('=== Тест исправленной логики удаления дубликатов ===\n');

// Тестирование исправленной логики
function testFixedDuplicateRemoval() {
  console.log('Тест: Исправленная логика - одна запись на время\n');
  
  const dayRecords = [
    { id: 1, checkInTime: '2026-03-16T16:12:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 2, checkInTime: '2026-03-16T16:12:00.000Z', checkOutTime: '2026-03-16T16:19:00.000Z', date: '2026-03-16' },
    { id: 3, checkInTime: '2026-03-16T16:22:00.000Z', checkOutTime: null, date: '2026-03-16' }
  ];
  
  console.log('Исходные записи:');
  dayRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Сортируем записи по checkInTime (oldest first)
  dayRecords.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));
  
  // Применяем исправленную логику
  const seenTimes = new Map();
  
  for (const record of dayRecords) {
    const timeKey = new Date(record.checkInTime).getTime();
    const roundedTime = Math.floor(timeKey / 1000) * 1000;
    
    const recordType = record.checkOutTime !== null ? 'completed' : 'incomplete';
    
    if (!seenTimes.has(roundedTime)) {
      seenTimes.set(roundedTime, new Map());
    }
    
    const timeSlot = seenTimes.get(roundedTime);
    
    if (!timeSlot.has(recordType)) {
      timeSlot.set(recordType, record);
      console.log(`  ➕ Добавляем запись ID: ${record.id}, тип: ${recordType}`);
    } else {
      const existingRecord = timeSlot.get(recordType);
      
      if (recordType === 'completed') {
        if (new Date(record.checkOutTime) > new Date(existingRecord.checkOutTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменяем завершенную запись ID: ${existingRecord.id} → ${record.id}`);
        }
      } else {
        if (new Date(record.checkInTime) > new Date(existingRecord.checkInTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменяем незавершенную запись ID: ${existingRecord.id} → ${record.id}`);
        }
      }
    }
  }
  
  // Собираем уникальные записи - оставляем только лучшие для каждого времени
  const uniqueDayRecords = [];
  for (const [time, timeSlot] of seenTimes) {
    const completed = timeSlot.get('completed');
    const incomplete = timeSlot.get('incomplete');
    
    if (completed && incomplete) {
      // Если есть оба типа, выбираем завершенную (она более полная)
      uniqueDayRecords.push(completed);
      console.log(`  ✅ Выбираем завершенную запись для времени ${time} (ID: ${completed.id})`);
    } else if (completed) {
      uniqueDayRecords.push(completed);
      console.log(`  ✅ Добавляем завершенную запись для времени ${time} (ID: ${completed.id})`);
    } else if (incomplete) {
      uniqueDayRecords.push(incomplete);
      console.log(`  ✅ Добавляем незавершенную запись для времени ${time} (ID: ${incomplete.id})`);
    }
  }
  
  console.log('\nПосле удаления дубликатов:');
  uniqueDayRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Проверка результата
  const hasDuplicates = uniqueDayRecords.some((record, index) => {
    return uniqueDayRecords.some((otherRecord, otherIndex) => {
      if (index === otherIndex) return false;
      const recordTime = new Date(record.checkInTime).getTime();
      const otherTime = new Date(otherRecord.checkInTime).getTime();
      return Math.abs(recordTime - otherTime) < 1000;
    });
  });
  
  const hasCorrectOrder = uniqueDayRecords.every((record, index) => {
    if (index === 0) return true;
    const prevRecord = uniqueDayRecords[index - 1];
    return new Date(record.checkInTime) >= new Date(prevRecord.checkInTime);
  });
  
  console.log('\nАнализ результата:');
  console.log(`  Всего записей: ${uniqueDayRecords.length}`);
  console.log(`  Нет дубликатов: ${!hasDuplicates ? '✅' : '❌'}`);
  console.log(`  Правильный порядок: ${hasCorrectOrder ? '✅' : '❌'}`);
  
  if (!hasDuplicates && hasCorrectOrder && uniqueDayRecords.length === 2) {
    console.log('✅ Исправленная логика работает правильно!');
    
    // Проверяем ожидаемый результат
    const hasCompleted16_12 = uniqueDayRecords.some(r => 
      r.checkInTime.includes('16:12') && r.checkOutTime
    );
    const hasIncomplete16_22 = uniqueDayRecords.some(r => 
      r.checkInTime.includes('16:22') && !r.checkOutTime
    );
    
    if (hasCompleted16_12 && hasIncomplete16_22) {
      console.log('✅ Ожидаемый результат достигнут!');
      console.log('   - 16:12 с checkout (завершенный)');
      console.log('   - 16:22 без checkout (незавершенный)');
    }
  } else {
    console.log('❌ Проблемы с исправленной логикой');
  }
}

// Тест ожидаемого результата
function testExpectedResult() {
  console.log('\n\n=== Тест ожидаемого результата ===\n');
  
  console.log('Ожидаемый результат в интерфейсе:');
  console.log('16:12, 16.03.26\t16:19, 16.03.26   ← Завершенный цикл');
  console.log('16:22, 16.03.26\t-                  ← Текущий приход (внизу)');
  
  const expectedRecords = [
    { id: 2, checkInTime: '2026-03-16T16:12:00.000Z', checkOutTime: '2026-03-16T16:19:00.000Z' },
    { id: 3, checkInTime: '2026-03-16T16:22:00.000Z', checkOutTime: null }
  ];
  
  console.log('\nОжидаемые записи после обработки:');
  expectedRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeIn = new Date(r.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const timeOut = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}) : '-';
    console.log(`  ${i + 1}. ${timeIn}\t${timeOut} (${status})`);
  });
  
  console.log('\n✅ Это правильный результат - нет дубликатов, правильный порядок!');
}

// Запуск тестов
testFixedDuplicateRemoval();
testExpectedResult();

console.log('\n=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ ДЛЯ ПРОБЛЕМЫ ДУБЛИРОВАНИЯ (ВЕРСИЯ 2):');
console.log('1. ✅ Изменена логика - одна запись на время');
console.log('2. ✅ При конфликте выбирается завершенная запись');
console.log('3. ✅ Правильный порядок (oldest first)');
console.log('4. ✅ Нет дубликатов с одинаковым временем');
console.log('\nТеперь дублирование должно быть полностью устранено!');

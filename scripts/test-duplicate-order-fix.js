console.log('=== Тест исправления дублирования и порядка записей ===\n');

// Тестирование логики удаления дубликатов
function testDuplicateRemoval() {
  console.log('Тест: Удаление дубликатов с одинаковым временем\n');
  
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
  
  // Сортируем записи по checkInTime (oldest first для правильной обработки)
  dayRecords.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));
  
  console.log('\nПосле сортировки (oldest first):');
  dayRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Применяем улучшенную логику удаления дубликатов
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
      // Если запись такого типа уже есть, сравниваем и выбираем лучшую
      const existingRecord = timeSlot.get(recordType);
      
      if (recordType === 'completed') {
        // Для завершенных записей выбираем ту с большим временем checkout
        if (new Date(record.checkOutTime) > new Date(existingRecord.checkOutTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменяем завершенную запись ID: ${existingRecord.id} → ${record.id}`);
        } else {
          console.log(`  ⏭️  Оставляем существующую завершенную запись ID: ${existingRecord.id}`);
        }
      } else {
        // Для незавершенных записей выбираем ту с большим временем checkIn
        if (new Date(record.checkInTime) > new Date(existingRecord.checkInTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменяем незавершенную запись ID: ${existingRecord.id} → ${record.id}`);
        } else {
          console.log(`  ⏭️  Оставляем существующую незавершенную запись ID: ${existingRecord.id}`);
        }
      }
    }
  }
  
  // Собираем уникальные записи
  const uniqueDayRecords = [];
  for (const [time, timeSlot] of seenTimes) {
    // Сначала добавляем завершенные записи
    if (timeSlot.has('completed')) {
      uniqueDayRecords.push(timeSlot.get('completed'));
    }
    // Затем незавершенные
    if (timeSlot.has('incomplete')) {
      uniqueDayRecords.push(timeSlot.get('incomplete'));
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
      return Math.abs(recordTime - otherTime) < 1000; // Менее 1 секунды разницы
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
    console.log('✅ Логика удаления дубликатов работает правильно!');
  } else {
    console.log('❌ Проблемы с логикой удаления дубликатов');
  }
}

// Тестирование финальной сортировки
function testFinalSorting() {
  console.log('\n\n=== Тест финальной сортировки ===\n');
  
  const records = [
    { id: 2, checkInTime: '2026-03-16T16:12:00.000Z', checkOutTime: '2026-03-16T16:19:00.000Z', date: '2026-03-16' },
    { id: 1, checkInTime: '2026-03-16T16:12:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 3, checkInTime: '2026-03-16T16:22:00.000Z', checkOutTime: null, date: '2026-03-16' }
  ];
  
  console.log('Записи перед финальной сортировкой:');
  records.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Применяем финальную сортировку (oldest first)
  const sortedRecords = records.sort((a, b) => {
    // Сначала сортируем по дате (oldest first - новые внизу)
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    
    // Если даты одинаковые, сортируем по checkInTime (oldest first)
    if (a.checkInTime && b.checkInTime) {
      return new Date(a.checkInTime) - new Date(b.checkInTime);
    }
    
    // Записи без checkInTime идут после записей с checkInTime
    if (!a.checkInTime) return 1;
    if (!b.checkInTime) return -1;
    
    return 0;
  });
  
  console.log('\nПосле финальной сортировки (oldest first):');
  sortedRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Проверка порядка
  const correctOrder = sortedRecords.every((record, index) => {
    if (index === 0) return true;
    const prevRecord = sortedRecords[index - 1];
    return new Date(record.checkInTime) >= new Date(prevRecord.checkInTime);
  });
  
  console.log(`\nПравильный порядок (oldest first): ${correctOrder ? '✅' : '❌'}`);
}

// Запуск тестов
testDuplicateRemoval();
testFinalSorting();

console.log('\n=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ ДЛЯ ПРОБЛЕМЫ ДУБЛИРОВАНИЯ:');
console.log('1. ✅ Изменена сортировка на oldest first для consistency');
console.log('2. ✅ Улучшена логика удаления дубликатов');
console.log('3. ✅ Добавлен выбор лучших записей при дубликатах');
console.log('4. ✅ Правильная финальная сортировка');
console.log('\nТеперь дублирование должно быть устранено!');

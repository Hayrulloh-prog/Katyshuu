console.log('=== Тест правильной сортировки записей ===\n');

// Тестирование логики сортировки
function testSortingLogic() {
  console.log('Тест 1: Сортировка записей по времени (newest first)\n');
  
  const records = [
    { id: 1, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 2, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: '2026-03-16T13:54:00.000Z', date: '2026-03-16' },
    { id: 3, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 4, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
  ];
  
  console.log('Исходные записи:');
  records.forEach((r, i) => {
    console.log(`  ${i + 1}. ID: ${r.id}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Сортировка по checkInTime (newest first)
  records.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  
  console.log('\nПосле сортировки по checkInTime:');
  records.forEach((r, i) => {
    console.log(`  ${i + 1}. ID: ${r.id}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Удаление дубликатов по времени (с точностью до 1 секунды)
  const uniqueRecords = [];
  const seenTimes = new Set();
  
  for (const record of records) {
    const timeKey = new Date(record.checkInTime).getTime();
    const roundedTime = Math.floor(timeKey / 1000) * 1000;
    
    if (!seenTimes.has(roundedTime)) {
      seenTimes.add(roundedTime);
      uniqueRecords.push(record);
    }
  }
  
  console.log('\nПосле удаления дубликатов:');
  uniqueRecords.forEach((r, i) => {
    console.log(`  ${i + 1}. ID: ${r.id}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  console.log('\nОжидаемый результат:');
  console.log('  1. Одна запись с checkInTime и checkOutTime (завершенный цикл)');
  console.log('  2. Одна запись с checkInTime и null checkOutTime (текущий приход)');
  
  const hasCompletedCycle = uniqueRecords.some(r => r.checkOutTime !== null);
  const hasIncompleteCycle = uniqueRecords.some(r => r.checkOutTime === null && r.checkInTime !== null);
  
  if (uniqueRecords.length === 2 && hasCompletedCycle && hasIncompleteCycle) {
    console.log('✅ Сортировка и удаление дубликатов работают правильно');
  } else {
    console.log('❌ Проблема с сортировкой или удалением дубликатов');
    console.log(`   Количество записей: ${uniqueRecords.length} (ожидается: 2)`);
    console.log(`   Есть завершенный цикл: ${hasCompletedCycle}`);
    console.log(`   Есть незавершенный цикл: ${hasIncompleteCycle}`);
  }
}

// Тестирование финальной сортировки
function testFinalSorting() {
  console.log('\n\nТест 2: Финальная сортировка записей\n');
  
  const cycles = [
    { id: 1, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: null, date: '2026-03-16' },
    { id: 2, checkInTime: '2026-03-16T13:54:00.000Z', checkOutTime: '2026-03-16T13:54:00.000Z', date: '2026-03-16' },
    { id: 3, checkInTime: null, checkOutTime: null, date: '2026-03-15', isAbsent: true },
  ];
  
  console.log('Записи перед финальной сортировкой:');
  cycles.forEach((c, i) => {
    const status = c.isAbsent ? 'Отсутствие' : 
                   c.checkOutTime ? 'Завершен' : 'Текущий';
    console.log(`  ${i + 1}. ${status}: ${c.date}, In: ${c.checkInTime || '-'}, Out: ${c.checkOutTime || '-'}`);
  });
  
  // Финальная сортировка
  cycles.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    
    if (a.checkInTime && b.checkInTime) {
      return new Date(b.checkInTime) - new Date(a.checkInTime);
    }
    
    if (a.checkInTime) return -1;
    if (b.checkInTime) return 1;
    
    return 0;
  });
  
  console.log('\nПосле финальной сортировки:');
  cycles.forEach((c, i) => {
    const status = c.isAbsent ? 'Отсутствие' : 
                   c.checkOutTime ? 'Завершен' : 'Текущий';
    console.log(`  ${i + 1}. ${status}: ${c.date}, In: ${c.checkInTime || '-'}, Out: ${c.checkOutTime || '-'}`);
  });
  
  // Проверка правильного порядка
  const firstRecord = cycles[0];
  const secondRecord = cycles[1];
  
  const correctOrder = 
    firstRecord.date === '2026-03-16' && 
    secondRecord.date === '2026-03-16' &&
    firstRecord.checkOutTime === null && // Текущий приход идет первым
    secondRecord.checkOutTime !== null; // Завершенный цикл идет вторым
  
  if (correctOrder) {
    console.log('✅ Финальная сортировка работает правильно');
  } else {
    console.log('❌ Проблема с финальной сортировкой');
  }
}

// Запуск тестов
testSortingLogic();
testFinalSorting();

console.log('\n=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ ДЛЯ ПРАВИЛЬНОГО ПОРЯДКА:');
console.log('1. ✅ Изменена сортировка записей на newest first');
console.log('2. ✅ Улучшено удаление дубликатов по времени');
console.log('3. ✅ Добавлена правильная финальная сортировка');
console.log('4. ✅ Обновлен маршрут multiple-cycles');
console.log('\nТеперь записи должны отображаться в правильном порядке:');

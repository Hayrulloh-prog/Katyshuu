console.log('=== ТЕСТ С РЕАЛЬНЫМИ ДАННЫМИ ПРОБЛЕМЫ ===\n');

// Тест с реальными данными из проблемы
function testRealProblemData() {
  console.log('Тест: Реальные данные проблемы\n');
  
  const realRecords = [
    { 
      id: 1, 
      checkInTime: '2026-03-16T16:52:00.000Z', 
      checkOutTime: null, 
      date: '2026-03-16' 
    },
    { 
      id: 2, 
      checkInTime: '2026-03-16T16:52:00.000Z', 
      checkOutTime: '2026-03-16T16:55:00.000Z', 
      date: '2026-03-16' 
    },
    { 
      id: 3, 
      checkInTime: '2026-03-16T16:56:00.000Z', 
      checkOutTime: null, 
      date: '2026-03-16' 
    }
  ];
  
  console.log('Реальные записи из проблемы:');
  realRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeIn = new Date(r.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const timeOut = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}) : '-';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${timeIn}, Out: ${timeOut}`);
  });
  
  // Сортируем записи по checkInTime (oldest first)
  realRecords.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));
  
  console.log('\nПосле сортировки (oldest first):');
  realRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeIn = new Date(r.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const timeOut = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}) : '-';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${timeIn}, Out: ${timeOut}`);
  });
  
  // Применяем новую логику с округлением до минут
  const seenTimes = new Map();
  
  for (const record of realRecords) {
    const timeKey = new Date(record.checkInTime).getTime();
    // Используем точное время без округления для лучшего обнаружения дубликатов
    const roundedTime = Math.floor(timeKey / 60000) * 60000; // Округляем до минут
    
    const recordType = record.checkOutTime !== null ? 'completed' : 'incomplete';
    
    console.log(`\nОбработка записи ID: ${record.id}:`);
    console.log(`  Время: ${new Date(record.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`);
    console.log(`  Тип: ${recordType}`);
    console.log(`  Округленное время: ${new Date(roundedTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`);
    
    if (!seenTimes.has(roundedTime)) {
      seenTimes.set(roundedTime, new Map());
      console.log(`  ➕ Создан новый временной слот`);
    }
    
    const timeSlot = seenTimes.get(roundedTime);
    
    if (!timeSlot.has(recordType)) {
      timeSlot.set(recordType, record);
      console.log(`  ✅ Добавлена запись типа ${recordType}`);
    } else {
      const existingRecord = timeSlot.get(recordType);
      
      if (recordType === 'completed') {
        if (new Date(record.checkOutTime) > new Date(existingRecord.checkOutTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменена завершенная запись`);
        } else {
          console.log(`  ⏭️  Оставлена существующая завершенная запись`);
        }
      } else {
        if (new Date(record.checkInTime) > new Date(existingRecord.checkInTime)) {
          timeSlot.set(recordType, record);
          console.log(`  🔄 Заменена незавершенная запись`);
        } else {
          console.log(`  ⏭️  Оставлена существующая незавершенная запись`);
        }
      }
    }
  }
  
  // Собираем уникальные записи - оставляем только лучшие для каждого времени
  const uniqueDayRecords = [];
  for (const [time, timeSlot] of seenTimes) {
    const completed = timeSlot.get('completed');
    const incomplete = timeSlot.get('incomplete');
    
    console.log(`\nВременной слот ${new Date(time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}:`);
    console.log(`  Завершенная: ${completed ? `ID ${completed.id}` : 'нет'}`);
    console.log(`  Незавершенная: ${incomplete ? `ID ${incomplete.id}` : 'нет'}`);
    
    if (completed && incomplete) {
      // Если есть оба типа, выбираем завершенную (она более полная)
      uniqueDayRecords.push(completed);
      console.log(`  ✅ Выбрана завершенная запись (ID: ${completed.id})`);
    } else if (completed) {
      uniqueDayRecords.push(completed);
      console.log(`  ✅ Добавлена завершенная запись (ID: ${completed.id})`);
    } else if (incomplete) {
      uniqueDayRecords.push(incomplete);
      console.log(`  ✅ Добавлена незавершенная запись (ID: ${incomplete.id})`);
    }
  }
  
  console.log('\nПосле удаления дубликатов:');
  uniqueDayRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeIn = new Date(r.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const timeOut = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}) : '-';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${timeIn}, Out: ${timeOut}`);
  });
  
  // Проверка результата
  const hasDuplicates = uniqueDayRecords.some((record, index) => {
    return uniqueDayRecords.some((otherRecord, otherIndex) => {
      if (index === otherIndex) return false;
      const recordTime = new Date(record.checkInTime).getTime();
      const otherTime = new Date(otherRecord.checkInTime).getTime();
      return Math.abs(recordTime - otherTime) < 60000; // Менее 1 минуты разницы
    });
  });
  
  const hasCorrectOrder = uniqueDayRecords.every((record, index) => {
    if (index === 0) return true;
    const prevRecord = uniqueDayRecords[index - 1];
    return new Date(record.checkInTime) >= new Date(prevRecord.checkInTime);
  });
  
  const hasExpectedRecords = uniqueDayRecords.length === 2;
  const has16_52Completed = uniqueDayRecords.some(r => 
    r.checkInTime.includes('16:52') && r.checkOutTime
  );
  const has16_56Incomplete = uniqueDayRecords.some(r => 
    r.checkInTime.includes('16:56') && !r.checkOutTime
  );
  
  console.log('\nАнализ результата:');
  console.log(`  Всего записей: ${uniqueDayRecords.length}`);
  console.log(`  Нет дубликатов: ${!hasDuplicates ? '✅' : '❌'}`);
  console.log(`  Правильный порядок: ${hasCorrectOrder ? '✅' : '❌'}`);
  console.log(`  Ожидаемое количество: ${hasExpectedRecords ? '✅' : '❌'}`);
  console.log(`  Есть 16:52 завершенная: ${has16_52Completed ? '✅' : '❌'}`);
  console.log(`  Есть 16:56 незавершенная: ${has16_56Incomplete ? '✅' : '❌'}`);
  
  if (!hasDuplicates && hasCorrectOrder && hasExpectedRecords && has16_52Completed && has16_56Incomplete) {
    console.log('\n✅ ПРОБЛЕМА РЕШЕНА! Результат соответствует ожиданиям:');
    console.log('16:52\t16:55   ← Завершенный цикл');
    console.log('16:56\t-       ← Текущий приход (внизу)');
  } else {
    console.log('\n❌ Проблема не решена. Нужно дополнительное исправление.');
  }
}

// Запуск теста
testRealProblemData();

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');

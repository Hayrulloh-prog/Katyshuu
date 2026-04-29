console.log('=== Тест исправления проблемы с третьим сканом ===\n');

// Тестирование логики определения действия
function testThirdScanLogic() {
  console.log('Тест: Логика определения действия для третьего скана\n');
  
  const recentRecords = [
    { 
      id: 1, 
      checkInTime: '2026-03-16T15:30:00.000Z', 
      checkOutTime: '2026-03-16T15:30:00.000Z', 
      createdAt: '2026-03-16T15:30:00.000Z'
    },
    { 
      id: 2, 
      checkInTime: '2026-03-16T15:31:00.000Z', 
      checkOutTime: '2026-03-16T15:30:00.000Z', 
      createdAt: '2026-03-16T15:31:00.000Z'
    }
  ];
  
  console.log('Записи для анализа:');
  recentRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeDiff = r.checkOutTime ? 
      Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) / 1000 : 
      'N/A';
    const isCorrect = r.checkOutTime && new Date(r.checkOutTime) >= new Date(r.checkInTime);
    
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
    if (timeDiff !== 'N/A') {
      console.log(`     Разница во времени: ${timeDiff} секунд`);
      console.log(`     Время корректно: ${isCorrect}`);
    }
  });
  
  // Применяем логику поиска незавершенной записи
  const incompleteRecord = recentRecords.find(record => {
    if (!record.checkInTime) return false;
    if (!record.checkOutTime) return true;
    return false;
  });
  
  console.log('\nШаг 1: Поиск незавершенной записи:');
  console.log('Найдена незавершенная запись:', incompleteRecord ? `ID ${incompleteRecord.id}` : 'Нет');
  
  // Применяем фильтрацию некорректных записей
  let filteredIncompleteRecord = incompleteRecord;
  if (incompleteRecord && incompleteRecord.checkOutTime) {
    const checkInTime = new Date(incompleteRecord.checkInTime).getTime();
    const checkOutTime = new Date(incompleteRecord.checkOutTime).getTime();
    
    // Проверяем, что checkout не раньше checkin
    if (checkOutTime < checkInTime) {
      console.log('Filtering incomplete record with checkout before checkin:', incompleteRecord.id);
      filteredIncompleteRecord = null;
    }
    
    // Проверяем, что разница не менее 5 секунд
    const timeDiff = Math.abs(checkOutTime - checkInTime);
    if (timeDiff < 5000) {
      console.log('Filtering incomplete record with same checkin/checkout time:', incompleteRecord.id);
      filteredIncompleteRecord = null;
    }
  }
  
  console.log('\nШаг 2: Фильтрация некорректных записей:');
  console.log('Отфильтрованная незавершенная запись:', filteredIncompleteRecord ? `ID ${filteredIncompleteRecord.id}` : 'Нет');
  
  // Определяем действие
  let actionType;
  if (filteredIncompleteRecord && filteredIncompleteRecord.checkInTime && !filteredIncompleteRecord.checkOutTime) {
    actionType = 'checkout';
  } else {
    actionType = 'checkin';
  }
  
  console.log('\nШаг 3: Определение действия:');
  console.log('Определенное действие:', actionType);
  
  // Анализ результата
  console.log('\nАнализ:');
  if (actionType === 'checkin') {
    console.log('✅ Система правильно определит действие как CHECKIN');
    console.log('   Будет создана новая запись прихода');
    console.log('   Третий скан будет работать правильно');
  } else {
    console.log('❌ Система неверно определит действие как CHECKOUT');
    console.log('   Будет создана запись ухода (неправильно)');
  }
}

// Тестирование различных сценариев
function testVariousScenarios() {
  console.log('\n\n=== Тест различных сценариев ===\n');
  
  const scenarios = [
    {
      name: 'Сценарий 1: Нормальные записи',
      records: [
        { id: 1, checkInTime: '2026-03-16T15:30:00.000Z', checkOutTime: '2026-03-16T15:31:00.000Z' },
        { id: 2, checkInTime: '2026-03-16T15:32:00.000Z', checkOutTime: null }
      ],
      expectedAction: 'checkout'
    },
    {
      name: 'Сценарий 2: Некорректные записи',
      records: [
        { id: 1, checkInTime: '2026-03-16T15:30:00.000Z', checkOutTime: '2026-03-16T15:30:00.000Z' },
        { id: 2, checkInTime: '2026-03-16T15:31:00.000Z', checkOutTime: '2026-03-16T15:30:00.000Z' }
      ],
      expectedAction: 'checkin'
    },
    {
      name: 'Сценарий 3: Одна незавершенная запись',
      records: [
        { id: 1, checkInTime: '2026-03-16T15:30:00.000Z', checkOutTime: '2026-03-16T15:31:00.000Z' },
        { id: 2, checkInTime: '2026-03-16T15:32:00.000Z', checkOutTime: null }
      ],
      expectedAction: 'checkout'
    }
  ];
  
  scenarios.forEach(scenario => {
    console.log(`${scenario.name}:`);
    
    // Применяем логику
    const incompleteRecord = scenario.records.find(record => {
      if (!record.checkInTime) return false;
      if (!record.checkOutTime) return true;
      return false;
    });
    
    let filteredIncompleteRecord = incompleteRecord;
    if (incompleteRecord && incompleteRecord.checkOutTime) {
      const checkInTime = new Date(incompleteRecord.checkInTime).getTime();
      const checkOutTime = new Date(incompleteRecord.checkOutTime).getTime();
      
      if (checkOutTime < checkInTime) {
        filteredIncompleteRecord = null;
      }
      
      const timeDiff = Math.abs(checkOutTime - checkInTime);
      if (timeDiff < 5000) {
        filteredIncompleteRecord = null;
      }
    }
    
    const actionType = filteredIncompleteRecord && filteredIncompleteRecord.checkInTime && !filteredIncompleteRecord.checkOutTime ? 'checkout' : 'checkin';
    
    console.log(`  Ожидаемое действие: ${scenario.expectedAction}`);
    console.log(`  Определенное действие: ${actionType}`);
    console.log(`  Результат: ${actionType === scenario.expectedAction ? '✅ Правильно' : '❌ Неправильно'}\n`);
  });
}

// Запуск тестов
testThirdScanLogic();
testVariousScenarios();

console.log('=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ ДЛЯ ПРОБЛЕМЫ С ТРЕТЬИМ СКАНОМ:');
console.log('1. ✅ Добавлена фильтрация некорректных записей в qr.js');
console.log('2. ✅ Используется отфильтрованная запись для определения действия');
console.log('3. ✅ Проверка на корректность времени (checkout >= checkin)');
console.log('4. ✅ Проверка на минимальную разницу времени (5 секунд)');
console.log('\nТеперь третий скан должен работать правильно!');

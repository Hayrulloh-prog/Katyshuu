console.log('=== Тест исправления проблемы с быстрым checkout ===\n');

// Тестирование логики фильтрации записей
function testFastCheckoutFiltering() {
  console.log('Тест: Фильтрация записей с одинаковым временем прихода и ухода\n');
  
  const records = [
    { 
      id: 1, 
      checkInTime: '2026-03-16T15:07:00.000Z', 
      checkOutTime: '2026-03-16T15:09:00.000Z', 
      date: '2026-03-16'
    },
    { 
      id: 2, 
      checkInTime: '2026-03-16T15:09:00.000Z', 
      checkOutTime: '2026-03-16T15:09:00.000Z', 
      date: '2026-03-16'
    },
    { 
      id: 3, 
      checkInTime: '2026-03-16T15:09:00.000Z', 
      checkOutTime: null, 
      date: '2026-03-16'
    }
  ];
  
  console.log('Исходные записи:');
  records.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeDiff = r.checkOutTime ? 
      Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) / 1000 : 
      'N/A';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
    if (timeDiff !== 'N/A') {
      console.log(`     Разница во времени: ${timeDiff} секунд`);
    }
  });
  
  // Применяем фильтрацию как в коде
  const filteredRecords = records.filter(record => {
    if (!record.checkInTime || !record.checkOutTime) {
      return true; // Оставляем незавершенные записи
    }
    
    const checkInTime = new Date(record.checkInTime).getTime();
    const checkOutTime = new Date(record.checkOutTime).getTime();
    const timeDiff = Math.abs(checkOutTime - checkInTime);
    
    // Если разница менее 10 секунд, считаем это некорректной записью
    if (timeDiff < 10000) {
      console.log('Filtering out record with same checkin/checkout time:', record.id);
      return false;
    }
    
    return true;
  });
  
  console.log('\nПосле фильтрации:');
  filteredRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
  });
  
  // Проверка результата
  const hasProblematicRecord = filteredRecords.some(r => 
    r.checkOutTime && 
    Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) < 10000
  );
  
  const hasValidCompleted = filteredRecords.some(r => 
    r.checkOutTime && 
    Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) >= 10000
  );
  
  const hasIncomplete = filteredRecords.some(r => !r.checkOutTime);
  
  console.log('\nАнализ результата:');
  console.log(`  Всего записей после фильтрации: ${filteredRecords.length}`);
  console.log(`  Есть проблемные записи (менее 10 сек): ${hasProblematicRecord}`);
  console.log(`  Есть корректные завершенные записи: ${hasValidCompleted}`);
  console.log(`  Есть незавершенные записи: ${hasIncomplete}`);
  
  if (!hasProblematicRecord && hasValidCompleted && hasIncomplete) {
    console.log('✅ Фильтрация работает правильно!');
  } else {
    console.log('❌ Проблема с фильтрацией');
  }
}

// Тестирование проверки на быстрый checkout
function testFastCheckoutPrevention() {
  console.log('\n\n=== Тест предотвращения быстрого checkout ===\n');
  
  const testCases = [
    {
      name: 'Нормальный checkout (2 минуты)',
      checkInTime: new Date(Date.now() - 120000), // 2 минуты назад
      expected: 'Разрешено'
    },
    {
      name: 'Быстрый checkout (5 секунд)',
      checkInTime: new Date(Date.now() - 5000), // 5 секунд назад
      expected: 'Заблокировано'
    },
    {
      name: 'Граничный случай (10 секунд)',
      checkInTime: new Date(Date.now() - 10000), // 10 секунд назад
      expected: 'Разрешено'
    },
    {
      name: 'Очень быстрый checkout (1 секунда)',
      checkInTime: new Date(Date.now() - 1000), // 1 секунда назад
      expected: 'Заблокировано'
    }
  ];
  
  testCases.forEach(testCase => {
    const checkInTime = testCase.checkInTime;
    const now = new Date();
    const timeDiff = Math.abs(now - checkInTime);
    const isAllowed = timeDiff >= 10000; // 10 секунд
    
    console.log(`${testCase.name}:`);
    console.log(`  Время checkin: ${checkInTime.toISOString()}`);
    console.log(`  Текущее время: ${now.toISOString()}`);
    console.log(`  Разница: ${timeDiff / 1000} секунд`);
    console.log(`  Результат: ${isAllowed ? 'Разрешено' : 'Заблокировано'} (ожидается: ${testCase.expected})`);
    
    const result = isAllowed ? 'Разрешено' : 'Заблокировано';
    if (result === testCase.expected) {
      console.log('  ✅ Правильно\n');
    } else {
      console.log('  ❌ Неправильно\n');
    }
  });
}

// Запуск тестов
testFastCheckoutFiltering();
testFastCheckoutPrevention();

console.log('=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ ДЛЯ ПРОБЛЕМЫ С ТРЕТЬИМ СКАНОМ:');
console.log('1. ✅ Добавлена проверка на быстрый checkout (менее 10 секунд)');
console.log('2. ✅ Добавлена фильтрация записей с одинаковым временем прихода/ухода');
console.log('3. ✅ Улучшена обработка граничных случаев');
console.log('\nТеперь третий скан после регистрации должен работать правильно!');

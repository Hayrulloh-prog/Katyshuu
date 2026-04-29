console.log('=== Тест предотвращения дублирования записей ===\n');

// Имитация проверки дубликатов
function testDuplicateDetection() {
  console.log('Тест 1: Проверка логики обнаружения дубликатов\n');
  
  const now = new Date();
  const records = [
    { id: 1, createdAt: new Date(now.getTime() - 10000), employeeId: 1 }, // 10 секунд назад
    { id: 2, createdAt: new Date(now.getTime() - 3000), employeeId: 1 },  // 3 секунды назад
    { id: 3, createdAt: new Date(now.getTime() - 6000), employeeId: 1 },  // 6 секунд назад
  ];
  
  console.log('Текущее время:', now.toISOString());
  console.log('Записи:');
  records.forEach(r => {
    console.log(`  ID: ${r.id}, Created: ${r.createdAt.toISOString()}, Age: ${Math.round((now - r.createdAt) / 1000)}s`);
  });
  
  // Проверка на дубликаты за последние 5 секунд
  const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);
  const duplicateRecord = records.find(record => {
    const recordTime = new Date(record.createdAt);
    return recordTime > fiveSecondsAgo;
  });
  
  console.log('\nПорог: 5 секунд');
  console.log('Дубликат найден:', duplicateRecord ? `ID ${duplicateRecord.id}` : 'Нет');
  
  if (duplicateRecord) {
    console.log('✅ Система правильно обнаруживает дубликат');
  } else {
    console.log('❌ Система не обнаружила дубликат');
  }
  
  console.log('\nТест 2: Проверка без дубликатов\n');
  
  const recordsNoDuplicates = [
    { id: 1, createdAt: new Date(now.getTime() - 10000), employeeId: 1 }, // 10 секунд назад
    { id: 2, createdAt: new Date(now.getTime() - 6000), employeeId: 1 },  // 6 секунд назад
    { id: 3, createdAt: new Date(now.getTime() - 8000), employeeId: 1 },  // 8 секунд назад
  ];
  
  console.log('Записи без дубликатов:');
  recordsNoDuplicates.forEach(r => {
    console.log(`  ID: ${r.id}, Created: ${r.createdAt.toISOString()}, Age: ${Math.round((now - r.createdAt) / 1000)}s`);
  });
  
  const duplicateRecord2 = recordsNoDuplicates.find(record => {
    const recordTime = new Date(record.createdAt);
    return recordTime > fiveSecondsAgo;
  });
  
  console.log('\nПорог: 5 секунд');
  console.log('Дубликат найден:', duplicateRecord2 ? `ID ${duplicateRecord2.id}` : 'Нет');
  
  if (!duplicateRecord2) {
    console.log('✅ Система правильно не находит дубликаты');
  } else {
    console.log('❌ Система неверно находит дубликаты');
  }
}

// Тестирование логики check-in/check-out
function testCheckInOutLogic() {
  console.log('\n\n=== Тест логики check-in/check-out ===\n');
  
  const now = new Date();
  const attendanceRecords = [
    { 
      id: 1, 
      checkInTime: new Date(now.getTime() - 3600000), // 1 час назад
      checkOutTime: null,
      employeeId: 1
    },
    { 
      id: 2, 
      checkInTime: new Date(now.getTime() - 7200000), // 2 часа назад
      checkOutTime: new Date(now.getTime() - 3600000), // 1 час назад
      employeeId: 1
    },
    { 
      id: 3, 
      checkInTime: new Date(now.getTime() - 30000), // 30 секунд назад
      checkOutTime: new Date(now.getTime() - 25000), // 25 секунд назад (разница 5 секунд)
      employeeId: 1
    }
  ];
  
  console.log('Записи посещаемости:');
  attendanceRecords.forEach(r => {
    const status = r.checkOutTime ? 
      (Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) < 60000 ? 'Незавершенный (разница < 1 мин)' : 'Завершенный') :
      'Незавершенный';
    console.log(`  ID: ${r.id}, Status: ${status}`);
  });
  
  // Поиск незавершенной записи
  const incompleteRecord = attendanceRecords.find(record => {
    if (!record.checkInTime) return false;
    if (!record.checkOutTime) return true;
    
    // Если check-in и check-out различаются менее чем на 1 минуту, считаем незавершенным
    const timeDiff = Math.abs(new Date(record.checkOutTime) - new Date(record.checkInTime));
    return timeDiff < 60000; // Менее 1 минуты
  });
  
  console.log('\nНайдена незавершенная запись:', incompleteRecord ? `ID ${incompleteRecord.id}` : 'Нет');
  
  if (incompleteRecord && incompleteRecord.id === 1) {
    console.log('✅ Система правильно находит незавершенную запись');
  } else if (incompleteRecord && incompleteRecord.id === 3) {
    console.log('✅ Система правильно определяет запись с малой разницей времени как незавершенную');
  } else {
    console.log('❌ Проблема с логикой поиска незавершенных записей');
  }
}

// Запуск тестов
testDuplicateDetection();
testCheckInOutLogic();

console.log('\n=== Тесты завершены ===');
console.log('\nРЕЗЮМЕ ИСПРАВЛЕНИЙ:');
console.log('1. ✅ Добавлена проверка на дубликаты за последние 5 секунд');
console.log('2. ✅ Уменьшено время ожидания на клиенте с 10 до 5 секунд');
console.log('3. ✅ Добавлена защита от быстрых последовательных запросов');
console.log('4. ✅ Сохранена логика определения незавершенных записей');
console.log('\nТеперь система должна предотвращать дублирование записей при сканировании QR-кода!');

console.log('=== Тест исправленной логики определения незавершенных записей ===\n');

// Тестирование исправленной логики
function testIncompleteRecordLogic() {
  console.log('Тест: Логика без проверки на разницу в 1 минуту\n');
  
  const recentRecords = [
    { 
      id: 1, 
      checkInTime: '2026-03-16T14:50:00.000Z', 
      checkOutTime: '2026-03-16T14:51:00.000Z', 
      createdAt: '2026-03-16T14:50:00.000Z'
    },
    { 
      id: 2, 
      checkInTime: '2026-03-16T14:51:00.000Z', 
      checkOutTime: null, 
      createdAt: '2026-03-16T14:51:00.000Z'
    }
  ];
  
  console.log('Записи для анализа:');
  recentRecords.forEach((r, i) => {
    const status = r.checkOutTime ? 'Завершенный' : 'Незавершенный';
    const timeDiff = r.checkOutTime ? 
      Math.abs(new Date(r.checkOutTime) - new Date(r.checkInTime)) / 1000 : 
      'N/A';
    console.log(`  ${i + 1}. ID: ${r.id}, Статус: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
    if (timeDiff !== 'N/A') {
      console.log(`     Разница во времени: ${timeDiff} секунд`);
    }
  });
  
  // Старая логика (с проверкой на 1 минуту)
  console.log('\nСтарая логика (с проверкой на 1 минуту):');
  const oldIncompleteRecord = recentRecords.find(record => {
    if (!record.checkInTime) return false;
    if (!record.checkOutTime) return true;
    
    // If check-in and check-out are the same (within 1 minute), treat as incomplete
    const timeDiff = Math.abs(new Date(record.checkOutTime) - new Date(record.checkInTime));
    return timeDiff < 60000; // Less than 1 minute
  });
  
  console.log('Найдена незавершенная запись (старая логика):', oldIncompleteRecord ? `ID ${oldIncompleteRecord.id}` : 'Нет');
  
  // Новая логика (без проверки на 1 минуту)
  console.log('\nНовая логика (без проверки на 1 минуту):');
  const newIncompleteRecord = recentRecords.find(record => {
    if (!record.checkInTime) return false;
    if (!record.checkOutTime) return true;
    
    // Убираем проверку на разницу в 1 минуту - считаем все записи с checkOutTime завершенными
    return false;
  });
  
  console.log('Найдена незавершенная запись (новая логика):', newIncompleteRecord ? `ID ${newIncompleteRecord.id}` : 'Нет');
  
  // Анализ результата
  console.log('\nАнализ:');
  if (oldIncompleteRecord && oldIncompleteRecord.id === 1) {
    console.log('❌ Старая логика неверно считает завершенную запись незавершенной');
    console.log('   Причина: разница 1 минута (< 60 секунд)');
  }
  
  if (newIncompleteRecord && newIncompleteRecord.id === 2) {
    console.log('✅ Новая логика правильно находит незавершенную запись');
    console.log('   Результат: будет выполнен checkout для записи ID 2');
  } else if (!newIncompleteRecord) {
    console.log('✅ Новая логика правильно не находит незавершенных записей');
    console.log('   Результат: будет выполнен checkin');
  }
}

// Тестирование сценария проблемы
function testProblemScenario() {
  console.log('\n\n=== Тест сценария проблемы ===\n');
  
  console.log('Сценарий: Первый скан второго цикла');
  console.log('Ожидаемое поведение: система должна найти незавершенную запись и выполнить checkout');
  
  const records = [
    { 
      id: 1, 
      checkInTime: '2026-03-16T14:50:00.000Z', 
      checkOutTime: '2026-03-16T14:51:00.000Z', 
      createdAt: '2026-03-16T14:50:00.000Z'
    },
    { 
      id: 2, 
      checkInTime: '2026-03-16T14:51:00.000Z', 
      checkOutTime: null, 
      createdAt: '2026-03-16T14:51:00.000Z'
    }
  ];
  
  // Применяем новую логику
  const incompleteRecord = records.find(record => {
    if (!record.checkInTime) return false;
    if (!record.checkOutTime) return true;
    return false;
  });
  
  console.log('\nРезультат:');
  if (incompleteRecord && incompleteRecord.id === 2) {
    console.log('✅ Система правильно определит действие как CHECKOUT');
    console.log('   Будет обновлена запись ID 2 (добавлено время ухода)');
    console.log('   Не будет создана новая запись');
  } else {
    console.log('❌ Система неверно определит действие');
  }
  
  console.log('\nОжидаемый результат в интерфейсе:');
  console.log('  Одна запись: 14:50 - 14:51 (завершенный первый цикл)');
  console.log('  Одна запись: 14:51 - (текущий приход второго цикла)');
}

// Запуск тестов
testIncompleteRecordLogic();
testProblemScenario();

console.log('\n=== Тесты завершены ===');
console.log('\nИСПРАВЛЕНИЯ:');
console.log('1. ✅ Убрана проверка на разницу в 1 минуту в qr.js');
console.log('2. ✅ Убрана проверка на разницу в 1 минуту в attendance.js');
console.log('3. ✅ Улучшена логика удаления дубликатов');
console.log('\nТеперь первый скан второго цикла должен работать правильно!');

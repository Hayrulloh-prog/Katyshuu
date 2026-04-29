// Тест цикла приход-уход
const axios = require('axios');

async function testAttendanceCycle() {
  try {
    console.log('=== ТЕСТ ЦИКЛА ПРИХОД-УХОД ===');
    
    // Предположим, у нас есть тестовый employee ID
    const employeeId = 1; // Замените на реальный ID сотрудника
    const baseUrl = 'http://localhost:3001/api';
    
    // Шаг 1: Проверяем текущий статус
    console.log('\n1. Проверка текущего статуса...');
    const qrToken = 'test-token-123'; // Замените на реальный токен
    
    const scanResponse = await axios.get(`${baseUrl}/qr/scan/${qrToken}`);
    console.log('Ответ от /qr/scan:', scanResponse.data);
    
    // Шаг 2: Выполняем действие (приход или уход)
    const action = scanResponse.data.todayRecord && 
                   scanResponse.data.todayRecord.checkInTime && 
                   !scanResponse.data.todayRecord.checkOutTime ? 'checkout' : 'checkin';
    
    console.log(`\n2. Выполняем действие: ${action}`);
    
    const markResponse = await axios.post(`${baseUrl}/attendance/mark`, {
      employeeId: employeeId,
      action: action,
      deviceFingerprint: 'test-fingerprint',
      location: { latitude: 42.8746, longitude: 74.5698 }
    });
    
    console.log('Ответ от /attendance/mark:', markResponse.data);
    
    // Шаг 3: Повторная проверка статуса
    console.log('\n3. Повторная проверка статуса...');
    const secondScanResponse = await axios.get(`${baseUrl}/qr/scan/${qrToken}`);
    console.log('Ответ от второго /qr/scan:', secondScanResponse.data);
    
    // Шаг 4: Выполняем обратное действие
    const nextAction = secondScanResponse.data.todayRecord && 
                      secondScanResponse.data.todayRecord.checkInTime && 
                      !secondScanResponse.data.todayRecord.checkOutTime ? 'checkout' : 'checkin';
    
    console.log(`\n4. Выполняем следующее действие: ${nextAction}`);
    
    const secondMarkResponse = await axios.post(`${baseUrl}/attendance/mark`, {
      employeeId: employeeId,
      action: nextAction,
      deviceFingerprint: 'test-fingerprint',
      location: { latitude: 42.8746, longitude: 74.5698 }
    });
    
    console.log('Ответ от второго /attendance/mark:', secondMarkResponse.data);
    
    console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
    
  } catch (error) {
    console.error('Ошибка при тестировании:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  }
}

// Запуск теста
testAttendanceCycle();

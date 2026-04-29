const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data - замените на реальные данные вашего сотрудника
const TEST_EMPLOYEE_ID = 1; // Замените на реальный ID сотрудника
const TEST_TOKEN = 'your-test-token'; // Замените на реальный токен

async function testDuplicatePrevention() {
  console.log('=== Тестирование предотвращения дублирования ===\n');try {
    // Тест 1: Быстрые последовательные запросы
    console.log('Тест 1: Быстрые последовательные запросы');

    for (let i = 0; i < 3; i++) {
      console.log(`\nЗапрос ${i + 1}:`);

      try {
        const response = await axios.post(`${BASE_URL}/attendance/mark`, {
          employeeId: TEST_EMPLOYEE_ID,
          action: 'checkin',
          deviceFingerprint: `test-device-${i}`,
          location: { latitude: 42.8746, longitude: 74.5698 }
        });      console.log('✅ Успех:', response.data.message);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('⏳ Ожидание:', error.response.data.error);
        } else {
          console.log('❌ Ошибка:', error.response?.data?.error || error.message);
        }
      }    // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }  // Тест 2: Запросы с нормальными интервалами
    console.log('\n\nТест 2: Запросы с нормальными интервалами (6 секунд)');

    for (let i = 0; i < 3; i++) {
      console.log(`\nЗапрос ${i + 1}:`);

      try {
        const response = await axios.post(`${BASE_URL}/attendance/mark`, {
          employeeId: TEST_EMPLOYEE_ID,
          action: i % 2 === 0 ? 'checkin' : 'checkout',
          deviceFingerprint: `test-device-normal-${i}`,
          location: { latitude: 42.8746, longitude: 74.5698 }
        });      console.log('✅ Успех:', response.data.message);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('⏳ Ожидание:', error.response.data.error);
        } else {
          console.log('❌ Ошибка:', error.response?.data?.error || error.message);
        }
      }    // Задержка 6 секунд между запросами
      await new Promise(resolve => setTimeout(resolve, 6000));
    }  console.log('\n=== Тест завершен ===');} catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запуск теста
testDuplicatePrevention();

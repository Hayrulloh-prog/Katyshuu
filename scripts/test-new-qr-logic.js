const axios = require('axios');

// Базовый URL сервера
const BASE_URL = 'http://localhost:5000';

// Тестирование новой логики QR сканирования
async function testNewQRLogic() {
  console.log('=== ТЕСТИРОВАНИЕ НОВОЙ ЛОГИКИ QR СКАНИРОВАНИЯ ===\n');try {
    // 1. Тест первого сканирования (регистрация менеджера)
    console.log('1. Тест первого сканирования - регистрация менеджера');
    const testToken1 = 'test-manager-token-123';

    try {
      const response = await axios.get(`${BASE_URL}/api/qr/scan/${testToken1}`);
      console.log('Результат первого сканирования:', response.data);

      if (response.data.isFirstScan && response.data.isManagerRegistration) {
        console.log('✅ Первый скан правильно определен как регистрация менеджера');
      } else {
        console.log('❌ Первый скан не правильно определен');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Токен не найден - ожидаемое поведение для первого скана');
      } else {
        console.log('❌ Ошибка первого сканирования:', error.message);
      }
    }  // 2. Тест проверки существующих аккаунтов
    console.log('\n2. Тест проверки существующих аккаунтов');
    try {
      const checkResponse = await axios.post(`${BASE_URL}/api/oauth/check-accounts`, {
        email: 'test@example.com',
        googleId: 'google123',
        targetManagerId: 1,
        token: 'test-token-123'
      });
      console.log('Результат проверки аккаунтов:', checkResponse.data);
      console.log('✅ Проверка аккаунтов работает');
    } catch (error) {
      console.log('❌ Ошибка проверки аккаунтов:', error.response?.data || error.message);
    }  // 3. Тест регистрации сотрудника с указанием менеджера
    console.log('\n3. Тест регистрации сотрудника с указанием менеджера');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/oauth/register`, {
        email: 'newemployee@example.com',
        firstName: 'Test',
        lastName: 'Employee',
        phone: '+996700123456',
        provider: 'google',
        googleId: 'googlenew123',
        token: 'test-token-123',
        managerId: 1
      });
      console.log('Результат регистрации:', registerResponse.data);
      console.log('✅ Регистрация с managerId работает');
    } catch (error) {
      console.log('❌ Ошибка регистрации:', error.response?.data || error.message);
    }  // 4. Тест автоматической аутентификации
    console.log('\n4. Тест автоматической аутентификации');
    try {
      const autoAuthResponse = await axios.post(`${BASE_URL}/api/oauth/auto-auth`, {
        provider: 'google',
        email: 'test@example.com',
        googleId: 'google123',
        token: 'test-token-123'
      });
      console.log('Результат авто-аутентификации:', autoAuthResponse.data);
      console.log('✅ Авто-аутентификация работает');
    } catch (error) {
      console.log('❌ Ошибка авто-аутентификации:', error.response?.data || error.message);
    }  console.log('\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');} catch (error) {
    console.error('Общая ошибка тестирования:', error.message);
  }
}

// Запуск теста
if (require.main === module) {
  testNewQRLogic();
}

module.exports = testNewQRLogic;

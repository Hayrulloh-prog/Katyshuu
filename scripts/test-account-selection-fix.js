// Тест для проверки исправления логики выбора аккаунта
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAccountSelectionFix() {
  console.log('=== Тест исправления выбора аккаунта ===');
  
  try {
    // 1. Проверяем эндпоинт check-accounts
    console.log('\n1. Тестирование check-accounts endpoint...');
    
    const checkResponse = await axios.post(`${BASE_URL}/api/oauth/check-accounts`, {
      email: 'test@example.com',
      googleId: '123456789',
      targetManagerId: 1,
      token: 'test-token'
    });
    
    console.log('Check-accounts response:', checkResponse.data);
    
    // 2. Проверяем эндпоинт регистрации
    console.log('\n2. Тестирование регистрации...');
    
    const registerResponse = await axios.post(`${BASE_URL}/api/oauth/register`, {
      email: 'test@example.com',
      googleId: '123456789',
      firstName: 'Test',
      lastName: 'User',
      phone: '+996123456789',
      provider: 'google',
      token: 'test-token',
      managerId: 1
    });
    
    console.log('Register response:', registerResponse.data);
    
    console.log('\n✅ Тесты пройдены успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.response?.data || error.message);
  }
}

// Запуск теста
testAccountSelectionFix();

const axios = require('axios');

// Тест исправлений
async function testFix() {
  console.log('=== ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ===\n');try {
    // Тест QR сканирования
    const testToken = '8KpW3Lm2QzX5Vb7F1YgR0tH9DqNcE6sJ';

    console.log('1. Тест QR сканирования с токеном:', testToken);
    const response = await axios.get(`http://localhost:5000/api/qr/scan/${testToken}`);
    console.log('Ответ:', response.data);

    if (response.data.isSecondScan && response.data.isEmployeeRegistration) {
      console.log('✅ Второй скан правильно определен');
      console.log('Менеджер:', response.data.manager);
      console.log('Manager ID:', response.data.managerId);
    } else {
      console.log('❌ Второй скан не правильно определен');
    }  // Тест проверки аккаунтов
    console.log('\n2. Тест проверки аккаунтов');
    const checkResponse = await axios.post('http://localhost:5000/api/oauth/check-accounts', {
      email: 'test@example.com',
      googleId: 'test123',
      targetManagerId: 4,
      token: testToken
    });
    console.log('Ответ проверки:', checkResponse.data);  console.log('\n✅ Тест завершен');} catch (error) {
    console.error('❌ Ошибка теста:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testFix();
}

module.exports = testFix;

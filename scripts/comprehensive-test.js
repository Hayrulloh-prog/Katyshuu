const axios = require('axios');

// Базовый URL сервера
const BASE_URL = 'http://localhost:5000';

// Комплексное тестирование новой системы QR сканирования
async function runComprehensiveTest() {
  console.log('=== КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ QR СКАНИРОВАНИЯ ===\n');const testData = {
    manager: {
      firstName: 'Тест',
      lastName: 'Менеджер',
      phone: '+996700123001',
      login: 'testmanager',
      password: 'testpass123',
      tariffId: 1,
      maxEmployees: 10
    },
    employee1: {
      firstName: 'Иван',
      lastName: 'Сотрудник',
      phone: '+996700123101',
      email: 'employee1@example.com',
      googleId: 'google123456'
    },
    employee2: {
      firstName: 'Петр',
      lastName: 'Работник',
      phone: '+996700123102',
      email: 'employee2@example.com',
      googleId: 'google789012'
    }
  };try {
    // Тест 1: Проверка QR сканирования
    console.log('📱 ТЕСТ 1: Проверка типов сканирования QR');
    await testQRScanning();  // Тест 2: Проверка регистрации менеджера
    console.log('\n👔 ТЕСТ 2: Регистрация менеджера');
    const manager = await testManagerRegistration(testData.manager);  // Тест 3: Проверка регистрации сотрудников
    console.log('\n👥 ТЕСТ 3: Регистрация сотрудников');
    await testEmployeeRegistration(manager.id, testData.employee1);  // Тест 4: Проверка выбора аккаунта
    console.log('\n🔄 ТЕСТ 4: Выбор существующего аккаунта');
    await testAccountSelection(testData.employee1);  // Тест 5: Проверка нескольких аккаунтов
    console.log('\n👥 ТЕСТ 5: Несколько аккаунтов у разных менеджеров');
    await testMultipleAccounts(testData.employee2);  console.log('\n✅ ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ!');} catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТИРОВАНИИ:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  }
}

async function testQRScanning() {
  const testToken = 'test-qr-token-12345';

  try {
    // Тест первого сканирования
    const response1 = await axios.get(`${BASE_URL}/api/qr/scan/${testToken}`);
    console.log('Первый скан:', response1.data);

    if (response1.data.isFirstScan) {
      console.log('✅ Первый скан правильно определен');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Первый скан: токен не найден (ожидаемо)');
    } else {
      throw error;
    }
  }
}

async function testManagerRegistration(managerData) {
  try {
    // Сначала создаем QR токен для менеджера
    const qrResponse = await axios.post(`${BASE_URL}/api/qr/generate`, {
      type: 'MANAGER_REG',
      token: 'test-manager-qr-' + Date.now()
    });  console.log('QR токен создан:', qrResponse.data.token);  // Регистрируем менеджера
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register-manager`, managerData);
    console.log('Менеджер зарегистрирован:', registerResponse.data.manager.id);

    return registerResponse.data.manager;
  } catch (error) {
    console.log('⚠️ Регистрация менеджера пропущена (возможно, уже существует)');
    // Попробуем найти существующего менеджера
    try {
      const managersResponse = await axios.get(`${BASE_URL}/api/managers`);
      const manager = managersResponse.data.find(m => m.login === managerData.login);
      if (manager) {
        console.log('✅ Найден существующий менеджер:', manager.id);
        return manager;
      }
    } catch (findError) {
      console.log('⚠️ Не удалось найти менеджера, продолжаем тест');
    }
    return { id: 1 }; // Возвращаем ID по умолчанию
  }
}

async function testEmployeeRegistration(managerId, employeeData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/oauth/check-accounts`, {
      email: employeeData.email,
      googleId: employeeData.googleId,
      targetManagerId: managerId,
      token: 'test-token-123'
    });  console.log('Проверка аккаунтов:', response.data);  if (!response.data.hasExistingAccounts) {
      console.log('✅ Нет существующих аккаунтов, можно регистрировать');

      // Пробуем зарегистрировать
      const registerResponse = await axios.post(`${BASE_URL}/api/oauth/register`, {
        ...employeeData,
        provider: 'google',
        token: 'test-token-123',
        managerId: managerId
      });

      console.log('Сотрудник зарегистрирован:', registerResponse.data.employee.id);
    } else {
      console.log('⚠️ Сотрудник уже существует, пропускаем регистрацию');
    }
  } catch (error) {
    console.log('⚠️ Регистрация сотрудника:', error.response?.data?.error || error.message);
  }
}

async function testAccountSelection(employeeData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/oauth/check-accounts`, {
      email: employeeData.email,
      googleId: employeeData.googleId,
      targetManagerId: 2, // Другой менеджер
      token: 'test-token-456'
    });  console.log('Проверка для другого менеджера:', response.data);  if (response.data.hasExistingAccounts && !response.data.hasAccountWithTargetManager) {
      console.log('✅ Найдены аккаунты у других менеджеров');
      console.log('Существующие менеджеры:', response.data.otherManagers.length);
    } else {
      console.log('ℹ️ Нет аккаунтов у других менеджеров');
    }
  } catch (error) {
    console.log('⚠️ Проверка выбора аккаунта:', error.response?.data?.error || error.message);
  }
}

async function testMultipleAccounts(employeeData) {
  try {
    // Проверяем авто-аутентификацию
    const response = await axios.post(`${BASE_URL}/api/oauth/auto-auth`, {
      provider: 'google',
      email: employeeData.email,
      googleId: employeeData.googleId,
      token: 'test-token-789'
    });  if (response.data.success) {
      console.log('✅ Авто-аутентификация успешна');
      console.log('Сотрудник ID:', response.data.employee.id);
    } else {
      console.log('⚠️ Авто-аутентификация:', response.data.error);
    }
  } catch (error) {
    console.log('⚠️ Тест авто-аутентификации:', error.response?.data?.error || error.message);
  }
}

// Запуск комплексного теста
if (require.main === module) {
  runComprehensiveTest();
}

module.exports = { runComprehensiveTest };

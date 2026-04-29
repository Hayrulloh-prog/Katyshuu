# 🔧 Исправление регистрации сотрудника через OAuth

## 🚫 Проблема:

OAuth данные не передавались в запрос регистрации, из-за чего сервер получал:
```javascript
{
  email: undefined,
  googleId: undefined,
  provider: undefined,
  token: undefined,
  managerId: undefined
}
```

## ✅ Что исправлено:

### 1. Правильное получение OAuth данных
```javascript
// Получаем OAuth данные из authData
const oauthUserData = authData?.userData;
const oauthCallbackData = JSON.parse(localStorage.getItem('oauthCallbackData') || '{}');
const qrToken = oauthCallbackData.qrToken || authData?.qrData?.token || token;
```

### 2. Правильная сборка данных для отправки
```javascript
const dataToSend = {
  ...registrationData,
  // Добавляем OAuth данные
  email: oauthUserData?.email || registrationData.email,
  googleId: oauthUserData?.googleId,
  appleId: oauthUserData?.appleId,
  provider: oauthUserData?.provider || 'google',
  // Добавляем QR данные
  token: qrToken,
  managerId: authData?.qrData?.managerId
};
```

## 🔄 Теперь последовательность:

### 1. OAuth Callback:
- Пользователь проходит Google OAuth
- Данные сохраняются в `authData.userData`
- Включается: `email`, `googleId`, `provider`

### 2. Форма регистрации:
- Показывается форма с полями: имя, фамилия, телефон
- Пользователь заполняет форму

### 3. Отправка регистрации:
- Собираются данные из формы + OAuth данные
- Отправляются на `/api/oauth/register`

## 📋 Ожидаемые данные для отправки:

```javascript
{
  firstName: "Khairulloh11",
  lastName: "Youldashev11", 
  phone: "+996224209011",
  email: "hayrulloh1706@gmail.com",        // Из OAuth
  googleId: "100910416956644928678",       // Из OAuth
  provider: "google",                      // Из OAuth
  token: "tT2WHhL6Z5BWqPqsFKT75XcymMEMjJsP",
  managerId: 1
}
```

## 🧪 Тестирование:

### Шаг 1: Подготовка
1. Убедитесь, что менеджер зарегистрирован
2. QR-код имеет тип `EMPLOYEE_REG`

### Шаг 2: Регистрация сотрудника
1. Откройте QR-код еще раз
2. Выберите "Google аркылуу кириңиз"
3. Пройдите OAuth аутентификацию
4. Заполните форму регистрации
5. Нажмите "Каттоону аягына чыгаруу"

### Шаг 3: Проверка логов
В консоли должно быть:
```javascript
Sending registration data: {
  firstName: "Khairulloh11",
  lastName: "Youldashev11",
  phone: "+996224209011", 
  email: "hayrulloh1706@gmail.com",      // ✅ Должно быть заполнено
  googleId: "100910416956644928678",     // ✅ Должно быть заполнено
  provider: "google",                    // ✅ Должно быть заполнено
  token: "tT2WHhL6Z5BWqPqsFKT75XcymMEMjJsP",
  managerId: 1
}
```

### Шаг 4: Успешная регистрация
Должен появиться ответ:
```javascript
{
  success: true,
  message: 'Сотрудник успешно зарегистрирован',
  employee: { ... }
}
```

Теперь регистрация сотрудника должна работать правильно! 🎉

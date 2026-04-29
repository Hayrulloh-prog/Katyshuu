# Инструкция по запуску и тестированию

## 🚨 Проблема: Network Error

В консоли видны ошибки `Network Error`, что означает что сервер не запущен.

## 📋 Порядок запуска

### 1. Запустить сервер
```bash
cd "c:\Users\user\Desktop\Козомол"
npm start
```

Сервер должен запуститься на порту 5000. Вы должны увидеть:
```
Server is running on port 5000
Database connected successfully
```

### 2. Запустить клиент (в отдельном терминале)
```bash
cd "c:\Users\user\Desktop\Козомол\client"
npm start
```

Клиент запустится на порту 3000.

### 3. Проверить что сервер работает
Откройте в браузере: http://localhost:5000

Должен увидеть ответ от сервера или сообщение об ошибке подключения к базе данных.

### 4. Проверить API эндпоинт
Откройте в браузере: http://localhost:5000/api/qr/scan/8KpW3Lm2QzX5Vb7F1YgR0tH9DqNcE6sJ

Должен получить JSON ответ:
```json
{
  "isSecondScan": true,
  "isEmployeeRegistration": true,
  "token": "8KpW3Lm2QzX5Vb7F1YgR0tH9DqNcE6sJ",
  "managerId": 4,
  "manager": {
    "id": 4,
    "firstName": "Khairulloh44",
    "lastName": "Youldashev44"
  }
}
```

## 🔧 Если сервер не запускается

### Проверить переменные окружения
Убедитесь что файл `.env` существует и содержит:
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key"
```

### Проверить базу данных
```bash
# Запустить миграции
npx prisma migrate dev

# Или проверить подключение
npx prisma db pull
```

### Проверить порты
Убедитесь что порты 5000 и 3000 не заняты:
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Если порты заняты, убить процессы
taskkill /PID <process_id> /F
```

## 🧪 Тестирование после запуска

### 1. Первый скан
Откройте: http://localhost:3000/qr/8KpW3Lm2QzX5Vb7F1YgR0tH9DqNcE6sJ

**Ожидаемый результат:**
- Консоль: "First scan - redirecting to manager registration"
- Перенаправление на страницу регистрации менеджера

### 2. Второй скан (после регистрации менеджера)
Откройте: http://localhost:3000/qr/8KpW3Lm2QzX5Vb7F1YgR0tH9DqNcE6sJ

**Ожидаемый результат:**
- Консоль: "Second scan - employee registration"
- Показать страницу выбора провайдера (Google/Apple)
- Нет ошибок Network Error

### 3. Проверить OAuth
Нажать на кнопку Google:
**Ожидаемый результат:**
- Запрос к http://localhost:5000/api/oauth/google?token=...
- Перенаправление на Google OAuth

## 🐛 Частые проблемы

### "Cannot GET /api/qr/scan/..."
**Решение:** Убедитесь что сервер запущен и маршрут существует

### "ECONNREFUSED"
**Решение:** Запустите сервер на порту 5000

### "Database connection failed"
**Решение:** Проверьте переменные окружения и запустите базу данных

## ✅ Проверочный список

Перед тестированием убедитесь:

- [ ] Сервер запущен на порту 5000
- [ ] Клиент запущен на порту 3000  
- [ ] База данных доступна
- [ ] API эндпоинт отвечает корректно
- [ ] Нет ошибок в консоли сервера
- [ ] Нет ошибок Network Error в браузере

После выполнения этих шагов система должна работать корректly! 🚀

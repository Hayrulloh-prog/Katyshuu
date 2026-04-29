# 🔍 ОТЛАДКА АВТОРИЗАЦИИ МЕНЕДЖЕРА

## 🎯 **Что нужно сделать:**

### 1. **Перезапустите клиент**
```bash
# Остановите клиент (Ctrl+C)
npm start
```

### 2. **Откройте консоль в админке**
1. Откройте `http://localhost:3000/manager`
2. Откройте консоль (F12)
3. Очистите: `localStorage.clear(); location.reload();`
4. Войдите с данными менеджера

### 3. **Смотрите отладочные сообщения**

#### ✅ **Должно быть в консоли:**
```
ManagerPanel - Auth state: {user: {id: 1, role: 'manager', ...}, authLoading: false}
ManagerPanel - localStorage token: eyJhbGciOiJIUzI1NiIs...
ManagerPanel - axios headers: {Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."}
fetchEmployees - Request headers: {Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."}
```

#### ❌ **Проблема если:**
```
ManagerPanel - Auth state: {user: null, authLoading: false}
ManagerPanel - localStorage token: null
fetchEmployees - Request headers: {}
```

### 4. **Проверьте серверные логи**

#### ✅ **Должно быть на сервере:**
```
POST /api/auth/manager HTTP/1.1" 200 611
GET /api/attendance/aggregated-status?filter=today HTTP/1.1" 200
```

#### ❌ **Проблема если:**
```
GET /api/attendance/aggregated-status?filter=today HTTP/1.1" 401 26
```

## 🔧 **Возможные проблемы и решения:**

### **Проблема 1: Токен не сохраняется**
- **Решение:** Проверьте логику в AuthContext login()

### **Проблема 2: Токен истёк**
- **Решение:** Проверьте время жизни токена (30 дней)

### **Проблема 3: Заголовки не устанавливаются**
- **Решение:** Проверьте axios.defaults.headers.common

## 📋 **Шаги тестирования:**

1. **Вход в админку**
   - Откройте консоль
   - Введите данные менеджера
   - Посмотрите отладочные сообщения

2. **Проверка запросов**
   - Дождитесь загрузки данных
   - Посмотрите заголовки запросов
   - Проверьте ответ сервера

3. **Если есть ошибки 401**
   - Скопируйте все отладочные сообщения
   - Проверьте наличие токена
   - Проверьте заголовки axios

## 🎯 **Ожидаемый результат:**
- ✅ Токен сохраняется в localStorage
- ✅ Заголовки устанавливаются правильно
- ✅ Все запросы возвращают 200
- ✅ Данные загружаются без ошибок

**Выполните эти шаги и сообщите результаты!**

# 🔍 ОТЛАДКА АВТОРИЗАЦИИ НА СЕРВЕРЕ

## ✅ **Добавлена детальная отладка в middleware!**

### 🚀 **Что нужно сделать:**

### 1. **Перезапустите сервер**
```bash
# Остановите сервер (Ctrl+C)
npm run server
```

### 2. **Откройте консоль в админке**
1. Откройте `http://localhost:3000/manager`
2. Откройте консоль (F12)
3. Войдите с данными менеджера

### 3. **Смотрите отладочные сообщения**

#### ✅ **Должно быть на сервере:**
```
Auth middleware - Token received: YES
Auth middleware - Auth header: Bearer eyJhbGciOiJIUzI1NiIs...
Auth middleware - Token decoded: {id: 1, role: 'manager', login: 'hayrulloh1@gmail.com', ...}
Auth middleware - Checking manager with ID: 1
Auth middleware - Manager found: YES
Auth middleware - Manager isActive: true
Auth middleware - Authentication successful
```

#### ❌ **Проблема если:**
```
Auth middleware - Token received: NO
Auth middleware - No token provided
```

ИЛИ

```
Auth middleware - Token verification failed: invalid signature
```

ИЛИ

```
Auth middleware - Manager found: NO
Auth middleware - User not found
```

## 🎯 **Что проверить:**

### **Проблема 1: Токен не доходит**
- **Решение:** Проверить заголовки на клиенте

### **Проблема 2: Токен невалидный**
- **Решение:** Проверить JWT_SECRET на сервере

### **Проблема 3: Менеджер не найден**
- **Решение:** Проверить базу данных

### **Проблема 4: Менеджер неактивен**
- **Решение:** Проверить поле isActive

## 📋 **Шаги тестирования:**

1. **Перезапустите сервер**
2. **Войдите в админку**
3. **Смотрите серверные логи**
4. **Найдите где именно происходит ошибка**

## 🔧 **Ожидаемый результат:**
- ✅ Токен доходит до сервера
- ✅ Токен расшифровывается правильно
- ✅ Менеджер находится в базе
- ✅ Аутентификация проходит успешно
- ✅ Все запросы возвращают 200

**Теперь мы точно увидим где проблема на сервере!**

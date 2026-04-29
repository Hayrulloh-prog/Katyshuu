# Google OAuth Setup Guide

## 📋 Что нужно сделать:

### 1. Создать Google Cloud Project
1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API и Google People API

### 2. Создать OAuth Credentials
1. Перейдите в `APIs & Services` → `Credentials`
2. Нажмите `Create Credentials` → `OAuth client ID`
3. Выберите `Web application`
4. Добавьте следующие URI в `Authorized redirect URIs`:
   ```
   http://localhost:3000/oauth/callback
   ```
5. Сохраните и скопируйте Client ID и Client Secret

### 3. Настроить переменные окружения
В файле `.env` замените:
```env
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 4. Перезапустить сервер
```bash
npm run dev
```

## 🧪 Тестирование:

### Тестовый пользователь:
- Создайте тестовый Google аккаунт
- Используйте его для тестирования OAuth

### URL для теста:
```
http://localhost:3000/qr
```

## 🔧 Возможные проблемы:

### 1. "redirect_uri_mismatch"
- Убедитесь что redirect URI в Google Console совпадает с тем что в `.env`
- Проверьте что нет лишних слэшей

### 2. "invalid_client"
- Проверьте что Client ID и Client Secret правильные
- Убедитесь что OAuth app активен

### 3. CORS ошибки
- Убедитесь что сервер запущен на порту 5000
- Проверьте CORS настройки в `server/index.js`

## 📱 Flow тестирования:

1. **Первый раз (новый пользователь):**
   - Сканировать QR → Выбрать Google → Авторизоваться → Заполнить форму → Успех

2. **Второй раз (существующий пользователь):**
   - Сканировать QR → Автовход → Успех

## 🎯 Next Steps:

После настройки Google OAuth можно добавить:
- Apple Sign In
- Microsoft OAuth
- Facebook Login

---

**✅ Готово!** Теперь система готова к использованию с Google OAuth.

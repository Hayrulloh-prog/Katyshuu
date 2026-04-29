// Скрипт для очистки старых данных аутентификации
// Запустить в браузерной консоли на странице приложения

console.log('Очистка старых данных аутентификации...');

// Очищаем все возможные хранилища
localStorage.removeItem('userAuth');
localStorage.removeItem('attendanceResult');
localStorage.removeItem('userGoogleAccount');
localStorage.removeItem('oauthCallbackData');

// Также очищаем sessionStorage на всякий случай
sessionStorage.clear();

console.log('Все данные аутентификации очищены');
console.log('Пожалуйста, перезагрузите страницу и просканируйте QR-код заново');

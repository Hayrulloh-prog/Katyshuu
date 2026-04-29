import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Header from '../components/Header';

// Создаем локальный экземпляр axios для OAuthCallback
const oauthAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});


const OAuthCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  const handleOAuthCallback = async () => {
      let stateData = null;
      try {
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');      // Парсим state для извлечения qrToken
        if (state) {
          try {
            stateData = JSON.parse(decodeURIComponent(state));
          } catch (e) {
            // Error parsing state
          }
        }      if (error) {
          navigate('/qr');
          return;
        }      if (!code) {
          navigate('/qr');
          return;
        }

      // Отправляем код на сервер для обработки
        const response = await oauthAxios.get('/api/oauth/google/callback', {
          params: { code, state }
        });      if (response.data.success) {        // Сохраняем данные аутентификации
          localStorage.setItem('userAuth', JSON.stringify({
            provider: 'google',
            email: response.data.employee.email,
            employeeId: response.data.employee.id,
            firstName: response.data.employee.firstName,
            lastName: response.data.employee.lastName,
            googleId: response.data.employee.googleId,
            token: response.data.token,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
          }));        // Сохраняем Google аккаунт данные
          localStorage.setItem('userGoogleAccount', JSON.stringify({
            provider: 'google',
            email: response.data.employee.email,
            googleId: response.data.employee.googleId,
            employeeId: response.data.employee.id,
            lastUsed: new Date().toISOString()
          }));        // Очищаем временные данные, чтобы они не мешали при следующем сканировании
          localStorage.removeItem('registrationData');
          localStorage.removeItem('oauthCallbackData');        // Сохраняем результат для перенаправления
          localStorage.setItem('attendanceResult', JSON.stringify({
            ...response.data,
            action: response.data.action
          }));        // Перенаправляем на страницу выбора действия
          navigate('/attendance-action');
        } else if (response.data.needsRegistration || response.data.needRegistration) {        // Сохраняем OAuth данные для регистрации и перенаправляем на QR страницу для регистрации
          const oauthData = {
            provider: 'google',
            email: response.data.userData.email,
            firstName: response.data.userData.firstName || '',
            lastName: response.data.userData.lastName || '',
            googleId: response.data.userData.googleId,
            qrToken: stateData?.qrToken
          };        localStorage.setItem('oauthCallbackData', JSON.stringify(oauthData));        // Перенаправляем на QR страницу, которая покажет форму регистрации
          if (stateData?.qrToken) {
            window.location.href = `/qr/${stateData.qrToken}`;
          } else {
            navigate('/qr');
          }
        } else {
          navigate('/qr');
        }
      } catch (error) {
        const errorData = error.response?.data;      // Обработка лимита сотрудников
        if (errorData?.errorType === 'EMPLOYEE_LIMIT_REACHED') {
          localStorage.setItem('limitErrorData', JSON.stringify({
            type: 'limit_reached',
            message: errorData.error,
            details: `Текущее количество: ${errorData.currentEmployees}, Максимум: ${errorData.maxEmployees}`,
            currentCount: errorData.currentEmployees,
            maxLimit: errorData.maxEmployees
          }));        if (stateData?.qrToken) {
            window.location.href = `/qr/${stateData.qrToken}`;
          } else {
            navigate('/qr');
          }
          return;
        }      if (stateData?.qrToken) {
          window.location.href = `/qr/${stateData.qrToken}`;
        } else {
          navigate('/qr');
        }
      }
    };  handleOAuthCallback();
  }, [navigate, location.search]);return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-hidden">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 w-full relative z-10 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.authenticating')}
          </p>
        </div>
      </main>
    </div>
  );
};
export default OAuthCallback;

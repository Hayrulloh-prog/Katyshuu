import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthSelection from './AuthSelection';
import EmployeeRegistration from './EmployeeRegistration';
import CheckInSuccessPage from './CheckInSuccessPage';
import CheckOutSuccessPage from './CheckOutSuccessPage';
import RegistrationSuccess from './RegistrationSuccess';
import Header from '../components/Header';

// Создаем локальный экземпляр axios для QRScanPage
const qrAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});


const QRScanPage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('loading');
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Очищаем старые данные при новом сканировании
    localStorage.removeItem('attendanceResult');
    localStorage.removeItem('qrScanCurrentView');
  }, [token]);

  useEffect(() => {
    const initializeAuth = async () => {
      const limitErrorData = localStorage.getItem('limitErrorData');
      if (limitErrorData) {
        const errorData = JSON.parse(limitErrorData);
        setError(errorData);
        setCurrentView('error');
        localStorage.removeItem('limitErrorData');
        return;
      }

      const oauthCallbackDataStr = localStorage.getItem('oauthCallbackData');
      if (oauthCallbackDataStr) {
        const callbackData = JSON.parse(oauthCallbackDataStr);
        if (callbackData.qrToken && callbackData.qrToken !== token) {
          localStorage.removeItem('oauthCallbackData');
        } else {
          let qrData = { token: callbackData.qrToken };
          if (callbackData.qrToken) {
            try {
              const qrResponse = await qrAxios.get(`/api/qr/scan/${callbackData.qrToken}`);
              if (qrResponse.data.isSecondScan && qrResponse.data.isEmployeeRegistration) {
                qrData = {
                  manager: qrResponse.data.manager,
                  token: callbackData.qrToken,
                  managerId: qrResponse.data.managerId
                };
              }
            } catch (error) {
              // Error fetching QR data
            }
          }
          setAuthData({
            userData: callbackData,
            qrData: qrData
          });
          setCurrentView('registration');
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const authError = urlParams.get('error');
      if (code || authError) {
        const oauthData = { code, state, error: authError };
        handleOAuthCallback(oauthData);
        return;
      }

      const storedAuthString = localStorage.getItem('userAuth');
      const googleAccountString = localStorage.getItem('userGoogleAccount');
      if (storedAuthString || googleAccountString) {
        determineQRTypeAndCheckAuth();
        return;
      }

      const savedRegistrationData = localStorage.getItem('registrationData');
      const oauthDataStr = localStorage.getItem('oauthCallbackData');
      if (savedRegistrationData && oauthDataStr) {
        const registrationData = JSON.parse(savedRegistrationData);
        const savedToken = registrationData.qrData?.token || registrationData.token;
        if (savedToken && savedToken !== token) {
          localStorage.removeItem('registrationData');
        } else {
          const callbackData = JSON.parse(oauthDataStr);
          setAuthData({
            userData: callbackData,
            qrData: registrationData.qrData
          });
        }
        const managerId = registrationData.qrData?.managerId || registrationData.managerId;
        if (managerId) {
          const canRegister = await checkEmployeeLimit(managerId);
          if (!canRegister) return;
        }
        setCurrentView('registration');
        return;
      }

      determineQRTypeAndCheckAuth();
    };

    initializeAuth();
  }, [token]);

  // Очищаем qrScanCurrentView при размонтировании компонента
  useEffect(() => {
    return () => {
      localStorage.removeItem('qrScanCurrentView');
    };
  }, []);

  useEffect(() => {
    if (currentView === 'success' && authData) {
      localStorage.removeItem('qrScanCurrentView');
      navigate('/attendance-action');
    }
  }, [currentView, authData, navigate]);

  useEffect(() => {
    if (currentView === 'action-selection' && authData) {
      localStorage.removeItem('qrScanCurrentView');
      navigate('/attendance-action');
    }
  }, [currentView, authData, navigate]);

  const determineQRTypeAndCheckAuth = async () => {
    if (!token) {
      setCurrentView('provider-selection');
      return;
    }

    try {
      // Проверяем тип QR кода
      const response = await qrAxios.get(`/api/qr/scan/${token}`);

      if (response.data.isFirstScan && response.data.isManagerRegistration) {
        // Первый скан - регистрация менеджера
        window.location.href = `/manager-registration/${token}`;
        return;
      }

      if (response.data.isSecondScan && response.data.isEmployeeRegistration) {
        // Второй скан - регистрация сотрудника через Google OAuth
        const storedAuthString = localStorage.getItem('userAuth');
        const googleAccountString = localStorage.getItem('userGoogleAccount');
        // Если уже авторизован, попытаемся просто зачекинить (или переключить менеджера)
        if (storedAuthString || googleAccountString) {
          checkStoredAuth(response.data);
          return;
        }      // Если не авторизован, запускаем процесс регистрации
        // Сохраняем данные для регистрации сотрудника
        const registrationData = {
          qrData: {
            manager: response.data.manager,
            token: token,
            managerId: response.data.managerId
          }
        };      localStorage.setItem('registrationData', JSON.stringify(registrationData));
        setAuthData(registrationData);      // Показываем выбор провайдера для OAuth (НЕ сразу регистрацию)
        setCurrentView('provider-selection');
        return;
      }    if (response.data.isAttendanceScan) {
        // Сканирование для отметки посещаемости
        checkStoredAuth(response.data);
        return;
      }    // Обратная совместимость для старых ответов
      if (response.data.isManagerRegistration) {
        window.location.href = `/manager-registration/${token}`;
        return;
      } else if (response.data.isEmployeeRegistration) {
        const storedAuthString = localStorage.getItem('userAuth');
        const googleAccountString = localStorage.getItem('userGoogleAccount');      // Если уже авторизован, попытка использовать существующий аккаунт
        if (storedAuthString || googleAccountString) {
          checkStoredAuth(response.data);
          return;
        }      setAuthData({
          registrationData: {
            manager: response.data.manager,
            token: token,
            managerId: response.data.managerId
          }
        });
        setCurrentView('registration');
        return;
      } else {
        checkStoredAuth();
      }  } catch (error) {
      if (error.response?.data?.isManagerDeleted) {
        navigate('/qr-invalid');
        return;
      }    if (error.response?.data?.isManagerInactive) {
        navigate('/system-inactive');
        return;
      }    // Если QR код не найден (404), это новый токен для регистрации менеджера
      if (error.response?.status === 404) {
        navigate(`/manager-registration/${token}`);
        return;
      }    // Если произошла сетевая ошибка (backend недоступен, CORS и т.д.)
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        // Мы предполагаем, что если бекенд недоступен, мы перекидываем пользователя
        // на регистрацию менеджера, чтобы он не застревал на экране OAuth
        navigate(`/manager-registration/${token}`);
        return;
      }    // При любой другой неизвестной проблеме, показываем экран ошибки
      setError(error.message || 'Ошибка валидации QR кода');
      setCurrentView('error');
    }
  };

  const checkStoredAuth = (qrData = null) => {
    try {
      const stored = localStorage.getItem('userAuth');
      if (stored) {
        const authData = JSON.parse(stored);      // Проверяем срок действия
        if (new Date(authData.expiresAt) > new Date()) {
          // Есть активная сессия - автоматически обрабатываем
          handleAutoAuth(authData);
          return;
        } else {
          // Сессия истекла - удаляем
          localStorage.removeItem('userAuth');
        }
      }

      // Нет активной сессии - проверяем есть ли сохраненный Google аккаунт
      const googleAccount = localStorage.getItem('userGoogleAccount');
      if (googleAccount) {
        const accountData = JSON.parse(googleAccount);
        // Проверяем срок действия Google аккаунта
        const expiresAt = new Date(accountData.expiresAt || accountData.lastUsed);
        expiresAt.setDate(expiresAt.getDate() + 30); // Добавляем 30 дней к последнему использованию
        if (expiresAt > new Date()) {
          // Если есть сохраненный Google аккаунт с активной сессией, автоматически входим
          handleAutoAuth({
            provider: accountData.provider || 'google',
            email: accountData.email,
            googleId: accountData.googleId,
            employeeId: accountData.employeeId,
            expiresAt: expiresAt
          });
          return;
        } else {
          // Сессия Google аккаунта истекла - удаляем
          localStorage.removeItem('userGoogleAccount');
        }
      }

      // Нет сохраненных данных - показываем выбор провайдера
      // Сохраняем данные о QR для последующего использования
      if (qrData) {
        setAuthData({ qrData });
      }

      setCurrentView('provider-selection');
    } catch (error) {
      if (qrData) {
        setAuthData({ qrData });
      }
      setCurrentView('provider-selection');
    }
  };

  const handleAutoAuth = async (storedAuth) => {
    setIsLoading(true);
    try {
      // Получаем QR данные из переданных данных (не из состояния)
      const qrData = storedAuth.qrData || authData?.qrData || {};
      const currentToken = qrData.token || token;
      // Получаем сохраненный Google аккаунт (если есть)
      const googleAccountData = localStorage.getItem('userGoogleAccount');
      const googleAccount = googleAccountData ? JSON.parse(googleAccountData) : {};
      const requestData = {
        provider: storedAuth.provider,
        email: storedAuth.email,
        googleId: googleAccount.googleId || storedAuth.googleId || null,
        token: currentToken
      };

      const response = await qrAxios.post('/api/oauth/auto-auth', requestData);

      if (response.data.success) {
        // Полностью обновляем данные аутентификации
        const updatedAuth = {
          provider: storedAuth.provider,
          email: storedAuth.email,
          employeeId: response.data.employee.id,
          firstName: response.data.employee.firstName,
          lastName: response.data.employee.lastName,
          googleId: response.data.employee.googleId,
          token: response.data.token, // ВАЖНО: обновляем токен!
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
          qrData: storedAuth.qrData
        };
        localStorage.setItem('userAuth', JSON.stringify(updatedAuth));
        // Также сохраняем/обновляем Google аккаунт данные
        if (storedAuth.provider === 'google' || googleAccount.googleId) {
          const googleAccountData = {
            provider: 'google',
            email: storedAuth.email,
            googleId: googleAccount.googleId,
            employeeId: response.data.employee.id,
            lastUsed: new Date().toISOString()
          };
          localStorage.setItem('userGoogleAccount', JSON.stringify(googleAccountData));
        }

        if (response.data.redirectToAction) {
          // Перенаправляем на страницу выбора действия
          setAuthData(response.data);
          // Очищаем временные данные регистрации при успешном входе
          localStorage.removeItem('registrationData');
          localStorage.removeItem('oauthCallbackData');
          setCurrentView('action-selection');
        } else {
          // Успешная автоматическая аутентификация с записью действия
          setAuthData(response.data);
          // Очищаем временные данные регистрации при успешном входе
          localStorage.removeItem('registrationData');
          localStorage.removeItem('oauthCallbackData');
          setCurrentView('success');
        }
      } else {
        // Проверяем специфичные ошибки
        if (response.data.errorType === 'WRONG_MANAGER_FOR_EMPLOYEE') {
          // Показываем диалог о переключении менеджера
          const confirmSwitch = window.confirm(
            `${response.data.error}\n\n` +
            `Текущий менеджер ID: ${response.data.employeeManagerId}\n` +
            `Запрошенный менеджер ID: ${response.data.requestedManagerId}\n\n` +
            `Хотите переключиться на нового менеджера? Это изменит вашего текущего менеджера.`
          );
        if (confirmSwitch) {
            // Пользователь согласился переключиться
            try {
              const qrData = storedAuth.qrData || authData?.qrData || {};
              const switchResponse = await qrAxios.post('/api/oauth/join-manager', {
                employeeId: response.data.employeeId || storedAuth.employeeId,
                newManagerId: qrData.managerId,
                token: qrData.token
              });
              if (switchResponse.data.success) {
                // Обновляем аутентификацию
                const updatedAuth = {
                  ...storedAuth,
                  employeeId: response.data.employeeId || storedAuth.employeeId,
                  firstName: storedAuth.firstName || response.data.employee?.firstName,
                  lastName: storedAuth.lastName || response.data.employee?.lastName,
                  googleId: storedAuth.googleId || googleAccount.googleId,
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                };
                localStorage.setItem('userAuth', JSON.stringify(updatedAuth));
                setAuthData(switchResponse.data);
                setCurrentView('success');
                return;
              }
            } catch (switchError) {
              setError('Не удалось переключиться на нового менеджера');
            }
          }
        } else if (response.data.errorType === 'EMPLOYEE_NOT_REGISTERED_UNDER_MANAGER') {
          // Показываем диалог о регистрации у нового менеджера
          const confirmRegister = window.confirm(
            `${response.data.error}\n\n` +
            `Вы уже работаете у менеджера ID: ${response.data.employeeManagerId}\n` +
            `Теперь хотите зарегистрироваться у менеджера ID: ${response.data.requestedManagerId}?\n\n` +
            `Нажмите "ОК" чтобы зарегистрироваться для работы у нескольких менеджеров.`
          );
        if (confirmRegister) {
            // Пользователь согласился зарегистрироваться у нового менеджера
            // Проверяем лимит сотрудников перед показом формы регистрации
            const managerId = storedAuth.qrData?.managerId || authData?.qrData?.managerId;
            if (managerId) {
              const canRegister = await checkEmployeeLimit(managerId);
              if (!canRegister) return;
            }
            // Показываем форму регистрации с предзаполненными данными
            setAuthData({
              ...storedAuth,
              qrData: storedAuth.qrData || authData?.qrData || {},
              userData: {
                provider: storedAuth.provider,
                email: storedAuth.email,
                firstName: storedAuth.firstName || '',
                lastName: storedAuth.lastName || ''
              }
            });
            setCurrentView('registration');
            return;
          }
        }

        // Ошибка автоматической аутентификации - показываем выбор провайдера
        setError(response.data.error || 'Auto authentication failed');
        setCurrentView('provider-selection');
      }
    } catch (error) {
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        setError('Автоматическая аутентификация не удалась');
      }
      setCurrentView('provider-selection');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmployeeLimit = async (managerId) => {
    try {
      const limitResponse = await qrAxios.get(`/api/managers/${managerId}/employee-count`);
      const { currentCount, maxLimit } = limitResponse.data;
      if (currentCount >= maxLimit) {
        setError({
          type: 'limit_reached',
          message: `Достигнут лимит сотрудников (${maxLimit}).`,
          details: `Текущее количество: ${currentCount}, Максимум: ${maxLimit}`
        });
        setCurrentView('error');
        return false;
      }
      return true;
    } catch (limitError) {
      // Если не удалось проверить лимит, разрешаем регистрацию
      return true;
    }
  };

  const handleProviderSelect = async (provider) => {
    // Получаем QR данные из authData
    const qrData = authData?.qrData || {};
    const currentToken = qrData.token || token;
    setIsLoading(true);
    setError(null);
    try {
      // Сохраняем QR токен перед перенаправлением
      if (currentToken) {
        localStorage.setItem('currentQrToken', currentToken);
      }

      const response = await qrAxios.get(`/api/oauth/${provider}`, {
        params: { token: currentToken } // Передаем токен в query параметрах
      });

      if (response.data.authUrl) {
        // Перенаправляем на провайдер
        window.location.href = response.data.authUrl;
      } else {
        setError('Failed to get authentication URL');
        setCurrentView('error');
      }
    } catch (error) {
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        setError('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        setError('Не удалось подключиться к провайдеру аутентификации');
      }
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (userData) => {
    // Восстанавливаем QR токен из userData или localStorage
    const qrToken = userData.qrToken || localStorage.getItem('currentQrToken');
    // Очищаем сохраненный токен
    localStorage.removeItem('currentQrToken');
    // Проверяем существующие аккаунты
    try {
      // Если есть QR токен, проверяем QR данные
      let qrData = null;
      if (qrToken) {
        try {
          const qrResponse = await qrAxios.get(`/api/qr/scan/${qrToken}`);
          if (qrResponse.data.isSecondScan && qrResponse.data.isEmployeeRegistration) {
            qrData = {
              manager: qrResponse.data.manager,
              token: qrToken,
              managerId: qrResponse.data.managerId
            };
          }
        } catch (error) {
          // Error fetching QR data
        }
      }

      if (!qrData?.managerId) {
        proceedWithRegistration(userData, qrData);
        return;
      }

      const checkResponse = await qrAxios.post('/api/oauth/check-accounts', {
        email: userData.email,
        googleId: userData.googleId,
        appleId: userData.appleId,
        targetManagerId: qrData.managerId,
        token: qrData.token
      });
      // Всегда переходим к регистрации без показа экрана выбора аккаунта
      proceedWithRegistration(userData, qrData);
    } catch (error) {
      // В случае ошибки, продолжаем с обычной регистрацией
      proceedWithRegistration(userData, null);
    }
  };

  const proceedWithRegistration = async (userData, qrData = null) => {
    // Проверяем лимит сотрудников перед показом формы регистрации
    const managerId = qrData?.managerId || authData?.qrData?.managerId;
    if (managerId) {
      const canRegister = await checkEmployeeLimit(managerId);
      if (!canRegister) return;
    }
    // Сохраняем Google аккаунт в localStorage для автоматического входа при следующем сканировании
    if (userData?.provider === 'google' && userData?.googleId) {
      const googleAccountData = {
        provider: 'google',
        email: userData.email,
        googleId: userData.googleId,
        lastUsed: new Date().toISOString()
      };
      localStorage.setItem('userGoogleAccount', JSON.stringify(googleAccountData));
    }
    setAuthData({
      userData,
      qrData: qrData || authData?.qrData
    });
    setCurrentView('registration');
  };

  const handleRegister = async (registrationData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Получаем OAuth данные из localStorage
      const oauthCallbackDataStr = localStorage.getItem('oauthCallbackData');
      let oauthCallbackData = {};
      if (oauthCallbackDataStr) {
        try {
          oauthCallbackData = JSON.parse(oauthCallbackDataStr);
        } catch (error) {
          // Error parsing oauthCallbackData
        }
      }
      // Получаем QR данные
      const qrData = authData?.qrData || {};
      const finalQrToken = oauthCallbackData?.qrToken || qrData?.token || token;
      const finalManagerId = qrData?.managerId;
      // Get device model for security check
      const getDeviceModel = () => {
        const ua = navigator.userAgent;
        let deviceModel = 'Unknown Device';
        if (/iPad|iPhone|iPod/.test(ua)) {
          const match = ua.match(/(iPad|iPhone|iPod)/);
          if (match) deviceModel = match[1];
          const platform = navigator.platform;
          if (platform) deviceModel += ` (${platform})`;
        } else if (/Android/.test(ua)) {
          const match = ua.match(/Android[^;)]*/);
          if (match) deviceModel = match[0];
          const deviceMatch = ua.match(/;\s*([^;)]*)\s*Build/);
          if (deviceMatch && deviceMatch[1]) {
            deviceModel = deviceMatch[1].trim();
          }
        } else {
          const platform = navigator.platform || 'Unknown';
          deviceModel = platform;
        }
        return deviceModel;
      };
      // Собираем данные для отправки
      const dataToSend = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phone: registrationData.phone,
        // OAuth данные
        email: oauthCallbackData?.email,
        googleId: oauthCallbackData?.googleId,
        provider: oauthCallbackData?.provider || 'google',
        // QR данные
        token: finalQrToken,
        managerId: finalManagerId,
        // Device model for security
        deviceModel: getDeviceModel()
      };

      const response = await qrAxios.post('/api/oauth/register', dataToSend);

      if (response.data.success) {
        // Сохраняем аутентификацию
        const authData = {
          token: response.data.token,
          employeeId: response.data.employee.id,
          email: oauthCallbackData?.email || response.data.employee.email,
          firstName: response.data.employee.firstName,
          lastName: response.data.employee.lastName,
          googleId: oauthCallbackData?.googleId || response.data.employee.googleId,
          provider: oauthCallbackData?.provider || 'google',
          role: 'employee',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          qrData: {
            token: finalQrToken
          }
        };

        localStorage.setItem('userAuth', JSON.stringify(authData));
        // Сохраняем Google аккаунт для автоматического входа при следующих сканированиях
        if (oauthCallbackData?.provider === 'google' && oauthCallbackData?.googleId) {
          const googleAccountData = {
            provider: 'google',
            email: oauthCallbackData.email,
            googleId: oauthCallbackData.googleId,
            employeeId: response.data.employee.id,
            lastUsed: new Date().toISOString()
          };
          localStorage.setItem('userGoogleAccount', JSON.stringify(googleAccountData));
        }

        localStorage.removeItem('oauthCallbackData');
        localStorage.removeItem('registrationData');
        // Перенаправляем на страницу отметки
        setAuthData(response.data);
        setCurrentView('action-selection');
      } else {
        setError(response.data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setCurrentView('provider-selection');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'loading':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <LoadingSpinner fullScreen={false} />
            </main>
          </div>
        );
      case 'provider-selection':
        try {
          return (
            <AuthSelection
              onProviderSelect={handleProviderSelect}
              isLoading={isLoading}
            />
          );
        } catch (error) {
          return (
            <div className="text-center p-8 bg-red-100">
              <h2 className="text-xl font-bold mb-4">Error loading AuthSelection</h2>
              <p className="mb-4">There was an error loading the authentication selection.</p>
            </div>
          );
        }
      case 'registration':
        return (
          <EmployeeRegistration
            onRegister={handleRegister}
            isLoading={isLoading}
            userData={authData?.userData}
          />
        );
      case 'action-selection':
        return <LoadingSpinner fullScreen={true} message="Перенаправление к выбору действия..." />;
      case 'success':
        return <LoadingSpinner fullScreen={true} message="Перенаправление..." />;
      case 'registration-success':
        return <LoadingSpinner fullScreen={true} message="Перенаправление к отметке времени..." />;
      case 'error':
        // Специальное отображение для ошибки лимита
        if (error?.type === 'limit_reached') {
          return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
              <Header />
              <div className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 w-full relative overflow-hidden">
                {/* Декоративные элементы фона */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary-200 dark:bg-primary-800 rounded-full blur-3xl opacity-50"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-50"></div>
                </div>              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8 w-full max-w-md relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mx-auto w-12 h-12 sm:w-12 sm:h-12 flex items-center justify-center mb-6 text-yellow-500"
                    >
                      <span className="text-4xl leading-none">⚠️</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {t('auth.limitReachedTitle')}
                    </h1>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        {error.maxLimit ? t('auth.limitReachedMessage', { maxLimit: error.maxLimit }) : error.message}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        {error.currentCount !== undefined && error.maxLimit !== undefined
                          ? t('auth.limitReachedDetails', { currentCount: error.currentCount, maxLimit: error.maxLimit })
                          : error.details}
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                      {t('auth.limitReachedContact')}
                    </p>
                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ opacity: 0.8 }}
                      onClick={() => navigate('/')}
                      className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {t('common.close')}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/45 rounded-full flex items-center justify-center mb-6"
            >
              <span className="text-2xl">❌</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {typeof error === 'string' ? t('auth.error') : t('auth.error')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {typeof error === 'string' ? error : error?.message || t('auth.somethingWentWrong')}
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('common.retry')}
              </motion.button>
            <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('common.refresh')}
              </motion.button>
            </div>
            {(typeof error === 'string' ? error?.includes('Network') : error?.message?.includes('Network')) && (
              <div className="mt-6 p-4 bg-yellow-200 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Убедитесь что сервер запущен</strong><br/>
                  Проверьте что сервер доступен на http://localhost:5000
                </p>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default QRScanPage;

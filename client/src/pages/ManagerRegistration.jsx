import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, ArrowRight, User, Phone, Lock, CreditCard, RefreshCw, MapPin, AlertTriangle, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import { NameField, PhoneField, LoginField, PasswordField } from '../components/FormValidation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorTranslations';

const ManagerRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrValid, setQrValid] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [qrError, setQrError] = useState(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      maxEmployees: '10'
    }
  });useEffect(() => {
    validateQRToken();
    fetchTariffs();
  }, [token]);// Запрашиваем геолокацию сразу после загрузки страницы
  useEffect(() => {
    const requestGeolocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });      setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      } catch (geoError) {
        setLocationError(t('location.accessDeniedPrompt'));
        toast.error(t('location.accessDeniedPrompt'));
      }
    };  requestGeolocation();
  }, []);// Добавляем принудительное обновление тарифов каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTariffs();
    }, 30000);  return () => clearInterval(interval);
  }, []);const validateQRToken = useCallback(async () => {
    try {
      const response = await axios.get(`/api/qr/scan/${token}`);
      // Проверяем, это для регистрации менеджера
      if (response.data.isManagerRegistration) {
        setQrValid(true);
        setQrData(response.data);
      } else {
        setQrValid(false);
      }
    } catch (error) {
      // Если токен не найден (404), показываем ошибку
      // Теперь QR-коды должны быть сгенерированы в суперадминке
      if (error.response?.status === 404) {
        setQrValid(false);
        setQrError('QR-код не найден. Используйте QR-коды, сгенерированные в суперадминке.');
      } else {
        setQrValid(false);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);const fetchTariffs = async () => {
    setTariffsLoading(true);
    try {
      const response = await axios.get('/api/managers/tariffs/public');
      if (response.data) {
        setTariffs(response.data);
        // Проверяем, есть ли все нужные тарифы
        const existingNames = response.data.map(t => t.name);
        const missingTariffs = [];      if (!existingNames.includes('4 месяца')) missingTariffs.push('4 месяца');
        if (!existingNames.includes('5 месяцев')) missingTariffs.push('5 месяцев');
        if (!existingNames.includes('7 месяцев')) missingTariffs.push('7 месяцев');
        if (!existingNames.includes('8 месяцев')) missingTariffs.push('8 месяцев');
        if (!existingNames.includes('9 месяцев')) missingTariffs.push('9 месяцев');
        if (!existingNames.includes('10 месяцев')) missingTariffs.push('10 месяцев');
        if (!existingNames.includes('11 месяцев')) missingTariffs.push('11 месяцев');      if (missingTariffs.length > 0) {
          // Можно добавить endpoint для добавления недостающих тарифов
        }
      }
    } catch (error) {
      toast.error(t('auth.failedToLoadTariffs'));
    } finally {
      setTariffsLoading(false);
    }
  };const resetTariffs = async () => {
    try {
      const response = await axios.post('/api/reset-tariffs');
      if (response.data.success) {
        toast.success(`Тарифы обновлены! Добавлено: ${response.data.count} тарифов`);
        await fetchTariffs(); // Обновляем список тарифов
      }
    } catch (error) {
      toast.error('Не удалось обновить тарифы');
    }
  };const onSubmit = async (data) => {
    try {
      // Принудительно обрезаем логин и пароль до максимальной длины
      data.login = data.login?.slice(0, 40);
      data.password = data.password?.slice(0, 20);    // Проверяем что геолокация была получена ранее
      if (!location.latitude || !location.longitude) {
        toast.error(t('location.accessDeniedPrompt'));
        return;
      }    // Нормализация номера телефона
      let normalizedPhone = data.phone.trim();
      if (normalizedPhone.length === 9 && !normalizedPhone.startsWith('+')) {
        normalizedPhone = '+996' + normalizedPhone;
      } else if (normalizedPhone.startsWith('996') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone;
      } else if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
        normalizedPhone = '+996' + normalizedPhone.substring(1);
      }    const response = await axios.post('/api/managers/register-from-qr', {
        ...data,
        phone: normalizedPhone,
        qrToken: token,
        latitude: location.latitude,
        longitude: location.longitude
      });    setRegistered(true);
      reset();    // Автоматически сохраняем данные для будущего входа
      localStorage.setItem('adminLogin', data.login);
      localStorage.setItem('adminPassword', data.password);
      localStorage.setItem('rememberMe', 'true');    toast.success(t('registration.managerSuccess'));
    } catch (error) {    // Специальная обработка для QR_TOKEN_NOT_FOUND
      if (error.response?.data?.error === 'QR_TOKEN_NOT_FOUND') {
        setQrError(error.response.data.message);
        setQrValid(false);
        toast.error(error.response.data.message);
      } else {
        const errorMessage = getErrorMessage(error, t);
        toast.error(errorMessage);
      }
    }
  };if (loading) {
    return <LoadingSpinner />;
  }if (qrValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/45 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('auth.invalidQR')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {qrError || t('auth.qrExpired')}
            </p>
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => navigate('/qr')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('common.back')}
            </motion.button>
          </div>
        </main>
      </div>
    );
  }if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-20 h-10 text-green-600" />
            </motion.div>          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('registration.managerSuccess')}
            </h2>          <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t('registration.success.message')}
            </p>          <div className="space-y-4">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => window.location.href = '/login'}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('registration.goToLogin')}
              </motion.button>            <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => window.close()}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('registration.closeButton')}
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <div className="max-w-2xl mx-auto p-4 mt-16">
        {!registered ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
              <div className="text-center mb-4 lg:mb-8">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/45 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-4">
                  <User className="w-8 h-8 text-primary-600" />
                </div>              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('registration.managerTitle')}
                </h2>              <p className="text-gray-600 dark:text-gray-300">
                  {t('registration.managerDescription')}
                </p>              {/* Индикатор геолокации */}
                <div className="mt-4">
                  {location.latitude && location.longitude ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{t('location.obtained')}</span>
                    </div>
                  ) : locationError ? (
                    <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{locationError}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('location.fetching')}</span>
                    </div>
                  )}
                </div>
              </div>            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('firstName', {
                      required: t('registration.errors.firstNameRequired'),
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.firstNameMaxLength')
                      }
                    })}
                    maxLength="20"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={t('registration.firstNamePlaceholder')}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.lastName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('lastName', {
                      required: t('registration.errors.lastNameRequired'),
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.lastNameMaxLength')
                      }
                    })}
                    maxLength="20"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={t('registration.lastNamePlaceholder')}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('registration.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('phone', {
                    required: t('registration.errors.phoneRequired'),
                    pattern: {
                      value: /^(\+996)?\d{9}$/,
                      message: t('registration.errors.phoneFormat')
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('registration.phonePlaceholder')}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.login')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('login', {
                      required: t('registration.errors.loginRequired'),
                      minLength: {
                        value: 3,
                        message: t('registration.errors.loginMinLength')
                      },
                      maxLength: {
                        value: 40,
                        message: t('registration.errors.loginMaxLength')
                      }
                    })}
                    maxLength="40"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={t('registration.loginPlaceholder')}
                  />
                </div>
                {errors.login && (
                  <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
                )}
              </div>            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('password', {
                      required: t('registration.errors.passwordRequired'),
                      minLength: {
                        value: 6,
                        message: t('registration.errors.passwordMinLength')
                      },
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.passwordMaxLength')
                      }
                    })}
                    type="password"
                    maxLength="20"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={t('registration.passwordPlaceholder')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.tariff')}
                </label>
                <div className="relative max-w-[245px]">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    {...register('tariffId', { required: t('registration.errors.tariffRequired') })}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none max-w-[245px] md:w-full lg:w-full"
                  >
                    {tariffs.map(tariff => (
                      <option key={tariff.id} value={tariff.id} className="text-xs md:text-sm lg:text-sm">
                        {tariff.name} - {tariff.duration} {t('tariffs.days')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                {errors.tariffId && (
                  <p className="mt-1 text-sm text-red-600">{errors.tariffId.message}</p>
                )}
              </div>            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.employees')}
                </label>
                <div className="relative max-w-[245px]">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    {...register('maxEmployees', { required: t('registration.errors.maxEmployeesRequired') })}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none max-w-[245px] md:w-full lg:w-full"
                  >
                    {[10,20,30,40,50,60,70,80,90,100].map(count => (
                      <option key={count} value={count} className="text-xs md:text-sm lg:text-sm">{t('registration.employeeCountValue', { count })}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/1 lg:top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                {errors.maxEmployees && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxEmployees.message}</p>
                )}
              </div>
            </div>          <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              type="submit"
              className="w-full py-2 lg:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>{t('registration.registerButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('registration.successTitle')}
              </h2>            <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('registration.successMessage')}
              </p>            <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => navigate('/')}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t('registration.goToLogin')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManagerRegistration;

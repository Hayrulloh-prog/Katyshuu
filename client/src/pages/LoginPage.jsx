import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, User, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { getErrorMessage } from '../utils/errorTranslations';
import axios from 'axios';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();// Загружаем сохраненные данные при монтировании
  useEffect(() => {
    const savedLogin = localStorage.getItem('adminLogin');
    const savedPassword = localStorage.getItem('adminPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';  if (savedLogin && savedPassword && savedRememberMe) {
      // Автоматически устанавливаем сохраненные значения
      setValue('login', savedLogin);
      setValue('password', savedPassword);
    }
  }, []);

const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Принудительно обрезаем логин и пароль до максимальной длины
      data.login = data.login.slice(0, 40);
      data.password = data.password.slice(0, 20);    let authType;
      // Check if this is Super Admin login (by email or direct access)
      if (data.login === 'hayrulloh1706@gmail.com' ||
          window.location.pathname === '/admin') {
        authType = 'super-admin';
      } else if (location.state?.role === 'manager' || data.login.includes('@gmail.com')) {
        authType = 'manager';
      } else {
        authType = 'employee';
      }    const result = await login(data, authType);    if (result.success) {
        const { user: userData } = result;      // Save login and password if it's an admin or manager
        if (userData.role === 'manager' || userData.role === 'superAdmin') {
          localStorage.setItem('adminLogin', data.login);
          localStorage.setItem('adminPassword', data.password);
          localStorage.setItem('rememberMe', 'true');
        }      toast.success(t('auth.loginSuccess'));      // Navigate based on user role
        if (userData.role === 'superAdmin') {
          navigate('/admin');
        } else if (userData.role === 'manager') {
          navigate('/manager');
        } else if (userData.role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Обрабатываем ошибку от AuthContext
        const error = result.originalError || new Error(result.error);      // Проверяем на ошибку ограничения входа
        if (error.response?.data?.error?.includes('Too many login attempts')) {
          toast.error('Слишком много попыток входа! Попробуйте:', {
            duration: 10000,
          });
          setTimeout(() => {
            toast.error('1. Подождать 15-30 минут', { duration: 5000 });
            setTimeout(() => {
              toast.error('2. Использовать другой браузер', { duration: 5000 });
            }, 1000);
          }, 1000);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {    toast.error(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col relative overflow-hidden">
      <Header />    <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
            <div className="text-center mb-4 sm:mb-8">
              <LogIn className="mx-auto h-12 w-12 sm:h-12 sm:w-12 text-primary-600 dark:text-primary-400" />
              <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('auth.loginTitle')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('auth.loginDescription')}
              </p>
            </div>          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.login')}
                </label>
                <input
                  {...register('login', {
                    required: t('auth.loginRequired'),
                    maxLength: { value: 40, message: 'Логин не должен превышать 40 символов' }
                  })}
                  type="text"
                  maxLength="40"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('auth.loginPlaceholder')}
                />
                {errors.login && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.login.message}
                  </p>
                )}
              </div>            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: t('auth.passwordRequired'),
                      maxLength: { value: 20, message: 'Пароль не должен превышать 20 символов' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    maxLength="20"
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    t('auth.signIn')
                  )}
                </button>
              </div>
            </form>          <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('auth.noAccount')}{' '}
                <button
                  onClick={() => navigate('/')}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth.backToHome')}
                </button>
              </p>          </div>
          </div>
        </motion.div>      {/* Decorative blur elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-10 left-10 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full blur-xl -z-10"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full blur-xl -z-10"
        />
      </main>
    </div>
  );
};

export default LoginPage;

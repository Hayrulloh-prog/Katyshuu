import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { UserIcon, PhoneIcon } from '../components/icons';
import Header from '../components/Header';

const EmployeeRegistration = ({ userData, onRegister, isLoading = false }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [currentUserData, setCurrentUserData] = useState(userData);useEffect(() => {
    // Проверяем OAuth данные из localStorage
    const oauthData = localStorage.getItem('oauthCallbackData');
    if (oauthData) {
      const data = JSON.parse(oauthData);
      setFormData(prev => ({
        ...prev,
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      }));
      setCurrentUserData(data);
      // Не удаляем OAuth данные, они нужны для регистрации
    } else if (userData) {
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      }));
    }
  }, [userData]);const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));  if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };const validateForm = () => {
    const newErrors = {};  if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.firstNameRequired');
    } else if (formData.firstName.length > 20) {
      newErrors.firstName = t('registration.errors.firstNameMaxLength');
    }  if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.lastNameRequired');
    } else if (formData.lastName.length > 20) {
      newErrors.lastName = t('registration.errors.lastNameMaxLength');
    }  if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('validation.phoneInvalid');
    }  setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };const handleSubmit = (e) => {
    e.preventDefault();  if (!validateForm()) {
      return;
    }  // Получаем актуальные OAuth данные
    const oauthData = localStorage.getItem('oauthCallbackData');
    let oauthInfo = {};
    if (oauthData) {
      oauthInfo = JSON.parse(oauthData);
    }  // Нормализация номера телефона
    let normalizedPhone = formData.phone.trim();
    if (normalizedPhone.length === 9 && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+996' + normalizedPhone;
    } else if (normalizedPhone.startsWith('996') && normalizedPhone.length === 12) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
      normalizedPhone = '+996' + normalizedPhone.substring(1);
    }  onRegister({
      ...formData,
      phone: normalizedPhone,
      googleId: oauthInfo?.googleId || currentUserData?.googleId,
      appleId: oauthInfo?.appleId || currentUserData?.appleId,
      email: oauthInfo?.email || currentUserData?.email,
      provider: oauthInfo?.provider || currentUserData?.provider
    });
  };return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
          <div className="text-center mb-4 sm:mb-8">
            <UserIcon className="mx-auto h-12 w-12 sm:h-12 sm:w-12 text-primary-600 dark:text-primary-400" />
            <h2 className="my-4 text-3xl font-bold text-gray-900 dark:text-white ">
              {t('auth.registration')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('auth.registrationDescription')}
            </p>                    </div>        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  maxLength="20"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.firstName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('auth.firstNamePlaceholder')}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.firstName}
                  </motion.p>
                )}
              </div>            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  maxLength="20"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.lastName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('auth.lastNamePlaceholder')}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.lastName}
                  </motion.p>
                )}
              </div>
            </div>          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.phone')}
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.phone
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="+996 (XXX) XX-XX-XX"
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.phone}
                </motion.p>
              )}
            </div>
          <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium py-3 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('auth.registering')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.completeRegistration')}</span>
                </>
              )}
            </motion.button>
          </form>        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {t('auth.termsNotice')}
            </p>
          </div>
        </div>      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-10 left-10 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full blur-xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full blur-xl"
        />
      </div>
    </div>
  );
};

export default EmployeeRegistration;

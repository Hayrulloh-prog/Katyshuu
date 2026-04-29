import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Globe, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Header = ({ showLogin = false, onLoginClick }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();const handleLogout = () => {
    logout();
    toast.success(t('auth.logoutSuccess'));
    // Set a flag to prevent unauthorized error message
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };const languages = [
    { code: 'ru', name: 'Рус', flag: '🇷🇺' },
    { code: 'kg', name: 'Кыр', flag: '🇰🇬' },
    { code: 'en', name: 'Eng', flag: '🇬🇧' }
  ];return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-sm">
                <rect width="32" height="32" rx="8" fill="#2563EB"/>
                <text
                  x="50%"
                  y="52%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontFamily="'Inter', 'Roboto', 'Helvetica Neue', sans-serif"
                  fontWeight="900"
                  fontSize="18"
                  letterSpacing="-0.5">K</text>
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Катышуу
              </span>
            </motion.div>
          </div>        {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>          {/* Language Selector */}
            <div className="relative group">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                className="flex items-center space-x-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {languages.find(lang => lang.code === i18n.language)?.flag || '🇰🇬'}
                </span>
              </motion.button>            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      i18n.language === lang.code ? 'bg-primary-50 dark:bg-primary-900/45 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>          {/* User Menu or Login Button */}
            {user ? (
              <div className="relative group">
                <motion.button
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ opacity: 0.8 }}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden max-[550px]:hidden">
                    {user.firstName || user.login}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden max-[550px]:hidden">
                    hayrulloh1706@gmail.com
                  </span>
                </motion.button>              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/45 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            ) : showLogin ? (
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={onLoginClick}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t('navigation.login')}
              </motion.button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

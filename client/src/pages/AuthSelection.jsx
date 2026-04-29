import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { GoogleIcon } from '../components/icons';
import Header from '../components/Header';
import { LogIn } from 'lucide-react';

const AuthSelection = ({ onProviderSelect, isLoading = false }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(null);const handleGoogleAuth = () => {
    if (isLoading) return;
    localStorage.setItem('oauthProvider', 'google');
    onProviderSelect('google');
  };
return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col relative overflow-hidden">
      <Header />    <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
            <div className="text-center mb-8">
              <LogIn className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400" />
              <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('auth.selectProvider')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('auth.selectProviderDescription')}
              </p>
            </div>          {/* Кнопки провайдеров */}
            <div className="space-y-3">
              {/* Google */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered('google')}
                onHoverEnd={() => setIsHovered(null)}
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <GoogleIcon className={`w-5 h-5 transition-colors duration-200 ${isHovered === 'google' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {t('auth.continueWithGoogle')}
                  </span>
                </div>
              </motion.button>          </div>          {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  {t('auth.securityNotice')}
                </p>
              </div>
            </motion.div>
          </div>
          {/* Индикатор загрузки */}
          {isLoading && <LoadingSpinner message={t('auth.authenticating')} />}
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

export default AuthSelection;

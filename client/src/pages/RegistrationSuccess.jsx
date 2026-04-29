import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const RegistrationSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <div className="flex items-center justify-center min-h-screen -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('registration.success.title')}
          </motion.h1>        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
          >
            {t('registration.successMessage')}
          </motion.p>        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => navigate('/')}
              className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2 shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
            >
              <span>{t('registration.closeButton')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>          <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('registration.goToLogin')}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;

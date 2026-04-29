import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, LogOut } from 'lucide-react';
import Header from '../components/Header';

const CheckInSuccessPage = ({ attendanceData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8 text-center">
            {/* Animated Check Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
            </motion.div>          {/* Success Message */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('employee.checkInSuccess')}
            </motion.h1>          <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-gray-600 dark:text-gray-300 mb-8"
            >
              {t('employee.checkInMessage')}
            </motion.p>          {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-blue-50 dark:bg-blue-900/45 rounded-lg p-4 mb-8 border border-blue-200 dark:border-blue-800"
            >
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('employee.timeSaved')} {attendanceData?.time ?
                  new Date(attendanceData.time).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) :
                  new Date().toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </p>
            </motion.div>          {/* Logout Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full py-3 bg-gray-700 hover:bg-gray-850 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('employee.logout')}</span>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CheckInSuccessPage;

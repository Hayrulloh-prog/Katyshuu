import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Smartphone, UserX, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

const SecurityViolationPage = () => {
  const navigate = useNavigate();
  const [violationData, setViolationData] = useState(null);useEffect(() => {
    const data = localStorage.getItem('violationData');
    if (data) {
      try {
        setViolationData(JSON.parse(data));
      } catch (error) {
        // Error parsing violation data
      }
    }  // Clear violation data after 5 seconds
    const timer = setTimeout(() => {
      localStorage.removeItem('violationData');
    }, 5000);  return () => clearTimeout(timer);
  }, []);const handleGoBack = () => {
    localStorage.removeItem('violationData');
    localStorage.removeItem('userAuth');
    navigate('/');
  };return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] border-2 border-red-500 dark:border-red-600 p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-6 border-4 border-red-500"
            >
              <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400" />
            </motion.div>          {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center text-red-600 dark:text-red-400 mb-4"
            >
              🚫 НАРУШЕНИЕ ПРАВИЛ!
            </motion.h1>          {/* Main Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-700"
            >
              <p className="text-center text-red-800 dark:text-red-200 font-medium">
                {violationData?.message || 'Вы не можете отметиться с чужого устройства. Нарушение правил безопасности!'}
              </p>
            </motion.div>          {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 mb-6"
            >
              <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Smartphone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Текущее устройство</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {violationData?.currentDevice || 'Неизвестное устройство'}
                  </p>
                </div>
              </div>            <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Lock className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ожидаемое устройство</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {violationData?.savedDevice || 'Зарегистрированное устройство'}
                  </p>
                </div>
              </div>            {violationData?.scannerInfo && (
                <div className="flex items-center space-x-3 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg border border-red-300">
                  <UserX className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-xs text-red-600 dark:text-red-400">Попытка отметки</p>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {violationData.scannerInfo.firstName} {violationData.scannerInfo.lastName}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>          {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6"
            >
              <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                <span className="font-semibold">Важно:</span> Каждый сотрудник должен отмечаться только со своего личного устройства.
                Использование чужого устройства запрещено правилами безопасности.
              </p>
            </motion.div>          {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoBack}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Вернуться на главную</span>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SecurityViolationPage;

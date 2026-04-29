import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = true, message, size = 'h-12 w-12' }) => {
  const { t } = useTranslation();const content = (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className={`rounded-full ${size} border-b-2 border-primary-600 mb-4`}
      />
      <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse text-center">
        {message || t('common.loading')}
      </p>
    </div>
  );if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50/80 dark:bg-gray-900 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }return content;
};

export default LoadingSpinner;
// Перенаправление к выбору действия...
// если регистрированный сотрудник сканирует кр кода то никак не должен отображаться стр Кызматкерди каттоо
// Каттоону аягына чыгаруу үчүн маалыматтарды толтуруңуз

// Аты
// Khairulloh
// Фамилиясы
// Youldashev
// Телефону
// +996 (XXX) XX-XX-XX

// Каттоону аягына чыгаруу
// Каттоо менен сиз колдонуу шарттарына макул болосуз
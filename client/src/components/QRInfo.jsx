import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { QrCodeIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const QRInfo = ({ manager, scanType, isDarkMode }) => {
  const { t } = useTranslation();const getScanTypeText = () => {
    switch (scanType) {
      case 'first':
        return {
          title: t('qrInfo.firstScan.title'),
          description: t('qrInfo.firstScan.description'),
          icon: <BuildingOfficeIcon className="w-8 h-8" />,
          color: 'blue'
        };
      case 'second':
        return {
          title: t('qrInfo.secondScan.title'),
          description: t('qrInfo.secondScan.description'),
          icon: <UserIcon className="w-8 h-8" />,
          color: 'green'
        };
      case 'attendance':
        return {
          title: t('qrInfo.attendance.title'),
          description: t('qrInfo.attendance.description'),
          icon: <QrCodeIcon className="w-8 h-8" />,
          color: 'purple'
        };
      default:
        return {
          title: t('qrInfo.default.title'),
          description: t('qrInfo.default.description'),
          icon: <QrCodeIcon className="w-8 h-8" />,
          color: 'gray'
        };
    }
  };const scanTypeInfo = getScanTypeText();
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
  };return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${colorClasses[scanTypeInfo.color]}`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {scanTypeInfo.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">
            {scanTypeInfo.title}
          </h3>
          <p className="text-xs mt-1 opacity-80">
            {scanTypeInfo.description}
          </p>
          {manager && (
            <p className="text-xs mt-2 font-medium">
              {t('qrInfo.manager')}: {manager.firstName} {manager.lastName}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QRInfo;

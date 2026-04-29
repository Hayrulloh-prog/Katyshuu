import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LocationWarning = ({
  isVisible,
  onClose,
  distanceInMeters,
  maxAllowedDistance,
  managerName
}) => {
  const { t } = useTranslation();if (!isVisible) return null;return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-auto w-full"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-20 h-10 bg-yellow-200 dark:bg-yellow-900/45 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('location.warning')}
            </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>        {/* Content */}
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">
                    {t('location.tooFar')}
                  </p>
                  <p className="text-xs opacity-90">
                    {t('location.manager')}: {managerName}
                  </p>
                </div>
              </div>
            </div>          <div className="text-center py-2">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {distanceInMeters}м
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('location.distanceInfo', { distance: distanceInMeters, maxDistance: maxAllowedDistance })}
              </div>
            </div>          <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('location.ensureAtWork')}
            </p>
          </div>        {/* Actions */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('location.close')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LocationWarning;

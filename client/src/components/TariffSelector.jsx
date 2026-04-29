import React from 'react';
import { useTranslation } from 'react-i18next';

const TariffSelector = ({ value, onChange, error }) => {
  const { t } = useTranslation();const tariffs = [
    { id: 'trial', name: t('tariffs.trial'), duration: 7 },
    { id: '1month', name: t('tariffs.1month'), duration: 30 },
    { id: '2months', name: t('tariffs.2months'), duration: 60 },
    { id: '3months', name: t('tariffs.3months'), duration: 90 },
    { id: '4months', name: t('tariffs.4months'), duration: 120 },
    { id: '5months', name: t('tariffs.5months'), duration: 150 },
    { id: '6months', name: t('tariffs.6months'), duration: 180 },
    { id: '7months', name: t('tariffs.7months'), duration: 210 },
    { id: '8months', name: t('tariffs.8months'), duration: 240 },
    { id: '9months', name: t('tariffs.9months'), duration: 270 },
    { id: '10months', name: t('tariffs.10months'), duration: 300 },
    { id: '11months', name: t('tariffs.11months'), duration: 330 },
    { id: '1year', name: t('tariffs.1year'), duration: 365 }
  ];return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('tariffs.selectTariff')} *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tariffs.map((tariff) => (
          <div
            key={tariff.id}
            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
              value === tariff.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/45'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onChange(tariff.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {tariff.name}
              </h3>
              <input
                type="radio"
                name="tariff"
                value={tariff.id}
                checked={value === tariff.id}
                onChange={() => onChange(tariff.id)}
                className="text-primary-600 focus:ring-primary-500"
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t('tariffs.duration')}: {tariff.duration} {t('tariffs.days')}</p>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
};

export default TariffSelector;

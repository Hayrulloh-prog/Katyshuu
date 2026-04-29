import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ManagerTariffSelector = ({ value, onChange, error, tariffs }) => {
  const { t, i18n } = useTranslation();// Force reload translations when component mounts
  useEffect(() => {
    i18n.reloadResources();
  }, [i18n]);// Mapping for tariff names using useMemo
  const getTariffName = useMemo(() => {
    return (tariffName) => {
      const tariffNames = {
        // Russian names from database mapped to translations
        'Пробный': t('tariffs.trial'),
        '1 месяц': t('tariffs.1month'),
        '2 месяца': t('tariffs.2months'),
        '3 месяца': t('tariffs.3months'),
        '4 месяца': t('tariffs.4months'),
        '5 месяцев': t('tariffs.5months'),
        '6 месяцев': t('tariffs.6months'),
        '7 месяцев': t('tariffs.7months'),
        '8 месяцев': t('tariffs.8months'),
        '9 месяцев': t('tariffs.9months'),
        '10 месяцев': t('tariffs.10months'),
        '11 месяцев': t('tariffs.11months'),
        '1 год': t('tariffs.1year')
      };    const translatedName = tariffNames[tariffName] || tariffName;
      return translatedName;
    };
  }, [t, i18n.language]);const employeeLimits = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];if (!tariffs) {
    return <div>Loading...</div>;
  }return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('registration.tariff')}
          </label>
          <select
            value={value?.tariffId || ''}
            onChange={(e) => onChange({ ...value, tariffId: e.target.value })}
            className={`w-full py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              error ? 'border-red-500' : ''
            }`}
          >
            <option value="">{t('registration.selectTariff')}</option>
            {tariffs
              .filter(tariff => {
                const name = tariff.name.toLowerCase();
                // Исключаем только "12 месяцев", оставляем всё остальное включая "1 год"
                return !name.includes('12 месяцев');
              })
              .map((tariff) => (
                <option key={tariff.id} value={tariff.id.toString()}>
                  {getTariffName(tariff.name)} ({tariff.duration} {t('tariffs.days')})
                </option>
              ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>      <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('registration.maxEmployees')}
          </label>
          <select
            value={value?.maxEmployees || ''}
            onChange={(e) => onChange({ ...value, maxEmployees: e.target.value })}
            className={`w-full py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              error ? 'border-red-500' : ''
            }`}
          >
            <option value="">{t('registration.selectEmployeeLimit')}</option>
            {employeeLimits.map((limit) => (
              <option key={limit} value={limit}>
                {limit} {t('tariffs.employees')}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ManagerTariffSelector;

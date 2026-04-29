import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, LogOut, Clock, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Helper to get device model
const getDeviceModel = () => {
  const ua = navigator.userAgent;
  let deviceModel = 'Unknown Device';// iOS devices
  if (/iPad|iPhone|iPod/.test(ua)) {
    const match = ua.match(/(iPad|iPhone|iPod)/);
    if (match) deviceModel = match[1];
    // Try to get more specific model
    const platform = navigator.platform;
    if (platform) deviceModel += ` (${platform})`;
  }
  // Android devices
  else if (/Android/.test(ua)) {
    const match = ua.match(/Android[^;)]*/);
    if (match) deviceModel = match[0];
    // Try to get device name from user agent
    const deviceMatch = ua.match(/;\s*([^;)]*)\s*Build/);
    if (deviceMatch && deviceMatch[1]) {
      deviceModel = deviceMatch[1].trim();
    }
  }
  // Windows/Mac/Linux
  else {
    const platform = navigator.platform || 'Unknown';
    deviceModel = platform;
  }return deviceModel;
};

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const attendanceAxios = axios.create({
  baseURL: API_URL
});

// Добавляем interceptor для JWT токена
attendanceAxios.interceptors.request.use((config) => {
  const authDataString = localStorage.getItem('userAuth');
  if (authDataString) {
    const authData = JSON.parse(authDataString);
    const token = authData.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const AttendanceActionPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [managerInfo, setManagerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationChecking, setLocationChecking] = useState(true);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [todayCyclesCount, setTodayCyclesCount] = useState(0);
  const [deviceMismatchWarning, setDeviceMismatchWarning] = useState(null);
  const [scannerMismatchWarning, setScannerMismatchWarning] = useState(null);useEffect(() => {
    const initializePage = async () => {
      try {
        const storedAuth = localStorage.getItem('userAuth');
        if (!storedAuth) {
          navigate('/');
          return;
        }      const authData = JSON.parse(storedAuth);
        if (new Date(authData.expiresAt) <= new Date()) {
          localStorage.removeItem('userAuth');
          navigate('/');
          return;
        }      const response = await attendanceAxios.get(`/api/employees/${authData.employeeId}/last-action-oauth`);      if (response.data.success) {
          setLastAction(response.data.lastAction);
          if (response.data.managerInfo) {
            setManagerInfo(response.data.managerInfo);
          }
          if (response.data.todayCyclesCount !== undefined) {
            setTodayCyclesCount(response.data.todayCyclesCount);
          }        if (response.data.managerLocation?.latitude != null) {
            if (!navigator.geolocation) {
              setError({ key: 'attendance.geolocationUnsupported' });
              setLocationChecking(false);
              return;
            }          navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ latitude, longitude });              const manLat = response.data.managerLocation.latitude;
                const manLon = response.data.managerLocation.longitude;              const R = 6371e3;
                const phi1 = latitude * Math.PI/180;
                const phi2 = manLat * Math.PI/180;
                const dPhi = (manLat-latitude) * Math.PI/180;
                const dLon = (manLon-longitude) * Math.PI/180;
                const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
                        Math.cos(phi1) * Math.cos(phi2) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;              if (distance > 10) { // Sync with server tolerance (10m)
                  setError({ key: 'attendance.distanceError', params: { distance: Math.round(distance), radius: 10 } });
                  setLocationVerified(false);
                } else {
                  setLocationVerified(true);
                }
                setLocationChecking(false);
              },
              () => {
                setError({ key: 'attendance.locationAccessDenied' });
                setLocationChecking(false);
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          } else {
            setLocationVerified(true);
            setLocationChecking(false);
          }
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/'); return;
        }
        setError({ key: 'common.errorLoading' });
        setLocationChecking(false);
      }
    };  initializePage();
  }, [navigate]);const handleAction = async (action) => {
    setIsLoading(true);
    setError(null);
    setDeviceMismatchWarning(null);
    setScannerMismatchWarning(null);  try {
      // Get device fingerprint
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;    // Get device model
      const deviceModel = getDeviceModel();    // Get stored auth for employee info
      const storedAuth = localStorage.getItem('userAuth');
      let scannerInfo = null;
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        scannerInfo = {
          firstName: authData.firstName,
          lastName: authData.lastName,
          email: authData.email
        };
      }    const response = await attendanceAxios.post('/api/attendance/action-oauth', {
        action: action,
        latitude: coords.latitude,
        longitude: coords.longitude,
        fingerprint: fingerprint,
        deviceModel: deviceModel,
        scannerInfo: scannerInfo
      });    if (response.data.success) {
        const hasWarning = response.data.deviceMismatch || response.data.scannerMismatch;      if (response.data.deviceMismatch) {
          setDeviceMismatchWarning({
            savedDevice: response.data.savedDevice,
            currentDevice: response.data.currentDevice,
            scannerInfo: response.data.scannerInfo,
            deviceOwner: response.data.deviceOwner
          });
        }      if (response.data.scannerMismatch) {
          setScannerMismatchWarning({
            scannerInfo: response.data.scannerInfo
          });
        }      localStorage.setItem('attendanceResult', JSON.stringify({ ...response.data, action }));      if (hasWarning) {
          setTimeout(() => {
            navigate(action === 'checkin' ? '/checkin-success' : '/checkout-success');
          }, 4000);
        } else {
          navigate(action === 'checkin' ? '/checkin-success' : '/checkout-success');
        }
      }
    } catch (err) {
      const serverError = err.response?.data?.error;
      if (serverError === 'DEVICE_MISMATCH_STRICT') {
        // STRICT mode - navigate to violation page
        const violationData = {
          type: 'DEVICE_MISMATCH',
          message: err.response?.data?.message || 'Вы не можете отметиться с чужого устройства. Нарушение правил безопасности!',
          savedDevice: err.response?.data?.savedDevice,
          currentDevice: err.response?.data?.currentDevice,
          scannerInfo: err.response?.data?.scannerInfo
        };
        localStorage.setItem('violationData', JSON.stringify(violationData));
        navigate('/security-violation');
        return;
      } else if (serverError === 'TOO_FAR') {
        setError({ key: 'attendance.distanceError', params: { distance: err.response.data.distance, radius: err.response.data.maxDistance } });
      } else if (serverError === 'LOCATION_REQUIRED') {
        setError({ key: 'attendance.locationAccessDenied' });
      } else if (err.response?.status === 400) {
        setError(serverError || { key: 'common.errorOccurred' });
      } else {
        setError({ key: 'common.errorOccurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };
const formatLastAction = () => {
    if (!lastAction) return null;  // Проверяем, есть ли реальные данные о действиях
    if (!lastAction.checkInTime && !lastAction.checkOutTime) {
      return null; // Новый сотрудник без действий
    }  // Определяем последнее действие на основе времени
    let action = 'unknown';
    let actionTime = null;  // Если есть только checkInTime - последнее действие это приход
    if (lastAction.checkInTime && !lastAction.checkOutTime) {
      action = 'checkin';
      actionTime = lastAction.checkInTime;
    }
    // Если есть только checkOutTime (checkInTime null) - последнее действие это уход
    else if (!lastAction.checkInTime && lastAction.checkOutTime) {
      action = 'checkout';
      actionTime = lastAction.checkOutTime;
    }
    // Если есть и checkInTime, и checkOutTime - сравниваем время
    else if (lastAction.checkInTime && lastAction.checkOutTime) {
      const checkInTime = new Date(lastAction.checkInTime);
      const checkOutTime = new Date(lastAction.checkOutTime);    // Если checkOutTime позже checkInTime, то последнее действие - уход
      if (checkOutTime > checkInTime) {
        action = 'checkout';
        actionTime = lastAction.checkOutTime;
      } else {
        // Иначе последнее действие - приход
        action = 'checkin';
        actionTime = lastAction.checkInTime;
      }
    }  // Используем правильное время для действия
    const date = new Date(actionTime || lastAction.checkInTime || lastAction.date);
    const lang = i18n.language === 'en' ? 'en-US' : (i18n.language === 'kg' ? 'ky-KG' : 'ru-RU');  const formattedDate = date.toLocaleDateString(lang, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString(lang, {
      hour: '2-digit',
      minute: '2-digit'
    });  return {
      action: action,
      date: formattedDate,
      time: formattedTime,
      fullDate: date
    };
  };const lastActionFormatted = formatLastAction();// Таймер для ограничения 1 минута (ЗАКОММЕНТИРОВАНО)
  // useEffect(() => {
  //   if (lastActionFormatted?.fullDate) {
  //     const calculateRemaining = () => {
  //       const lastTime = new Date(lastActionFormatted.fullDate).getTime();
  //       const now = new Date().getTime();
  //       const diff = Math.floor((now - lastTime) / 1000);
  //       if (diff < 60) {
  //         setSecondsRemaining(60 - diff);
  //       } else {
  //         setSecondsRemaining(0);
  //       }
  //     };
  //
  //     calculateRemaining();
  //     const interval = setInterval(calculateRemaining, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [lastActionFormatted?.fullDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner fullScreen={false} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
            {/* Заголовок */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('attendance.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('attendance.description')}
              </p>
              {managerInfo && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 bg-gray-100 dark:bg-gray-700/50 inline-block px-3 py-1 rounded-full">
                  {t('attendance.manager')}: <span className="font-semibold text-gray-700 dark:text-gray-200">{managerInfo.firstName} {managerInfo.lastName}</span>
                </p>
              )}
            </motion.div>          {/* Информация о последнем действии - только если были предыдущие действия */}
            {lastActionFormatted && lastActionFormatted.action !== 'unknown' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-blue-50 dark:bg-blue-900/45 rounded-lg p-4 mb-8 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('attendance.lastActionPrefix')}{' '}
                      <span className={lastActionFormatted.action === 'checkin' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {lastActionFormatted.action === 'checkin' ? t('attendance.checkinVerb') : t('attendance.checkoutVerb')}
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {lastActionFormatted.date} {t('attendance.at')} {lastActionFormatted.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Приветственное сообщение для новых сотрудников */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-green-50 dark:bg-green-900/45 rounded-lg p-4 mb-8 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('attendance.welcomeTitle')}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t('attendance.welcomeDescription')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}          {/* Ошибка */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/45 rounded-lg border border-red-200 dark:border-red-800"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  {typeof error === 'string'
                    ? (t(`attendance.${error}`) === `attendance.${error}` ? error : t(`attendance.${error}`))
                    : t(error.key, error.params)}
                </p>
              </motion.div>
            )}          {/* Device Mismatch Warning - foreign device */}
            {deviceMismatchWarning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-600 dark:bg-red-700 rounded-lg border-2 border-red-700 dark:border-red-500 text-white"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-8 h-8 text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-white mb-3">
                      ⚠️ {t('attendance.foreignDeviceWarning')}
                    </p>                  {deviceMismatchWarning.deviceOwner && (
                      <div className="bg-red-800 dark:bg-red-900 rounded-lg p-3 mb-3 border-2 border-red-400">
                        <p className="text-xs text-red-200 mb-1 uppercase tracking-wider">
                          {t('attendance.deviceBelongsTo')}:
                        </p>
                        <p className="text-lg font-bold text-white">
                          {deviceMismatchWarning.deviceOwner.firstName} {deviceMismatchWarning.deviceOwner.lastName}
                        </p>
                      </div>
                    )}                  <p className="text-sm text-red-100 mb-3">
                      {t('attendance.foreignDeviceMessage')}
                    </p>                  <div className="bg-red-500/30 rounded p-2 mb-2">
                      <p className="text-xs text-red-100">
                        <span className="font-semibold">{t('attendance.scannerLabel')}:</span>{' '}
                        {deviceMismatchWarning.scannerInfo?.firstName} {deviceMismatchWarning.scannerInfo?.lastName}
                      </p>
                    </div>                  <p className="text-xs text-red-200 mt-3 border-t border-red-400 pt-2">
                      {t('attendance.recordedButViolation')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}          {/* Scanner Mismatch Warning - employee marking for another */}
            {scannerMismatchWarning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-600 dark:bg-red-700 rounded-lg border-2 border-red-700 dark:border-red-500 text-white"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-8 h-8 text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-white mb-3">
                      ⚠️ {t('attendance.scannerMismatchWarning')}
                    </p>                  <div className="bg-red-800 dark:bg-red-900 rounded-lg p-3 mb-3 border-2 border-red-400">
                      <p className="text-xs text-red-200 mb-1 uppercase tracking-wider">
                        {t('attendance.actualScanner')}:
                      </p>
                      <p className="text-lg font-bold text-white">
                        {scannerMismatchWarning.scannerInfo?.firstName} {scannerMismatchWarning.scannerInfo?.lastName}
                      </p>
                    </div>                  <p className="text-sm text-red-100 mb-3">
                      {t('attendance.scannerMismatchMessage')}
                    </p>                  <p className="text-xs text-red-200 mt-3 border-t border-red-400 pt-2">
                      {t('attendance.recordedButViolation')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Кнопки действий */}
            {locationChecking ? (
              <LoadingSpinner fullScreen={false} message={t('attendance.locationChecking')} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-4"
              >
                {locationVerified && todayCyclesCount >= 5 && lastActionFormatted?.action === 'checkout' ? (
                  /* Информационное сообщение при достижении лимита 5 циклов - только если последнее действие было уход */
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                      {t('attendance.dailyLimitReached', { count: todayCyclesCount })}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                      {t('attendance.dailyLimitAllCyclesDone')}
                    </p>
                  </div>
                ) : locationVerified && todayCyclesCount >= 5 && lastActionFormatted?.action === 'checkin' ? (
                  /* 5 циклов достигнут, но сотрудник еще не вышел - показываем только кнопку выхода */
                  <>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center mb-4">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        {t('attendance.dailyLimitCanFinishCycle')}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ opacity: 0.8 }}
                      onClick={() => handleAction('checkout')}
                      disabled={isLoading}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-3"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t('attendance.buttonCheckOut')}</span>
                    </motion.button>
                  </>
                ) : locationVerified ? (
                  <>
                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ opacity: 0.8 }}
                      onClick={() => handleAction('checkin')}
                      disabled={isLoading}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-3"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>{t('attendance.buttonCheckIn')}</span>
                    </motion.button>                  <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ opacity: 0.8 }}
                      onClick={() => handleAction('checkout')}
                      disabled={isLoading}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-3"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t('attendance.buttonCheckOut')}</span>
                    </motion.button>
                  </>
                ) : null}              {!locationVerified && (
                  <motion.button
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ opacity: 0.8 }}
                    onClick={() => navigate('/')}
                    className="w-full py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>{t('common.close')}</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AttendanceActionPage;

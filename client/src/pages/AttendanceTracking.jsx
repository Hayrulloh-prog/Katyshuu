import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Clock, MapPin, Smartphone, User, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationWarning from '../components/LocationWarning';
import { useTranslation } from 'react-i18next';

const AttendanceTracking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [locationWarning, setLocationWarning] = useState({
    isVisible: false,
    distanceInMeters: 0,
    maxAllowedDistance: 10,
    managerName: '',
    pendingAction: null
  });useEffect(() => {
    validateQRToken();
  }, [token]);// Запрашиваем геолокацию сразу после загрузки страницы
  useEffect(() => {
    const requestGeolocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });      setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });    } catch (geoError) {
        setLocationError('Не удалось получить местоположение. Разрешите доступ к геолокации и попробуйте обновить страницу.');
        toast.error('Не удалось получить местоположение. Разрешите доступ к геолокации и попробуйте обновить страницу.');
      }
    };  requestGeolocation();
  }, []);const validateQRToken = async () => {
    try {
      const response = await axios.get(`/api/qr/token/${token}`);
      setQrData(response.data);    // If it's attendance tracking, check today's attendance
      if (response.data.type === 'ATTENDANCE') {
        await checkTodayAttendance(response.data.employee.id);
        return;
      }
    } catch (error) {
      setQrData({ valid: false });
    } finally {
      setLoading(false);
    }
  };const checkTodayAttendance = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/api/attendance/today/${employeeId}`);
      setTodayAttendance(response.data);    // Reset action if completed attendance
      if (response.data?.checkOutTime) {
        setAction(null); // Reset to show check-in option immediately
      }
    } catch (error) {
      setTodayAttendance(null);
    }
  };const handleAction = async (actionType) => {
    setProcessing(true);
    try {
      // Проверяем что геолокация была получена ранее
      if (!location.latitude || !location.longitude) {
        toast.error('Местоположение не получено. Разрешите доступ к геолокации и обновите страницу.');
        setProcessing(false);
        return;
      }    // Check distance if employee has manager with registration location
      try {
        const distanceResponse = await axios.post('/api/attendance/check-distance', {
          employeeId: qrData.employee.id,
          employeeLatitude: location.latitude,
          employeeLongitude: location.longitude
        });

      if (distanceResponse.data.hasManagerLocation && distanceResponse.data.isTooFar) {
          // Show warning dialog but no option to proceed
          setLocationWarning({
            isVisible: true,
            distanceInMeters: distanceResponse.data.distanceInMeters,
            maxAllowedDistance: distanceResponse.data.maxAllowedDistance,
            managerName: `${distanceResponse.data.manager.firstName} ${distanceResponse.data.manager.lastName}`,
            pendingAction: null // No pending action - just show warning
          });
          setProcessing(false);
          return;
        }
      } catch (distanceError) {
        // If distance check fails, don't proceed with attendance
        toast.error('Не удалось проверить расстояние. Попробуйте еще раз.');
        setProcessing(false);
        return;
      }    // Proceed with attendance marking only if distance is OK
      await markAttendance(actionType, { coords: { latitude: location.latitude, longitude: location.longitude } });  } catch (error) {
      toast.error('Ошибка при выполнении действия');
      setProcessing(false);
    }
  };const markAttendance = async (actionType, position) => {
    try {
      const attendanceData = {
        employeeId: qrData.employee.id,
        action: actionType,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        ip: await getClientIP(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        deviceFingerprint: generateDeviceFingerprint()
      };    const response = await axios.post('/api/attendance', attendanceData);    if (response.data.message === 'check-in recorded') {
        toast.success('Вы успешно отметили приход!');
        setAction('checked-in');
        setTodayAttendance(response.data.attendance);
      } else if (response.data.message === 'check-out recorded') {
        toast.success('Вы успешно отметили уход!');
        setAction('checked-out');
        setTodayAttendance(response.data.attendance);
      }
    } catch (error) {
      toast.error('Ошибка при записи посещения');
    } finally {
      setProcessing(false);
    }
  };const handleLocationWarningClose = () => {
    setLocationWarning({
      isVisible: false,
      distanceInMeters: 0,
      maxAllowedDistance: 10,
      managerName: '',
      pendingAction: null
    });
    setProcessing(false);
  };const getClientIP = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      return 'unknown';
    }
  };const generateDeviceFingerprint = () => {
    const nav = window.navigator;
    const screen = window.screen;
    return `${nav.userAgent}-${nav.language}-${screen.colorDepth}-${screen.width}x${screen.height}`;
  };if (loading || processing) {
    return <LoadingSpinner />;
  }if (!qrData?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto p-4 lg:p-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/45 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Недействительный QR-код
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Этот QR-код недействителен или уже использован.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }if (action === 'checked-in') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto p-4 lg:p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-20 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Приход отмечен!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Ваше время прихода успешно записано. Хорошего рабочего дня!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }if (action === 'checked-out') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto p-4 lg:p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-blue-100 dark:bg-blue-900/45 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-20 h-10 text-blue-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Уход отмечен!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Ваше время ухода успешно записано. До свидания!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-md mx-auto p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/45 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-20 h-10 text-primary-600" />
          </div>        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Добрый день, {qrData.employee.firstName}!
          </h1>        <p className="text-gray-600 dark:text-gray-300 mb-4">
            {qrData.manager.firstName} {qrData.manager.lastName}
          </p>        {/* Индикатор геолокации */}
          <div className="mb-6">
            {location.latitude && location.longitude ? (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Местоположение получено</span>
              </div>
            ) : locationError ? (
              <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{locationError}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Получение местоположения...</span>
              </div>
            )}
          </div>        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {todayAttendance?.checkInTime && !todayAttendance?.checkOutTime
                ? 'Выберите действие'
                : 'Отметьте приход или уход'
              }
            </h2>          <div className="space-y-3">
              {/* Show "Я пришёл" if no check-in today OR if already checked out */}
              {(!todayAttendance?.checkInTime || (todayAttendance?.checkInTime && todayAttendance?.checkOutTime)) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction('check-in')}
                  disabled={processing}
                  className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="w-5 h-5" />
                  <span>Я пришёл</span>
                </motion.button>
              )}            {/* Show "Я ухожу" always - allows multiple consecutive check-outs */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction('check-out')}
                disabled={processing}
                className="w-full py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-5 h-5" />
                <span>Я ухожу</span>
              </motion.button>            {/* No waiting message needed anymore */}
            </div>
          </div>        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Геолокация</span>
            </div>
            <div className="flex items-center space-x-1">
              <Smartphone className="w-4 h-4" />
              <span>Устройство</span>
            </div>
          </div>
        </motion.div>
      </div>    {/* Location Warning Modal */}
      <LocationWarning
        isVisible={locationWarning.isVisible}
        onClose={handleLocationWarningClose}
        distanceInMeters={locationWarning.distanceInMeters}
        maxAllowedDistance={locationWarning.maxAllowedDistance}
        managerName={locationWarning.managerName}
      />
    </div>
  );
};

export default AttendanceTracking;

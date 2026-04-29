import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { LogIn, LogOut, CheckCircle } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Header from '../components/Header';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');useEffect(() => {
    checkAttendanceStatus();
    generateFingerprint();
  }, []);const generateFingerprint = async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceFingerprint(result.visitorId);
    } catch (error) {
    }
  };const checkAttendanceStatus = async () => {
    try {
      const response = await axios.get('/api/attendance/status');
      setAttendanceStatus(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post('/api/attendance/check-in', {
        deviceFingerprint
      });    setAttendanceStatus({
        status: 'checked_in',
        action: 'check_out',
        attendance: response.data.attendance
      });    showSuccessMessage(t('employee.checkInSuccess'));
    } catch (error) {
      alert(error.response?.data?.error || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post('/api/attendance/check-out', {
        deviceFingerprint
      });    setAttendanceStatus({
        status: 'completed',
        action: 'completed',
        attendance: response.data.attendance
      });    showSuccessMessage(t('employee.checkOutSuccess'));
    } catch (error) {
      alert(error.response?.data?.error || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };const showSuccessMessage = (message) => {
    // Create a simple success modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-900/45 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">${message}</p>
        <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          OK
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };if (loading) {
    return <LoadingSpinner />;
  }return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <div className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 lg:p-6"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/45 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('employee.selectAction')}
            </h2>          {attendanceStatus?.attendance && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {attendanceStatus.attendance.location && (
                    <>Location: {attendanceStatus.attendance.location}<br /></>
                  )}
                  {attendanceStatus.attendance.checkInTime && (
                    <>Check-in: {new Date(attendanceStatus.attendance.checkInTime).toLocaleTimeString()}</>
                  )}
                </p>
              </div>
            )}
          </div>        <div className="space-y-4">
            {attendanceStatus?.action === 'check_in' && (
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{actionLoading ? t('common.loading') : t('employee.checkIn')}</span>
              </motion.button>
            )}          {attendanceStatus?.action === 'check_out' && (
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <span>{actionLoading ? t('common.loading') : t('employee.checkOut')}</span>
              </motion.button>
            )}          {attendanceStatus?.action === 'completed' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('employee.alreadyCheckedOut')}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  You have completed your attendance for today.
                </p>
              </div>
            )}          {attendanceStatus?.action === 'check_in' && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click the button above to mark your arrival time
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

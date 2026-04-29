import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';
import { handleApiError } from '../utils/errorHandler';
import axios from 'axios';

const AttendanceHistory = ({ employeeId, onClose }) => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, filter, dateRange]);const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        filter,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      };    const response = await axios.get(`/api/employees/${employeeId}/attendance`, { params });
      setRecords(response.data.records);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };const handleExport = async () => {
    try {
      const params = {
        employeeId,
        filter,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      };    const response = await axios.get('/api/attendance/export', {
        params,
        responseType: 'blob'
      });    const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_history_${employeeId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      handleApiError(error);
    }
  };const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };const getStatusColor = (checkIn, checkOut) => {
    if (!checkIn) return 'bg-gray-100 text-gray-800';
    if (!checkOut) return 'bg-yellow-200 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };const getStatusText = (checkIn, checkOut) => {
    if (!checkIn) return t('attendance.status.absent');
    if (!checkOut) return t('attendance.status.present');
    return t('attendance.status.completed');
  };if (loading && currentPage === 1) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.1)] p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('attendance.history.title')}
        </h3>
        <TableSkeleton rows={5} />
      </div>
    );
  }return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('attendance.history.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>      {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{t('attendance.filter.all')}</option>
            <option value="today" className="text-xs md:text-sm lg:text-sm">{t('attendance.filter.today')}</option>
            <option value="week" className="text-xs md:text-sm lg:text-sm">{t('attendance.filter.week')}</option>
            <option value="month" className="text-xs md:text-sm lg:text-sm">{t('attendance.filter.month')}</option>
          </select>        <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />        <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />        <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
            onClick={handleExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('common.export')}</span>
          </motion.button>
        </div>
      </div>    {/* Table */}
      <div className="overflow-x-auto overflow-y-auto sm:overflow-x-auto sm:overflow-y-auto lg:overflow-x-auto lg:overflow-y-auto">
        <table className="w-full min-w-[1090px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.checkIn')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.checkOut')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.location')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.device')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('attendance.table.status')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {records.map((record, index) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(record.date)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatTime(record.checkIn)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatTime(record.checkOut)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {record.location ? (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-xs">
                        {record.location.latitude?.toFixed(4)}, {record.location.longitude?.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono">
                      {record.deviceFingerprint?.slice(0, 8)}...
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.checkIn, record.checkOut)}`}>
                    {getStatusText(record.checkIn, record.checkOut)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>    {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('attendance.pagination.showing', {
                start: (currentPage - 1) * 10 + 1,
                end: Math.min(currentPage * 10, records.length),
                total: records.length
              })}
            </div>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;

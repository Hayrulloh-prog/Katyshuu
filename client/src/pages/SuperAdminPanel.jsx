import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  CheckCircle,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Download,
  QrCode,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import Header from '../components/Header';
import { handleApiError } from '../utils/errorHandler';

const SuperAdminPanel = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();const getTariffDisplayName = (tariff) => {  const currentLang = localStorage.getItem('i18nextLng') || 'kg';  if (currentLang === 'en') {
      // English translations
      if (tariff.name === 'Пробный' || tariff.name === 'Trial') return t('superAdmin.trial');
      if (tariff.name === '1 год' || tariff.name === '1 year') return `1 ${t('superAdmin.year')}`;
      if (tariff.name.includes('месяц') || tariff.name.includes('month')) {
        const months = tariff.name.replace('месяцев', '').replace('месяца', '').replace('месяц', '').replace('months', '').replace('month', '').trim();
        return `${months} ${t('superAdmin.month')}`;
      }
    } else if (currentLang === 'ru') {
      // Russian translations
      if (tariff.name === 'Пробный') return t('superAdmin.trial');
      if (tariff.name === '1 год') return `1 ${t('superAdmin.year')}`;
      if (tariff.name.includes('месяц')) {
        const months = tariff.name.replace('месяцев', '').replace('месяца', '').replace('месяц', '').trim();
        return `${months} ${t('superAdmin.month')}`;
      }
    } else {
      // Kyrgyz translations (default)
      if (tariff.name === 'Пробный') return t('superAdmin.trial');
      if (tariff.name === '1 год') return `1 ${t('superAdmin.year')}`;
      if (tariff.name.includes('месяц')) {
        const months = tariff.name.replace('месяцев', '').replace('месяца', '').replace('месяц', '').trim();
        return `${months} ${t('superAdmin.month')}`;
      }
    }
    return tariff.name;
  };
  const [managers, setManagers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [qrTokens, setQrTokens] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  // Track window width for responsive overflow behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };  // Set initial width
    handleResize();  // Add event listener
    window.addEventListener('resize', handleResize);  // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // No local redirect needed - ProtectedRoute handles this
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: editingManager || {}
  });

// Lock body scroll when modal is open
useEffect(() => {
  if (showEditModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [showEditModal]);

// Update form when editingManager changes
useEffect(() => {
  if (editingManager) {
    reset(editingManager);
  } else {
    reset({});
  }
}, [editingManager, reset]);const fetchManagers = useCallback(async () => {
    try {
      const response = await axios.get(`/api/managers?page=${page}`);    if (page === 1) {
        setManagers(response.data.managers);
      } else {
        setManagers(prev => [...prev, ...response.data.managers]);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {    toast.error(t('error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);const fetchTariffs = useCallback(async () => {
    try {
      const response = await axios.get('/api/managers/tariffs');
      if (response.data) {
        setTariffs(response.data);
      }
    } catch (error) {    if (error.response?.status === 401) {
        toast.error(t('auth.unauthorized'));
      } else if (error.response?.status === 403) {
        toast.error(t('auth.forbidden'));
      } else {
        toast.error(t('error.fetchFailed'));
      }
    }
  }, [t]);const fetchAllEmployees = useCallback(async () => {
    try {
      const response = await axios.get('/api/employees/all');
      if (response.data) {
        setAllEmployees(response.data);
      }
    } catch (error) {    toast.error(t('superAdmin.serverError'));
    }
  }, []);const fetchQrTokens = useCallback(async () => {
    try {
      const response = await axios.get('/api/qr/tokens/all');
      if (response.data) {
        setQrTokens(response.data);
      }
    } catch (error) {    toast.error(t('superAdmin.serverError'));
    }
  }, []);// Only fetch data if user is authenticated and has superAdmin role
  useEffect(() => {
    if (user && user.role === 'superAdmin' && !authLoading) {
      fetchManagers();
      fetchTariffs();
      fetchAllEmployees();
      fetchQrTokens();
    }
  }, [user, authLoading, page, fetchManagers, fetchTariffs, fetchAllEmployees, fetchQrTokens]);const onSubmit = async (data) => {
    try {
      // Принудительно обрезаем логин и пароль до максимальной длины
      data.login = data.login?.slice(0, 40);
      if (data.password) {
        data.password = data.password.slice(0, 20);
      }    // Нормализация номера телефона
      let normalizedPhone = data.phone.trim();
      if (normalizedPhone.length === 9 && !normalizedPhone.startsWith('+')) {
        normalizedPhone = '+996' + normalizedPhone;
      } else if (normalizedPhone.startsWith('996') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone;
      } else if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
        normalizedPhone = '+996' + normalizedPhone.substring(1);
      }    if (editingManager) {
        // Создаем чистый объект данных для обновления
        const updateData = {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: normalizedPhone,
          login: data.login,
          password: data.password,
          tariffId: parseInt(data.tariffId), // Конвертируем в число
          maxEmployees: parseInt(data.maxEmployees), // Конвертируем в число
          isActive: data.isActive
        };      await axios.put(`/api/managers/${editingManager.id}`, updateData);
        toast.success(t('superAdmin.managerUpdated'));
      } else {
        await axios.post('/api/managers', {
          ...data,
          phone: normalizedPhone
        });
        toast.success(t('superAdmin.managerCreated'));
      }    setShowEditModal(false);
      setEditingManager(null);
      reset();
      setPage(1);
      fetchManagers();
    } catch (error) {
      handleApiError(error);
    }
  };const handleEdit = (manager) => {
    setEditingManager(manager);
    reset(manager);
    setShowEditModal(true);
  };const handleDelete = async (id) => {
    if (window.confirm(t('superAdmin.confirmDeleteManager'))) {
      try {
        await axios.delete(`/api/managers/${id}`);
        toast.success(t('superAdmin.managerDeleted'));
        setManagers(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        toast.error(t('superAdmin.deleteError'));
      }
    }
  };const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? t('superAdmin.deactivate') : t('superAdmin.activate');
    if (window.confirm(t('superAdmin.confirmToggleStatus', { action }))) {
      try {      await axios.patch(`/api/managers/${id}/toggle-status`);
        toast.success(t('superAdmin.statusUpdated'));      // Refetch managers to get updated data from server      setPage(1);
        await fetchManagers();    } catch (error) {      toast.error(t('superAdmin.updateStatusError'));
      }
    }
  };const downloadQRCodes = async () => {
    try {
      toast.loading(t('superAdmin.generatingQr'));    const response = await axios.post('/api/qr/download-all', {}, {
        responseType: 'blob'
      });    // Create blob from SVG response
      const blob = new Blob([response.data], { type: 'image/svg+xml' });    // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manager_qr_codes_${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);    // Clean up
      window.URL.revokeObjectURL(url);    toast.success(t('superAdmin.qrDownloaded'));
    } catch (error) {    toast.error(t('superAdmin.serverError'));
    }
  };const loadMore = () => {
    setPage(prev => prev + 1);
  };// Filter managers with expiring tariff (≤5 days) and inactive managers
  const getFilteredManagers = useCallback(() => {
    const today = new Date();  const managersWithExpiry = managers.map(manager => {
      let daysUntilExpiry = Infinity;
      if (manager.lastActivatedAt && manager.tariff?.duration) {
        const activationDate = new Date(manager.lastActivatedAt);
        const expiryDate = new Date(activationDate);
        expiryDate.setDate(expiryDate.getDate() + manager.tariff.duration);
        // Compare at day level (midnight) to avoid time-of-day / timezone drift
        const todayMidnight = new Date(today);
        todayMidnight.setHours(0, 0, 0, 0);
        const expiryMidnight = new Date(expiryDate);
        expiryMidnight.setHours(0, 0, 0, 0);
        daysUntilExpiry = Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
      }
      return { ...manager, _daysUntilExpiry: daysUntilExpiry };
    });  const filtered = managersWithExpiry.filter(manager => {
      // Check if manager is inactive
      if (!manager.isActive) {
        return true;
      }    // Check if tariff is expiring within 5 days (only for active managers)
      if (manager._daysUntilExpiry !== Infinity && manager._daysUntilExpiry <= 5 && manager._daysUntilExpiry >= 0) {
        return true;
      }    return false;
    });  // Sort managers so those with fewest days appear at the top
    filtered.sort((a, b) => a._daysUntilExpiry - b._daysUntilExpiry);  setFilteredManagers(filtered);
  }, [managers]);// Update filtered managers whenever managers data changes
  useEffect(() => {
    getFilteredManagers();
  }, [getFilteredManagers]);if (authLoading || loading) {
    return <LoadingSpinner />;
  }if (!user || user.role !== 'superAdmin') {
    return null; // Will be redirected by useEffect
  }return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('superAdmin.totalManagers')}
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-600">
                    {managers.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary-600" />
              </div>
            </div>          <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('superAdmin.activeManagers')}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {managers.filter(m => m.isActive).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>          <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('superAdmin.inactiveManagers')}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {managers.filter(m => !m.isActive).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-red-600" />
              </div>
            </div>          <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('superAdmin.inactiveQrCodes')}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(() => {
                      const inactiveQrCodes = qrTokens.filter(token =>
                        !token.isUsed &&
                        (token.managerId === null || !managers.some(m => m.id === token.managerId))
                      );                    return inactiveQrCodes.length;
                    })()}
                  </p>
                </div>
                <QrCode className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>        <div className="flex justify-end mb-6">
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={downloadQRCodes}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('superAdmin.downloadQr')}</span>
            </motion.button>
          </div>        {/* Filtered Managers List - Expiring Tariff and Inactive */}
          {filteredManagers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.1)] overflow-hidden mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('superAdmin.filteredManagersTitle')}
              </h2>            <div className='overflow-x-auto overflow-y-auto sm:overflow-x-auto sm:overflow-y-auto lg:overflow-x-auto lg:overflow-y-auto'>
                <table className="w-full min-w-[1170px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.number')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.nameContacts')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.tariff')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.employees')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.status')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.activation')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.registration')}
                      </th>
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tariffExpiry')}
                        </th>
                      <th className="text-center p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredManagers.map((manager, index) => {
                      const today = new Date();
                      let daysUntilExpiry = null;
                      let expiryDate = null;
                      let diffMs = null;                    if (manager.lastActivatedAt && manager.tariff?.duration) {
                        const activationDate = new Date(manager.lastActivatedAt);
                        expiryDate = new Date(activationDate);
                        expiryDate.setDate(expiryDate.getDate() + manager.tariff.duration);                      // Calculate precise difference in MS for hours/minutes display
                        diffMs = expiryDate - today;                      // Keep midnight-based difference for coloring and consistency with other parts
                        const todayMidnight = new Date(today);
                        todayMidnight.setHours(0, 0, 0, 0);
                        const expiryMidnight = new Date(expiryDate);
                        expiryMidnight.setHours(0, 0, 0, 0);
                        daysUntilExpiry = Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
                      }                    return (
                        <motion.tr
                          key={manager.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            !manager.isActive ? 'bg-red-50 dark:bg-red-900/10' :
                            manager.isActive && daysUntilExpiry !== null && daysUntilExpiry <= 5 ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                          }`}
                        >
                          <td className="p-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {filteredManagers.length - index}
                            </span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {manager.firstName} {manager.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {(() => {
                                  const p = manager.phone || '';
                                  if (p.length === 9 && !p.startsWith('+')) return '+996' + p;
                                  if (p.startsWith('0') && p.length === 10) return '+996' + p.substring(1);
                                  if (p.startsWith('996') && p.length === 12) return '+' + p;
                                  return p;
                                })()}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/45 dark:text-primary-400">
                              {getTariffDisplayName(manager.tariff)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900 dark:text-white font-medium">
                                {manager._count.employees}/{manager.maxEmployees}
                              </span>
                              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    manager._count.employees >= manager.maxEmployees
                                      ? 'bg-red-500'
                                      : manager._count.employees >= manager.maxEmployees * 0.8
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((manager._count.employees / manager.maxEmployees) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              manager.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400'
                            }`}>
                              {manager.isActive ? t('superAdmin.active') : t('superAdmin.inactive')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {manager.lastActivatedAt ? new Date(manager.lastActivatedAt).toLocaleDateString('ru-RU') : 'Никогда'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                          </td>
                          <td className="p-4">
                            {daysUntilExpiry !== null ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                diffMs < 0
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400'
                                  : (diffMs / (1000 * 60 * 60 * 24)) <= 5
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/45 dark:text-orange-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400'
                              }`}>
                                {diffMs < 0
                                  ? t('superAdmin.expiredDaysAgo', { count: Math.abs(daysUntilExpiry) })
                                  : (() => {
                                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                      const diffMinutes = Math.floor(diffMs / (1000 * 60));                                    if (diffMs < 1000 * 60 * 60) {
                                        return t('superAdmin.minutesLeft', { count: diffMinutes });
                                      }
                                      if (diffMs < 1000 * 60 * 60 * 24) {
                                        return t('superAdmin.hoursLeft', { count: diffHours });
                                      }
                                      return daysUntilExpiry === 0
                                        ? t('superAdmin.expiresToday')
                                        : t('superAdmin.daysLeft', { count: daysUntilExpiry });
                                    })()
                                }
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Нет данных</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleToggleStatus(manager.id, manager.isActive)}
                                className={`p-2 rounded-lg transition-colors ${
                                  manager.isActive
                                    ? 'hover:bg-green-100 dark:hover:bg-green-900/45'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title={manager.isActive ? t('superAdmin.deactivate') : t('superAdmin.activate')}
                              >
                                {manager.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                              </button>                            <button
                                onClick={() => handleEdit(manager)}
                                className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/45 transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit className="w-5 h-5 text-blue-600" />
                              </button>                            <button
                                onClick={() => handleDelete(manager.id)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/45 transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}        {/* Managers List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.1)] overflow-hidden mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('superAdmin.managers')}
              </h2>                  <div className="overflow-x-auto overflow-y-auto sm:overflow-x-auto sm:overflow-y-auto lg:overflow-x-auto lg:overflow-y-auto">
                <table className="w-full min-w-[1170px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('superAdmin.tableHeaders.number')}
                      </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.nameContacts')}
                        </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.tariff')}
                        </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.employees')}
                        </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.status')}
                        </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.activation')}
                        </th>
                        <th className="text-left p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.registration')}
                        </th>
                        <th className="text-center p-3 lg:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('superAdmin.tableHeaders.actions')}
                        </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager, index) => (
                      <motion.tr
                        key={manager.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="p-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {managers.length - index}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {manager.firstName} {manager.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {manager.phone}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/45 dark:text-primary-400">
                            {getTariffDisplayName(manager.tariff)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 dark:text-white font-medium">
                              {manager._count.employees}/{manager.maxEmployees}
                            </span>
                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  manager._count.employees >= manager.maxEmployees
                                    ? 'bg-red-500'
                                    : manager._count.employees >= manager.maxEmployees * 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min((manager._count.employees / manager.maxEmployees) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            manager.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400'
                          }`}>
                            {manager.isActive ? t('superAdmin.active') : t('superAdmin.inactive')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {manager.lastActivatedAt ? new Date(manager.lastActivatedAt).toLocaleDateString('ru-RU') : 'Никогда'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleToggleStatus(manager.id, manager.isActive)}
                              className={`p-2 rounded-lg transition-colors ${
                                manager.isActive
                                  ? 'hover:bg-green-100 dark:hover:bg-green-900/45'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={manager.isActive ? t('superAdmin.deactivate') : t('superAdmin.activate')}
                            >
                              {manager.isActive ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </button>                          <button
                              onClick={() => handleEdit(manager)}
                              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/45 transition-colors"
                              title={t('common.edit')}
                            >
                              <Edit className="w-5 h-5 text-blue-600" />
                            </button>                          <button
                              onClick={() => handleDelete(manager.id)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/45 transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>            {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-primary-100 text-primary-600 dark:bg-primary-900/45 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    {t('common.showMore')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>    {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingManager ? t('superAdmin.editManager') : t('superAdmin.createManager')}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingManager(null);
                  reset();
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Same form fields as registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.firstName')}
                  </label>
                  <input
                    {...register('firstName', {
                      required: true,
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.firstNameMaxLength')
                      }
                    })}
                    maxLength="20"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.lastName')}
                  </label>
                  <input
                    {...register('lastName', {
                      required: true,
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.lastNameMaxLength')
                      }
                    })}
                    maxLength="20"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('registration.phone')}
                </label>
                <input
                  {...register('phone', {
                    required: true,
                    pattern: /^\+996\d{9}$/
                  })}
                  placeholder="+996XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.login')}
                  </label>
                  <input
                    {...register('login', {
                      required: true,
                      minLength: 3,
                      maxLength: {
                        value: 40,
                        message: t('registration.errors.loginMaxLength')
                      }
                    })}
                    maxLength="40"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {errors.login && (
                    <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
                  )}
                </div>              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.password')}
                  </label>
                  <input
                    {...register('password', {
                      minLength: 6,
                      maxLength: {
                        value: 20,
                        message: t('registration.errors.passwordMaxLength')
                      }
                    })}
                    type="password"
                    maxLength="20"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.tariff')}
                  </label>
                  <select
                    {...register('tariffId', { required: true })}
                    className="appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.4rem_center] bg-no-repeat w-full max-w-[245px] md:max-w-none pr-8 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"
                  >
                    {tariffs.map(tariff => (
                      <option key={tariff.id} value={tariff.id} className="text-xs md:text-sm lg:text-sm">
                        {getTariffDisplayName(tariff)} - {tariff.duration} {t('superAdmin.days')}
                      </option>
                    ))}
                  </select>
                </div>              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('registration.maxEmployees')}
                  </label>
                  <select
                    {...register('maxEmployees', { required: true, min: 1 })}
                    className="appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.4rem_center] bg-no-repeat w-full max-w-[245px] md:max-w-none pr-8 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"
                  >
                    <option value="10" className="text-xs md:text-sm lg:text-sm">10 {t('superAdmin.employees')}</option>
                    <option value="20" className="text-xs md:text-sm lg:text-sm">20 {t('superAdmin.employees')}</option>
                    <option value="30" className="text-xs md:text-sm lg:text-sm">30 {t('superAdmin.employees')}</option>
                    <option value="40" className="text-xs md:text-sm lg:text-sm">40 {t('superAdmin.employees')}</option>
                    <option value="50" className="text-xs md:text-sm lg:text-sm">50 {t('superAdmin.employees')}</option>
                    <option value="60" className="text-xs md:text-sm lg:text-sm">60 {t('superAdmin.employees')}</option>
                    <option value="70" className="text-xs md:text-sm lg:text-sm">70 {t('superAdmin.employees')}</option>
                    <option value="80" className="text-xs md:text-sm lg:text-sm">80 {t('superAdmin.employees')}</option>
                    <option value="90" className="text-xs md:text-sm lg:text-sm">90 {t('superAdmin.employees')}</option>
                    <option value="100" className="text-xs md:text-sm lg:text-sm">100 {t('superAdmin.employees')}</option>
                  </select>
                </div>
              </div>            <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingManager(null);
                    reset();
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;

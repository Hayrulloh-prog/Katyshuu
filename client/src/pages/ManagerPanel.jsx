import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { Users, UserX, Phone, Trash2, X, ChevronDown, Shield, ShieldAlert } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AttendanceChart from "../components/AttendanceChart";
import { useTheme } from "../contexts/ThemeContext";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";
import { useAuth } from "../contexts/AuthContext";
import { handleApiError } from "../utils/errorHandler";

const ManagerPanel = () => {

  const { t } = useTranslation();

  const { isDarkMode } = useTheme();


  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [employees, setEmployees] = useState([]);

  const [absentEmployees, setAbsentEmployees] = useState([]);

  const [attendanceStats, setAttendanceStats] = useState(null);

  const [chartData, setChartData] = useState([]);

  const [allCyclesData, setAllCyclesData] = useState([]);

  const [expandedAbsentRows, setExpandedAbsentRows] = useState(new Set());

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("today");

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(false);

  const [absentPage, setAbsentPage] = useState(1);

  const [hasMoreAbsent, setHasMoreAbsent] = useState(false);

  const [showEmployeeHistory, setShowEmployeeHistory] = useState(false);

  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyLimit, setHistoryLimit] = useState(20);

  const [deviceCheckMode, setDeviceCheckMode] = useState(false); // strict = true, check = false

  const [loadingDeviceMode, setLoadingDeviceMode] = useState(false);

  const isFetchingAbsentRef = useRef(false);



  // No local redirect needed - ProtectedRoute handles this



  const fetchEmployees = useCallback(async () => {

    try {

      const response = await axios.get(

        `/api/attendance/aggregated-status?filter=${filter}`,

      );

      // Сортируем записи по дате в обратном порядке (от новых к старым)

      const sortedEmployees = response.data.sort((a, b) => {

        const timeA = new Date(

          a.recordDate || a.checkInTime || a.employee.updatedAt || 0,

        ).getTime();

        const timeB = new Date(

          b.recordDate || b.checkInTime || b.employee.updatedAt || 0,

        ).getTime();



        // Сначала по дате записи (часто это просто день на 00:00:00)

        if (timeB !== timeA) return timeB - timeA;



        // Если день один и тот же, сортируем по точному времени прихода

        const checkInA = new Date(a.checkInTime || 0).getTime();

        const checkInB = new Date(b.checkInTime || 0).getTime();

        return checkInB - checkInA; // Обратный порядок (новые первые)

      });



      setEmployees(sortedEmployees);

      setHasMore(false); // aggregated-status возвращает все данные сразу

    } catch (error) {

      handleApiError(error);

    } finally {

      setLoading(false);

    }

  }, [filter]); // Добавили filter для обновления данных при смене периода



  const fetchDashboardData = useCallback(async () => {

    isFetchingAbsentRef.current = true;

    try {

      const [statsResponse, absentResponse, chartResponse] = await Promise.all([

        axios.get(`/api/attendance/stats?filter=${filter}`),

        axios.get(

          `/api/attendance/employees/absent?page=${absentPage}&limit=10&filter=${filter}`,

        ),

        axios.get(`/api/attendance/chart?filter=${filter}`),

      ]);



      setAttendanceStats(statsResponse.data);



      if (absentPage === 1) {

        setAbsentEmployees(

          absentResponse.data.employees || absentResponse.data,

        );

      } else {

        setAbsentEmployees((prev) => [

          ...prev,

          ...(absentResponse.data.employees || absentResponse.data),

        ]);

      }



      setHasMoreAbsent(absentResponse.data.hasMore || false);

      setChartData(chartResponse.data);

    } catch (error) {

      handleApiError(error);

    } finally {

      setLoading(false);

      isFetchingAbsentRef.current = false;

    }

  }, [filter, absentPage]);



  const fetchAllCyclesData = useCallback(async () => {

    try {

      const response = await axios.get(

        `/api/attendance/all-cycles?filter=${filter}`,

      );



      setAllCyclesData(response.data);

    } catch (error) {

      handleApiError(error);

    }

  }, [filter]);



  const handleAbsentScroll = (e) => {

    const bottom =

      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;

    if (bottom && hasMoreAbsent && !isFetchingAbsentRef.current) {

      setAbsentPage((prev) => prev + 1);

    }

  };



  const toggleAbsentRow = (employeeId) => {

    setExpandedAbsentRows((prev) => {

      const newSet = new Set(prev);

      if (newSet.has(employeeId)) newSet.delete(employeeId);

      else newSet.add(employeeId);

      return newSet;

    });

  };



  const handleFilterChange = (newFilter) => {

    setFilter(newFilter);

    setAbsentPage(1); // Сбрасываем пагинацию отсутствующих при смене фильтра

    setPage(1); // Сбрасываем пагинацию всех сотрудников

    setAbsentEmployees([]); // Очищаем список отсутствующих

  };



  // Fetch device check mode status

  const fetchDeviceCheckMode = useCallback(async () => {

    try {

      const response = await axios.get('/api/managers/device-check-status');

      setDeviceCheckMode(response.data.strictDeviceCheck);

    } catch (error) {

      console.error('Error fetching device check mode:', error);

    }

  }, []);



  // Toggle device check mode

  const handleToggleDeviceCheck = async () => {

    console.log('🔘 Toggle clicked, current loading state:', loadingDeviceMode);

    if (loadingDeviceMode) {

      console.log('⚠️ Already loading, ignoring click');

      return;

    }



    setLoadingDeviceMode(true);

    console.log('📤 Sending PATCH to /api/managers/toggle-device-check');



    try {

      const response = await axios.patch('/api/managers/toggle-device-check');

      console.log('✅ Response:', response.data);

      setDeviceCheckMode(response.data.strictDeviceCheck);

      toast.success(t(`manager.${response.data.messageKey}`));

    } catch (error) {

      console.error('❌ Error:', error);

      handleApiError(error);

    } finally {

      setLoadingDeviceMode(false);

    }

  };



  useEffect(() => {

    // Always fetch employees for important block

    fetchEmployees();

    fetchDashboardData();

    fetchAllCyclesData();

    fetchDeviceCheckMode(); // Fetch device check mode status

  }, [

    filter,

    absentPage,

    fetchEmployees,

    fetchDashboardData,

    fetchAllCyclesData,

    fetchDeviceCheckMode,

  ]);



  // Infinite scroll for employees table

  useEffect(() => {

    const handleScroll = () => {

      if (

        window.innerHeight + document.documentElement.scrollTop >=

        document.documentElement.offsetHeight - 150

      ) {

        setPage((prev) => {

          if (employees.length > prev * 20) {

            return prev + 1;

          }

          return prev;

        });

      }

    };



    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, [employees.length]);



  // Auto-refresh when page gets focus

  useEffect(() => {

    const handleVisibilityChange = () => {

      if (document.visibilityState === "visible") {

        fetchEmployees();

        fetchDashboardData();

        fetchAllCyclesData();

      }

    };



    const handleFocus = () => {

      // Always fetch employees for important block

      fetchEmployees();

      fetchDashboardData();

      fetchAllCyclesData();

    };



    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("focus", handleFocus);



    return () => {

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", handleFocus);

    };

  }, [filter, fetchEmployees, fetchDashboardData, fetchAllCyclesData]);



  // Initial load - always fetch employees

  useEffect(() => {

    fetchEmployees();

  }, [fetchEmployees]);



  // Lock body scroll when history modal is open

  useEffect(() => {

    if (showEmployeeHistory) {

      document.body.style.overflow = "hidden";

    } else {

      document.body.style.overflow = "unset";

    }

    return () => {

      document.body.style.overflow = "unset";

    };

  }, [showEmployeeHistory]);



  // Real-time updates handlers

  const handleEmployeeUpdate = useCallback(

    (data) => {

      switch (data.type) {

        case "employee_registered":

          // Новый сотрудник зарегистрирован - обновляем список

          fetchEmployees();

          fetchDashboardData();

          fetchAllCyclesData();

          toast.success(

            `Новый сотрудник ${data.employee.firstName} ${data.employee.lastName} добавлен!`,

          );

          break;



        case "deleted":

          // Сотрудник удален - удаляем из списка

          setEmployees((prev) =>

            prev.filter((e) => e.employee.id !== data.employeeId),

          );

          setAbsentEmployees((prev) =>

            prev.filter((e) => e.id !== data.employeeId),

          );

          setAllCyclesData((prev) =>

            prev.filter((e) => e.employee?.id !== data.employeeId),

          );

          fetchDashboardData();

          fetchAllCyclesData();

          toast.success("Сотрудник удален");

          break;



        default:

          // Общее обновление сотрудников

          fetchEmployees();

      }

    },

    [fetchEmployees, fetchDashboardData, fetchAllCyclesData],

  );



  const handleStatsUpdate = useCallback(

    (data) => {

      if (data.type === "attendance") {

        // Обновление посещаемости - обновляем все данные

        fetchEmployees();

        fetchDashboardData();

        fetchAllCyclesData();

      } else {

        // Обновление статистики

        fetchDashboardData();

        fetchAllCyclesData();

      }

    },

    [fetchEmployees, fetchDashboardData, fetchAllCyclesData],

  );



  // Подключаем real-time обновления

  useRealTimeUpdates(handleEmployeeUpdate, handleStatsUpdate);



  const handleDeleteEmployee = async (id) => {

    if (window.confirm(t("manager.confirmDeleteEmployee"))) {

      try {

        const response = await axios.delete(`/api/employees/${id}`);



        setEmployees((prev) => prev.filter((e) => e.employee.id !== id));

        setAbsentEmployees((prev) => prev.filter((e) => e.id !== id));

        setAllCyclesData((prev) => prev.filter((e) => e.employee?.id !== id));

        fetchDashboardData();

        fetchAllCyclesData();



        toast.success(t("manager.employeeDeleted"));

      } catch (error) {

        handleApiError(error);

      }

    }

  };



  const handleCall = (phone) => {

    window.open(`tel:${phone}`);

  };



  const handleViewEmployeeHistory = async (employeeId) => {

    setHistoryLoading(true);

    setHistoryLimit(20);

    try {

      const response = await axios.get(

        `/api/attendance/employee-history/${employeeId}?filter=${filter}`,

      );



      // Сортируем записи от новых к старым (по времени прихода)

      const sortedData = {

        ...response.data,

        records: response.data.records?.sort((a, b) => {

          // Сортируем по времени прихода (checkInTime) от новых к старым

          const timeA = new Date(

            a.checkInTime || a.checkOutTime || a.date || 0,

          ).getTime();

          const timeB = new Date(

            b.checkInTime || b.checkOutTime || b.date || 0,

          ).getTime();

          return timeB - timeA; // Новые сверху, старые снизу

        }),

      };



      setSelectedEmployeeHistory(sortedData);

      setShowEmployeeHistory(true);

    } catch (error) {

      toast.error(t("error.fetchHistoryFailed"));

    } finally {

      setHistoryLoading(false);

    }

  };



  const handleHistoryScroll = (e) => {

    const bottom =

      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;

    if (bottom && selectedEmployeeHistory?.records?.length > historyLimit) {

      setHistoryLimit((prev) => prev + 20);

    }

  };



  const loadMore = () => {

    setPage((prev) => prev + 1);

  };



  const formatTime = (timeString) => {

    if (!timeString) return "-";

    const date = new Date(timeString);

    return date.toLocaleTimeString("ru-RU", {

      hour: "2-digit",

      minute: "2-digit",

    });

  };



  const formatDate = (timeString) => {

    if (!timeString) return "-";

    const date = new Date(timeString);

    return date.toLocaleDateString("ru-RU", {

      day: "2-digit",

      month: "2-digit",

      year: "2-digit",

    });

  };



  const multipleCycleEmployees = allCyclesData

    .map((employeeData) => {

      if (!employeeData.cycles || !Array.isArray(employeeData.cycles)) {

        return { ...employeeData, cycles: [] };

      }



      const validCycles = employeeData.cycles.filter(

        (cycle) => cycle.checkInTime || cycle.checkOutTime,

      );



      // Группируем по дням

      const cyclesByDate = {};

      validCycles.forEach((cycle) => {

        const dateKey = new Date(

          cycle.checkInTime || cycle.checkOutTime,

        ).toDateString();

        if (!cyclesByDate[dateKey]) cyclesByDate[dateKey] = [];

        cyclesByDate[dateKey].push(cycle);

      });



      // Оставляем только те циклы, где в один день больше 1 записи

      const multipleCyclesOnly = [];

      Object.values(cyclesByDate).forEach((group) => {

        if (group.length > 1) {

          multipleCyclesOnly.push(...group);

        }

      });



      // Максимальное количество записей за один день

      const maxDayCycles = Math.max(

        ...Object.values(cyclesByDate).map((g) => g.length),

        0,

      );



      return {

        ...employeeData,

        maxDayCycles,

        cycles: multipleCyclesOnly.sort((a, b) => {

          const timeA = new Date(

            a.checkInTime || a.checkOutTime || 0,

          ).getTime();

          const timeB = new Date(

            b.checkInTime || b.checkOutTime || 0,

          ).getTime();

          return timeB - timeA; // Новые циклы сверху, старые снизу

        }),

      };

    })

    .filter((employeeData) => employeeData.cycles.length > 0)

    .sort((a, b) => {

      // Сортируем сотрудников по времени их самого свежего мульти-цикла

      const timeA = new Date(

        a.cycles[0]?.checkInTime ||

          a.cycles[0]?.checkOutTime ||

          a.employee.updatedAt ||

          0,

      ).getTime();

      const timeB = new Date(

        b.cycles[0]?.checkInTime ||

          b.cycles[0]?.checkOutTime ||

          b.employee.updatedAt ||

          0,

      ).getTime();

      return timeB - timeA; // Новые первые

    });



  if (authLoading || loading) {

    return <LoadingSpinner />;

  }



  // Don't render if not authenticated

  if (!user || user.role !== "manager") {

    return null;

  }



  return (

    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      <Header />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">

        {/* Dashboard Content */}

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          className="space-y-6"

        >

          {/* Stats Cards */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

            <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">

                    {t("manager.totalEmployees")}

                  </p>

                  <p className="text-2xl font-bold text-blue-600">

                    {attendanceStats?.total || 0}

                  </p>

                </div>

                <Users className="w-8 h-8 text-blue-600" />

              </div>

            </div>



            <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">

                    {filter === "today"

                      ? t("manager.presentEmployees")

                      : t("manager.totalAttendances")}

                  </p>

                  <p className="text-2xl font-bold text-green-600">

                    {filter === "today"

                      ? attendanceStats?.present || 0

                      : attendanceStats?.totalAttendances || 0}

                  </p>

                </div>

                <Users className="w-8 h-8 text-green-600" />

              </div>

            </div>



            {filter === "today" ? (

              <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">

                      {t("manager.absentEmployees")}

                    </p>

                    <p className="text-2xl font-bold text-red-600">

                      {attendanceStats?.absent || 0}

                    </p>

                  </div>

                  <UserX className="w-8 h-8 text-red-600" />

                </div>

              </div>

            ) : (

              <div className="bg-white dark:bg-gray-800 rounded-lg bg-white dark:bg-gray-800 rounded-lg  p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">

                      {t("manager.totalAbsences")}

                    </p>

                    <p className="text-2xl font-bold text-orange-600">

                      {attendanceStats?.totalAbsences || 0}

                    </p>

                  </div>

                  <UserX className="w-8 h-8 text-orange-600 opacity-80" />

                </div>

              </div>

            )}

          </div>



          {/* Important Block */}

          <div className="bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">

                {t("manager.absentList")} ({absentEmployees.length})

              </h3>



              <div className="flex items-center space-x-4">

                <div className="relative">

                  <select

                    value={filter}

                    onChange={(e) => handleFilterChange(e.target.value)}

                    className="py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"

                  >

                    <option

                      value="today"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.today")}

                    </option>

                    <option

                      value="week"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.week")}

                    </option>

                    <option

                      value="month"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.month")}

                    </option>

                    <option

                      value="threemonths"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.threeMonths")}

                    </option>

                  </select>

                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

                </div>

              </div>

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Absent Employees List */}

              <div>

                <div

                  className="max-h-[490px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"

                  onScroll={handleAbsentScroll}

                >

                  <table className="w-full text-sm text-left">

                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700">

                      <tr>

                        <th className="pl-3 pr-0 py-3 font-medium whitespace-nowrap">

                          №

                        </th>

                        <th className="p-3 font-medium">

                          {t("manager.fullName")}

                        </th>

                        <th className="p-3 font-medium">

                          {t("manager.absences")}

                        </th>

                        <th className="p-3 text-center font-medium">

                          {t("manager.callHeader")}

                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">

                      {absentEmployees.length === 0 ? (

                        <tr>

                          <td

                            colSpan="4"

                            className="text-gray-500 dark:text-gray-400 text-center py-6"

                          >

                            {t("manager.noAbsentEmployees")}

                          </td>

                        </tr>

                      ) : (

                        absentEmployees.map((employee, index) => (

                          <React.Fragment key={employee.id}>

                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">

                              <td className="p-3 w-10 text-gray-500 dark:text-gray-400">

                                {index + 1}

                              </td>

                              <td className="p-3">

                                <p className="font-medium text-gray-900 dark:text-white">

                                  {employee.lastName} {employee.firstName}

                                </p>

                              </td>

                              <td className="p-3">

                                <button

                                  onClick={() => toggleAbsentRow(employee.id)}

                                  className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md transition-colors focus:outline-none"

                                >

                                  <span>

                                    {employee.absentDates?.length || 0}

                                  </span>

                                  <ChevronDown

                                    className={`w-4 h-4 transition-transform duration-200 ${expandedAbsentRows.has(employee.id) ? "rotate-180" : ""}`}

                                  />

                                </button>

                              </td>

                              <td className="p-3 text-center">

                                <button

                                  onClick={() => handleCall(employee.phone)}

                                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/45 rounded-lg transition-colors inline-block"

                                  title={`${t("common.call")}: ${employee.phone}`}

                                >

                                  <Phone className="w-4 h-4" />

                                </button>

                              </td>

                            </tr>

                            {/* Expanded Row for absent dates */}

                            <AnimatePresence>

                              {expandedAbsentRows.has(employee.id) &&

                                employee.absentDates?.length > 0 && (

                                  <motion.tr

                                    key={`absent-dates-${employee.id}`}

                                    initial={{ opacity: 0 }}

                                    animate={{ opacity: 1 }}

                                    exit={{ opacity: 0 }}

                                    className="bg-red-50/30 dark:bg-red-900/10"

                                  >

                                    <td colSpan="4" className="p-0 border-none">

                                      <motion.div

                                        initial={{ height: 0, opacity: 0 }}

                                        animate={{ height: "auto", opacity: 1 }}

                                        exit={{ height: 0, opacity: 0 }}

                                        transition={{

                                          duration: 0.3,

                                          ease: "easeInOut",

                                        }}

                                        className="overflow-hidden"

                                      >

                                        <div className="px-4 py-3 ml-[44px]">

                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-semibold">

                                            {t("manager.absentDates") ||

                                              "Пропущенные дни"}

                                            :

                                          </p>

                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                                            {employee.absentDates.map(

                                              (d, i) => (

                                                <div

                                                  key={i}

                                                  className="flex items-center space-x-2 text-sm text-red-700 dark:text-red-300 whitespace-nowrap"

                                                >

                                                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>

                                                  <span>{formatDate(d)}</span>

                                                </div>

                                              ),

                                            )}

                                          </div>

                                        </div>

                                      </motion.div>

                                    </td>

                                  </motion.tr>

                                )}

                            </AnimatePresence>

                          </React.Fragment>

                        ))

                      )}

                    </tbody>

                  </table>

                </div>

              </div>



              {/* {t('manager.statistics')} */}

              <div>

                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">

                  {t("manager.statistics")}

                </h4>

                <div className="space-y-4">

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-sm text-gray-600 dark:text-gray-300">

                        {t("manager.attendanceRate")}

                      </span>

                      <span className="text-lg font-bold text-primary-600">

                        {attendanceStats?.attendanceRate || 0}%

                      </span>

                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">

                      <div

                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"

                        style={{

                          width: `${attendanceStats?.attendanceRate || 0}%`,

                        }}

                      />

                    </div>

                  </div>



                  {/* Chart */}

                  <AttendanceChart

                    data={chartData}

                    filter={filter}

                    loading={loading}

                  />



                  {/* Device Check Mode Toggle */}

                  <div className={`p-4 rounded-lg mt-4 border-2 transition-colors ${

                    deviceCheckMode

                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'

                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'

                  }`}>

                    <div className="flex items-center justify-between mb-2">

                      <div className="flex items-center space-x-2">

                        {deviceCheckMode ? (

                          <ShieldAlert className="w-5 h-5 text-red-600" />

                        ) : (

                          <Shield className="w-5 h-5 text-green-600" />

                        )}

                        <span className={`text-sm font-medium ${

                          deviceCheckMode

                            ? 'text-red-700 dark:text-red-300'

                            : 'text-green-700 dark:text-green-300'

                        }`}>

                          {deviceCheckMode ? t('manager.deviceCheck.titleStrict') : t('manager.deviceCheck.titleCheck')}

                        </span>

                      </div>

                      <button

                        onClick={handleToggleDeviceCheck}

                        disabled={loadingDeviceMode}

                        className={`relative inline-flex h-6 w-10 lg:h-7 lg:w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${

                          deviceCheckMode

                            ? 'bg-red-600 focus:ring-red-500'

                            : 'bg-green-600 focus:ring-green-500'

                        } ${loadingDeviceMode ? 'opacity-50 cursor-not-allowed' : ''}`}

                      >

                        <span

                          className={`inline-block h-4 w-4 lg:h-5 lg:w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${

                            deviceCheckMode ? 'translate-x-6' : 'translate-x-1'

                          }`}

                        />

                      </button>

                    </div>

                    <p className={`text-xs ${

                      deviceCheckMode

                        ? 'text-red-600 dark:text-red-300'

                        : 'text-green-600 dark:text-green-300'

                    }`}>

                      {deviceCheckMode

                        ? t('manager.deviceCheck.descriptionStrict')

                        : t('manager.deviceCheck.descriptionCheck')}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </motion.div>



        {/* Multiple Cycles Table */}

        {multipleCycleEmployees.length > 0 && (

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg  p-4  shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 lg:p-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">

                {t("manager.multipleCycles")} (Записей:{" "}

                {multipleCycleEmployees.length})

              </h3>



              <div className="flex items-center space-x-4">

                <div className="relative">

                  <select

                    value={filter}

                    onChange={(e) => setFilter(e.target.value)}

                    className="py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"

                  >

                    <option

                      value="today"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.today")}

                    </option>

                    <option

                      value="week"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.week")}

                    </option>

                    <option

                      value="month"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.month")}

                    </option>

                    <option

                      value="threemonths"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.threeMonths")}

                    </option>

                  </select>

                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

                </div>

              </div>

            </div>



            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">

              <table className="w-full table-fixed min-w-[1000px]">

                <thead className="sticky top-0 z-10 shadow-sm bg-white dark:bg-gray-800">

                  <tr className="border-b border-gray-200 dark:border-gray-700">

                    <th className="text-left py-3 px-2 w-5 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.number")}

                    </th>

                    <th className="text-left py-3 px-2 w-32 lg:w-36 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.nameAndContacts")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.date")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.status")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.timeIn")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.timeOut")}

                    </th>

                    <th className="text-left py-3 px-2 w-11 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.period")}

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {multipleCycleEmployees

                    .slice(0, page * 20)

                    .map((employeeData, empIndex) => {

                      const validCycles = employeeData.cycles;

                      // Предупреждение только если максимум за 1 день > 5

                      const hasMoreThan4Cycles =

                        (employeeData.maxDayCycles || 0) > 5;



                      return (

                        <React.Fragment key={employeeData.employee.id}>

                          {validCycles.map((cycle, cycleIndex) => {

                            // Определяем, нужно ли показывать дату для этой строки

                            const currentDate = cycle.checkInTime

                              ? formatDate(cycle.checkInTime)

                              : cycle.checkOutTime

                                ? formatDate(cycle.checkOutTime)

                                : "";

                            const previousCycle = validCycles[cycleIndex - 1];

                            const previousDate = previousCycle

                              ? previousCycle.checkInTime

                                ? formatDate(previousCycle.checkInTime)

                                : previousCycle.checkOutTime

                                  ? formatDate(previousCycle.checkOutTime)

                                  : ""

                              : "";

                            const showDate = currentDate !== previousDate;



                            return (

                              <motion.tr

                                key={`${employeeData.employee.id}-${cycleIndex}`}

                                initial={{ opacity: 0, x: -20 }}

                                animate={{ opacity: 1, x: 0 }}

                                transition={{

                                  delay: empIndex * 0.1 + cycleIndex * 0.02,

                                }}

                                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"

                              >

                                <td className="py-4 pr-0 pl-2 w-5">

                                  <span className="text-sm font-medium text-gray-900 dark:text-white">

                                    {cycleIndex === 0

                                      ? multipleCycleEmployees.length - empIndex

                                      : ""}

                                  </span>

                                </td>

                                <td className="py-3 px-2 w-32 lg:w-36">

                                  {cycleIndex === 0 ? (

                                    <div>

                                      <p className="font-medium text-gray-900 dark:text-white">

                                        {employeeData.employee.lastName}{" "}

                                        {employeeData.employee.firstName}

                                      </p>

                                      <p className="text-sm text-gray-600 dark:text-gray-300">

                                        {(() => {

                                          const p =

                                            employeeData.employee.phone || "";

                                          if (

                                            p.length === 9 &&

                                            !p.startsWith("+")

                                          )

                                            return "+996" + p;

                                          if (

                                            p.startsWith("0") &&

                                            p.length === 10

                                          )

                                            return "+996" + p.substring(1);

                                          if (

                                            p.startsWith("996") &&

                                            p.length === 12

                                          )

                                            return "+" + p;

                                          return p;

                                        })()}

                                      </p>

                                      {hasMoreThan4Cycles && (

                                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">

                                          ⚠️ {t("manager.cycleLimit")}:{" "}

                                          {employeeData.maxDayCycles}/5

                                        </p>

                                      )}

                                    </div>

                                  ) : (

                                    <div className="h-12"></div>

                                  )}

                                </td>

                                <td className="py-3 px-2 w-16 overflow-hidden font-medium">

                                  <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">

                                    {showDate

                                      ? cycle.checkInTime

                                        ? formatDate(cycle.checkInTime)

                                        : cycle.checkOutTime

                                          ? formatDate(cycle.checkOutTime)

                                          : "-"

                                      : ""}

                                  </span>

                                </td>

                                <td className="py-3 px-2 w-16 overflow-hidden">

                                  {cycle.checkInTime && !cycle.checkOutTime ? (

                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/45 dark:text-blue-400 whitespace-nowrap">

                                      {t("manager.active")}

                                    </span>

                                  ) : cycle.checkOutTime ? (

                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400 whitespace-nowrap">

                                      {t("manager.completed")}

                                    </span>

                                  ) : (

                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400 whitespace-nowrap">

                                      {t("manager.absent")}

                                    </span>

                                  )}

                                </td>

                                <td className="py-3 px-2 w-16">

                                  <span className="text-sm text-gray-900 dark:text-white">

                                    {cycle.checkInTime

                                      ? formatTime(cycle.checkInTime)

                                      : "-"}

                                  </span>

                                </td>

                                <td className="py-3 px-2 w-16">

                                  <span className="text-sm text-gray-900 dark:text-white">

                                    {cycle.checkOutTime

                                      ? formatTime(cycle.checkOutTime)

                                      : "-"}

                                  </span>

                                </td>

                                <td className="py-3 px-2 w-16 overflow-hidden">

                                  {cycleIndex === 0 && (

                                    <button

                                      onClick={() =>

                                        handleViewEmployeeHistory(

                                          employeeData.employee.id,

                                        )

                                      }

                                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/45 dark:text-blue-400 dark:hover:bg-blue-900/60 transition-colors"

                                    >

                                      {t("manager.history")}

                                    </button>

                                  )}

                                </td>

                              </motion.tr>

                            );

                          })}

                        </React.Fragment>

                      );

                    })}

                </tbody>

              </table>

            </div>

          </div>

        )}



        {/* Important Block */}

        <div className="important-block mt-8 bg-green-50 dark:bg-green-900/45 rounded-lg border border-green-200 dark:border-green-800 shadow-[0_1px_6px_rgba(0,0,0,0.1)]">

          <div className="max-w-7xl mx-auto p-4 lg:p-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">

                {t("manager.allEmployees")}

              </h3>



              <div className="flex items-center space-x-4">

                <div className="relative">

                  <select

                    value={filter}

                    onChange={(e) => setFilter(e.target.value)}

                    className="py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"

                  >

                    <option

                      value="today"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.today")}

                    </option>

                    <option

                      value="week"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.week")}

                    </option>

                    <option

                      value="month"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.month")}

                    </option>

                    <option

                      value="threemonths"

                      className="text-xs md:text-sm lg:text-sm"

                    >

                      {t("filters.threeMonths")}

                    </option>

                  </select>

                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

                </div>

              </div>

            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">

              <table className="w-full table-fixed min-w-[1000px]">

                <thead className="sticky top-0 z-10 shadow-sm bg-green-50 rounded-md dark:bg-green-900/100">

                  <tr className="border-b border-gray-200 dark:border-gray-700">

                    <th className="text-left py-3 px-2 w-6 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.number")}

                    </th>

                    <th className="text-left py-3 px-2 w-32 lg:w-36 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.nameAndContacts")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.date")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.status")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.timeIn")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300">

                      {t("manager.timeOut")}

                    </th>

                    <th className="text-left py-3 px-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.period")}

                    </th>

                    <th className="text-left py-3 px-2 w-12 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">

                      {t("manager.actions")}

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {employees.length === 0 ? (

                    <tr>

                      <td colSpan="8" className="text-center py-8">

                        <p className="text-gray-500 dark:text-gray-400">

                          {t("manager.noEmployees")}

                        </p>

                      </td>

                    </tr>

                  ) : (

                    employees.slice(0, page * 20).map((record, index) => (

                      <motion.tr

                        key={`${record.employee.id}-${index}`}

                        initial={{ opacity: 0, x: -20 }}

                        animate={{ opacity: 1, x: 0 }}

                        transition={{ duration: 0.2 }}

                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"

                      >

                        <td className="py-4 pr-0 pl-2 w-6">

                          <span className="text-sm font-medium text-gray-900 dark:text-white">

                            {employees.length - index}

                          </span>

                        </td>

                        <td className="py-3 px-2 w-32 lg:w-36">

                          <div>

                            <p className="font-medium text-gray-900 dark:text-white">

                              {record.employee.lastName}{" "}

                              {record.employee.firstName}

                            </p>

                            <p className="text-sm text-gray-600 dark:text-gray-300">

                              {(() => {

                                const p = record.employee.phone || "";

                                if (p.length === 9 && !p.startsWith("+"))

                                  return "+996" + p;

                                if (p.startsWith("0") && p.length === 10)

                                  return "+996" + p.substring(1);

                                if (p.startsWith("996") && p.length === 12)

                                  return "+" + p;

                                return p;

                              })()}

                            </p>

                          </div>

                        </td>

                        <td className="py-3 px-2 w-16 overflow-hidden font-medium">

                          <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">

                            {record.checkInTime

                              ? formatDate(record.checkInTime)

                              : record.checkOutTime

                                ? formatDate(record.checkOutTime)

                                : formatDate(record.recordDate)}

                          </span>

                        </td>

                        <td className="py-3 px-2 w-16 overflow-hidden">

                          {record.status === "checked_in" ? (

                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/45 dark:text-blue-400 whitespace-nowrap">

                              {t("manager.active")}

                            </span>

                          ) : record.status === "completed" ? (

                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400 whitespace-nowrap">

                              {t("manager.completed")}

                            </span>

                          ) : (

                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400 whitespace-nowrap">

                              {t("manager.absent")}

                            </span>

                          )}

                        </td>

                        <td className="py-3 px-2 w-16">

                          <span className="text-sm text-gray-900 dark:text-white">

                            {record.checkInTime

                              ? formatTime(record.checkInTime)

                              : "-"}

                          </span>

                        </td>

                        <td className="py-3 px-2 w-16">

                          <span className="text-sm text-gray-900 dark:text-white">

                            {record.checkOutTime

                              ? formatTime(record.checkOutTime)

                              : "-"}

                          </span>

                        </td>

                        <td className="py-3 px-2 w-16 overflow-hidden">

                          <button

                            onClick={() =>

                              handleViewEmployeeHistory(record.employee.id)

                            }

                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/45 dark:text-blue-400 dark:hover:bg-blue-900/60 transition-colors"

                          >

                            {t("manager.history")}

                          </button>

                        </td>

                        <td className="py-3 w-16">

                          <div className="flex items-center justify-start space-x-2 ">

                            <button

                              onClick={() => handleCall(record.employee.phone)}

                              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/45 transition-colors"

                              title={t("common.call")}

                            >

                              <Phone className="w-4 h-4 text-blue-600" />

                            </button>

                            <button

                              onClick={() =>

                                handleDeleteEmployee(record.employee.id)

                              }

                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/45 transition-colors"

                              title={t("common.delete")}

                            >

                              <Trash2 className="w-4 h-4 text-red-600" />

                            </button>

                          </div>

                        </td>

                      </motion.tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>



            {hasMore && (

              <div className="mt-6 text-center">

                <button

                  onClick={loadMore}

                  className="px-6 py-2 bg-primary-100 text-primary-600 dark:bg-primary-900/45 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors"

                >

                  {t("common.showMore")}

                </button>

              </div>

            )}

          </div>

        </div>

      </div>



      {/* Модальное окно истории сотрудника */}

      {showEmployeeHistory && selectedEmployeeHistory && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">

              <div className="flex items-center justify-between">

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">

                  {t("manager.employeeHistory")}:{" "}

                  {selectedEmployeeHistory.employee?.firstName}{" "}

                  {selectedEmployeeHistory.employee?.lastName}

                </h3>

                <button

                  onClick={() => setShowEmployeeHistory(false)}

                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"

                >

                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />

                </button>

              </div>

            </div>



            <div

              className="p-6 overflow-y-auto max-h-[60vh]"

              onScroll={handleHistoryScroll}

            >

              {historyLoading ? (

                <div className="text-center py-8">

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>

                  <p className="mt-2 text-gray-600 dark:text-gray-400">

                    {t("common.loading")}

                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full table-fixed min-w-[500px]">

                    <thead>

                      <tr className="border-b border-gray-200 dark:border-gray-700">

                        <th className="text-left py-3 px-2 w-14 lg:w-20 text-sm font-medium text-gray-700 dark:text-gray-300">

                          {t("manager.date")}

                        </th>

                        <th className="text-left py-3 px-2 w-14 lg:w-20 text-sm font-medium text-gray-700 dark:text-gray-300">

                          {t("manager.status")}

                        </th>

                        <th className="text-left py-3 px-2 w-14 lg:w-20 text-sm font-medium text-gray-700 dark:text-gray-300">

                          {t("manager.timeIn")}

                        </th>

                        <th className="text-left py-3 px-2 w-6 text-sm font-medium text-gray-700 dark:text-gray-300">

                          {t("manager.timeOut")}

                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedEmployeeHistory.records

                        ?.slice(0, historyLimit)

                        .map((record, index) => {

                          // Определяем, нужно ли показывать дату для этой строки

                          const currentDate = record.checkInTime

                            ? formatDate(record.checkInTime)

                            : record.checkOutTime

                              ? formatDate(record.checkOutTime)

                              : formatDate(record.date);

                          const previousRecord =

                            selectedEmployeeHistory.records[index - 1];

                          const previousDate = previousRecord

                            ? previousRecord.checkInTime

                              ? formatDate(previousRecord.checkInTime)

                              : previousRecord.checkOutTime

                                ? formatDate(previousRecord.checkOutTime)

                                : formatDate(previousRecord.date)

                            : "";

                          const showDate = currentDate !== previousDate;



                          return (

                            <tr

                              key={index}

                              className="border-b border-gray-100 dark:border-gray-700"

                            >

                              <td className="py-3 px-2 w-20 lg:w-20 font-medium">

                                <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">

                                  {showDate ? currentDate : ""}

                                </span>

                              </td>

                              <td className="py-3 px-2 w-20 lg:w-28 overflow-hidden">

                                {record.checkInTime && !record.checkOutTime ? (

                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/45 dark:text-blue-400 whitespace-nowrap">

                                    {t("manager.active")}

                                  </span>

                                ) : record.checkOutTime ? (

                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-400 whitespace-nowrap">

                                    {t("manager.completed")}

                                  </span>

                                ) : (

                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-400 whitespace-nowrap">

                                    {t("manager.absent")}

                                  </span>

                                )}

                              </td>

                              <td className="py-3 px-2 w-14 lg:w-20">

                                <span className="text-sm text-gray-900 dark:text-white">

                                  {record.checkInTime

                                    ? formatTime(record.checkInTime)

                                    : "-"}

                                </span>

                              </td>

                              <td className="py-3 px-2 w-14 lg:w-20">

                                <span className="text-sm text-gray-900 dark:text-white">

                                  {record.checkOutTime

                                    ? formatTime(record.checkOutTime)

                                    : "-"}

                                </span>

                              </td>

                            </tr>

                          );

                        })}

                    </tbody>

                  </table>



                  {!selectedEmployeeHistory.records?.length && (

                    <div className="text-center py-8">

                      <p className="text-gray-500 dark:text-gray-400">

                        {t("common.noRecordsFound")}

                      </p>

                    </div>

                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

};



export default ManagerPanel;

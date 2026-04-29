import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../utils/errorTranslations';

// Use environment variable for baseURL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Set timeout for all requests
axios.defaults.timeout = 15000; // Increased to 15 seconds for slower connections
axios.defaults.timeoutErrorMessage = 'Request timeout. Please check your internet connection.';

// ─── Global retry interceptor (registered once at module level) ───────────────
// Retries up to 3 times with exponential backoff for network errors and 5xx.
// Auth errors (401/403/404) are NOT retried — they fail immediately.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 s, 2 s, 4 s

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;  // Avoid retrying on request-cancelled / non-idempotent side-effects
    if (!config) return Promise.reject(error);  // Do NOT retry auth errors — they must propagate immediately
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403 || status === 404;
    if (isAuthError) return Promise.reject(error);  // Only retry network errors or 5xx
    const isNetworkError = !error.response; // no response = connection refused / timeout
    const isServerError = status >= 500;
    if (!isNetworkError && !isServerError) return Promise.reject(error);  config._retryCount = (config._retryCount || 0) + 1;
    if (config._retryCount > MAX_RETRIES) return Promise.reject(error);  const delay = RETRY_DELAY_MS * Math.pow(2, config._retryCount - 1);
    await sleep(delay);  // Re-attach token in case it was added after the first attempt
    const token = localStorage.getItem('accessToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;  return axios(config);
  }
);

// ─── Global request interceptor (module level — no race condition) ────────────
// Always injects the current accessToken before every request.
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext();


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize loading state and user from local storage if possible
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();// Set token from localStorage immediately to avoid race conditions on first render
  const initializeAxiosHeader = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  };// Run initialization immediately
  const hasTokenOnMount = initializeAxiosHeader();useEffect(() => {
    if (hasTokenOnMount) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);const verifyToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }  try {    // Ensure header is set for this specific request too
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });    setUser(response.data.user);
    } catch (error) {
      // ONLY clear storage if it's an authentication error (401, 403, 404)
      // Don't clear on server errors (5xx) or network issues (undefined status)
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } finally {    setLoading(false);
    }
  };const login = async (credentials, type) => {
    try {
      const response = await axios.post(`/api/auth/${type}`, credentials);
      const { accessToken, refreshToken, user: userData } = response.data;    localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userRole', userData.role);    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);    return { success: true, user: userData };
    } catch (error) {
      // Не показываем toast здесь - пусть компонент сам обрабатывает ошибки
      const message = getErrorMessage(error, t);
      return { success: false, error: message, originalError: error };
    }
  };const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    // Don't show toast here - let the component handle it
  };const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        logout();
        return false;
      }    const response = await axios.post('/api/auth/refresh', { refreshToken: refresh });
      const { accessToken } = response.data;    localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;    return true;
    } catch (error) {
      logout();
      return false;
    }
  };
return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

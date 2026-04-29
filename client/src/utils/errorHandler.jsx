import toast from 'react-hot-toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// Error messages in multiple languages
const errorMessages = {
  ru: {
    [ERROR_TYPES.NETWORK]: 'Ошибка сети. Проверьте подключение к интернету.',
    [ERROR_TYPES.VALIDATION]: 'Ошибка валидации. Проверьте введенные данные.',
    [ERROR_TYPES.AUTHENTICATION]: 'Ошибка аутентификации. Неверный логин или пароль.',
    [ERROR_TYPES.AUTHORIZATION]: 'Ошибка авторизации. У вас нет доступа к этому ресурсу.',
    [ERROR_TYPES.NOT_FOUND]: 'Ресурс не найден.',
    [ERROR_TYPES.SERVER]: 'Внутренняя ошибка сервера. Попробуйте позже.',
    [ERROR_TYPES.UNKNOWN]: 'Произошла неизвестная ошибка.'
  },
  kg: {
    [ERROR_TYPES.NETWORK]: 'Тармак катасы. Интернет туташууну текшериңиз.',
    [ERROR_TYPES.VALIDATION]: 'Валидация катасы. Кирилген маалыматтарды текшериңиз.',
    [ERROR_TYPES.AUTHENTICATION]: 'Аутентификация катасы. Туура эмес логин же пароль.',
    [ERROR_TYPES.AUTHORIZATION]: 'Авторизация катасы. Сизде бул ресурска кирүү укугу жок.',
    [ERROR_TYPES.NOT_FOUND]: 'Ресурс табылган жок.',
    [ERROR_TYPES.SERVER]: 'Сервердин ички катасы. Кийинки аракет кылыңыз.',
    [ERROR_TYPES.UNKNOWN]: 'Белгисиз ката кетти.'
  },
  en: {
    [ERROR_TYPES.NETWORK]: 'Network error. Check your internet connection.',
    [ERROR_TYPES.VALIDATION]: 'Validation error. Check the entered data.',
    [ERROR_TYPES.AUTHENTICATION]: 'Authentication error. Invalid login or password.',
    [ERROR_TYPES.AUTHORIZATION]: 'Authorization error. You do not have access to this resource.',
    [ERROR_TYPES.NOT_FOUND]: 'Resource not found.',
    [ERROR_TYPES.SERVER]: 'Internal server error. Please try again later.',
    [ERROR_TYPES.UNKNOWN]: 'An unknown error occurred.'
  }
};

// Get current language
const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'kg';
};

// Determine error type from error object
export const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;// Network errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return ERROR_TYPES.NETWORK;
  }// HTTP status codes
  if (error.response) {
    const status = error.response.status;  if (status === 400) return ERROR_TYPES.VALIDATION;
    if (status === 401) return ERROR_TYPES.AUTHENTICATION;
    if (status === 403) return ERROR_TYPES.AUTHORIZATION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status >= 500) return ERROR_TYPES.SERVER;
  }// Validation errors from backend
  if (error.response?.data?.errors) {
    return ERROR_TYPES.VALIDATION;
  }return ERROR_TYPES.UNKNOWN;
};

// Get error message
export const getErrorMessage = (error, customMessage = null) => {
  if (customMessage) return customMessage;const errorType = getErrorType(error);
  const language = getCurrentLanguage();// Check for backend messages
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error === 'Internal server error') {
    return errorMessages[language][ERROR_TYPES.SERVER];
  }// Check for field-specific validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0];
    }
    return firstError;
  }return errorMessages[language][errorType] || errorMessages[language][ERROR_TYPES.UNKNOWN];
};

// Handle API errors
export const handleApiError = (error, customMessage = null) => {
  const message = getErrorMessage(error, customMessage);// Show toast notification
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#ffffff',
    },
  });return {
    type: getErrorType(error),
    message,
    originalError: error
  };
};

// Handle form validation errors
export const handleFormError = (errors, t) => {
  const firstError = Object.values(errors)[0];if (firstError) {
    const message = typeof firstError === 'string'
      ? firstError
      : firstError.message || t('validation.general');  toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });  return message;
  }return null;
};

// Error boundary fallback
export const ErrorFallback = ({ error, resetError }) => {
  const language = getCurrentLanguage();
  const messages = {
    ru: 'Что-то пошло не так. Попробуйте обновить страницу.',
    kg: 'Бир нерсе кате кетти. Баракты жаңыртыңыз.',
    en: 'Something went wrong. Please try refreshing the page.'
  };return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/45 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {messages[language]}
        </p>
        <button
          onClick={resetError}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {language === 'ru' ? 'Обновить' : language === 'kg' ? 'Жаңыртуу' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

// Log error for debugging
export const logError = (error, context = {}) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    type: getErrorType(error),
    message: error.message,
    context,
    stack: error.stack,
    userAgent: navigator.userAgent,
    url: window.location.href
  };// In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement logging service integration
  }
};

export default {
  ERROR_TYPES,
  getErrorType,
  getErrorMessage,
  handleApiError,
  handleFormError,
  ErrorFallback,
  logError
};

export const getErrorMessage = (error, t) => {
  if (typeof error === 'string') {
    // Check for specific error messages
    if (error === 'Invalid credentials') {
      return t('auth.invalidCredentials');
    }
    // Check for deactivated account errors
    if (error === 'The account is not activated') {
      return t('superAdmin.accountDeactivated');
    }
    if (error === 'Manager The account is not activated') {
      return t('superAdmin.managerAccountDeactivated');
    }
    // Check if it's a translation key
    if (error.includes('Exists') || error.includes('Reserved')) {
      const translation = t(error);
      return translation;
    }
    return error;
  }if (error?.response?.data?.error) {
    const serverError = error.response.data.error;
    // Check for specific error messages
    if (serverError === 'Invalid credentials') {
      return t('auth.invalidCredentials');
    }
    // Check for deactivated account errors
    if (serverError === 'The account is not activated') {
      return t('superAdmin.accountDeactivated');
    }
    if (serverError === 'Manager The account is not activated') {
      return t('superAdmin.managerAccountDeactivated');
    }
    // Check if it's a translation key
    if (serverError.includes('Exists') || serverError.includes('Reserved')) {
      const translation = t(serverError);
      return translation;
    }
    if (serverError === 'Internal server error') {
      return t('common.internalServerError');
    }
    return serverError;
  }if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const translatedErrors = errors.map(err => {
      const errorCode = err.msg || err.message;
      // Check if it's a server validation error
      if (errorCode && errorCode.match(/^[A-Z_]+$/)) {
        const translation = t(`serverErrors.${errorCode}`);
        // Return translation if found, otherwise return original error
        return translation !== `serverErrors.${errorCode}` ? translation : errorCode;
      }
      return errorCode;
    });
    return translatedErrors.join(', ');
  }return error?.message || 'Unknown error';
};

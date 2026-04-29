import React from 'react';
import { useTranslation } from 'react-i18next';

export const FormField = ({ label, type = 'text', name, register, error, placeholder, required = false, validation, className = "", maxLength, ...props }) => {
  const { t } = useTranslation();return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        {...register(name, validation)}
        placeholder={placeholder || t(`form.${name}.placeholder`)}
        maxLength={maxLength}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {typeof error === 'string' ? error : t(`form.${name}.${error}`)}
        </p>
      )}
    </div>
  );
};

export const PhoneField = ({ register, error, validation, ...props }) => {
  const { t } = useTranslation();return (
    <FormField
      label={t('form.phone.label')}
      type="tel"
      name="phone"
      register={register}
      error={error}
      placeholder="+996 (XXX) XXX-XXX"
      {...(validation && { validation })}
      {...props}
    />
  );
};

export const PasswordField = ({ register, error, ...props }) => {
  const { t } = useTranslation();return (
    <FormField
      label={t('form.password.label')}
      type="password"
      name="password"
      register={register}
      error={error}
      placeholder="••••••••"
      maxLength={20}
      validation={{
        maxLength: {
          value: 20,
          message: t('validation.passwordMaxLength') || 'Пароль не должен превышать 20 символов'
        }
      }}
      {...props}
    />
  );
};

export const LoginField = ({ register, error, ...props }) => {
  const { t } = useTranslation();return (
    <FormField
      label={t('form.login.label')}
      type="text"
      name="login"
      register={register}
      error={error}
      placeholder={t('form.login.placeholder')}
      maxLength={40}
      validation={{
        maxLength: {
          value: 40,
          message: t('validation.loginMaxLength') || 'Логин не должен превышать 40 символов'
        }
      }}
      {...props}
    />
  );
};

export const NameField = ({ name, register, error, ...props }) => {
  const { t } = useTranslation();return (
    <FormField
      label={t(`form.${name}.label`)}
      type="text"
      name={name}
      register={register}
      error={error}
      placeholder={t(`form.${name}.placeholder`)}
      {...props}
    />
  );
};

export default { FormField, PhoneField, PasswordField, LoginField, NameField };

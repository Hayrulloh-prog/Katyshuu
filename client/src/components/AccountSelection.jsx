import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const AccountSelection = ({ existingAccounts, targetManager, onSelectAccount, onRegisterNew, isLoading }) => {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState(null);const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    onSelectAccount(account);
  };const handleRegisterNew = () => {
    onRegisterNew();
  };return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('accountSelection.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t('accountSelection.description')}
        </p>
      </div>    <div className="space-y-3 mb-6">
        {existingAccounts.map((account, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectAccount(account)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedAccount?.employeeId === account.employeeId
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {account.firstName} {account.lastName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t('accountSelection.manager')} {account.manager.firstName} {account.manager.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {account.manager.email || account.manager.login}
                </div>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>    <div className="border-t pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRegisterNew}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {t('auth.registering')}
            </div>
          ) : (
            t('accountSelection.createNew', {
              managerFirstName: targetManager?.firstName,
              managerLastName: targetManager?.lastName
            })
          )}
        </motion.button>
      </div>    <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('accountSelection.multipleAccountsNote')}
        </p>
      </div>
    </motion.div>
  );
};

export default AccountSelection;

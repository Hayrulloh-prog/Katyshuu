import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TestQRPage = () => {
  const [currentView, setCurrentView] = useState('loading');
  const [logs, setLogs] = useState([]);const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };useEffect(() => {
    addLog('Component mounted');

    // Симуляция QR сканирования
    setTimeout(() => {
      addLog('Simulating QR scan response...');
      setCurrentView('provider-selection');
      addLog('Set currentView to provider-selection');
    }, 1000);}, []);useEffect(() => {
    addLog(`currentView changed to: ${currentView}`);
  }, [currentView]);const renderContent = () => {
    addLog(`renderContent called with currentView: ${currentView}`);

    switch (currentView) {
      case 'loading':
        return (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        );    case 'provider-selection':
        return (
          <div className="text-center p-8 bg-green-100 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Provider Selection</h2>
            <p>This should show the AuthSelection component</p>
            <button
              onClick={() => addLog('Provider selection clicked')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Test Button
            </button>
          </div>
        );    default:
        return (
          <div className="text-center p-8 bg-red-100 rounded-lg">
            <p>Unknown view: {currentView}</p>
          </div>
        );
    }
  };return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">QR Page Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Rendered Content</h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-lg p-4"
            >
              {renderContent()}
            </motion.div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black text-green-400 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestQRPage;

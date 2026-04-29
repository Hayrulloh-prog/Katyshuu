import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AttendanceTracking from './pages/AttendanceTracking';
import QRScanPage from './pages/QRScanPage';
import SuccessPage from './pages/SuccessPage';
import CheckInSuccessPage from './pages/CheckInSuccessPage';
import CheckOutSuccessPage from './pages/CheckOutSuccessPage';
import AttendanceActionPage from './pages/AttendanceActionPage';
import SuperAdminPanel from './pages/SuperAdminPanel';
import ManagerPanel from './pages/ManagerPanel';
import ManagerRegistration from './pages/ManagerRegistration';
import OAuthCallback from './pages/OAuthCallback';
import TariffExpired from './pages/TariffExpired';
import QRInvalid from './pages/QRInvalid';
import SecurityViolationPage from './pages/SecurityViolationPage';
import i18n from './i18n';

// Import CSS
import './index.css';

function App() {
  useEffect(() => {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }  // Set initial language
    const savedLanguage = localStorage.getItem('language') || 'kg';
    i18n.changeLanguage(savedLanguage);
  }, []);return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <SuperAdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/manager" element={
                  <ProtectedRoute requiredRole="MANAGER">
                    <ManagerPanel />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/attendance/:token" element={<AttendanceTracking />} />
                <Route path="/qr/:token" element={<QRScanPage />} />
                <Route path="/qr" element={<QRScanPage />} />
                <Route path="/manager-registration/:token" element={<ManagerRegistration />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/attendance-action" element={<AttendanceActionPage />} />
                <Route path="/checkin-success" element={<CheckInSuccessPage />} />
                <Route path="/checkout-success" element={<CheckOutSuccessPage />} />
                <Route path="/system-inactive" element={<TariffExpired />} />
                <Route path="/qr-invalid" element={<QRInvalid />} />
                <Route path="/security-violation" element={<SecurityViolationPage />} />
              </Routes>          </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;

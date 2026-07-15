import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import PublicPortfolioPageV2 from './components/PublicPortfolioPageV2';
import EndorsementPage from './components/EndorsementPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import PartnerLoginPage from './components/PartnerLoginPage';
import PartnerDashboardPage from './components/PartnerDashboardPage';

// Protected Route Guard (regular users)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Login Route Guard - redirects logged-in users to dashboard
const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Partner Route Guard - protects partner dashboard
const PartnerRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('partnerToken');
  if (!token) {
    return <Navigate to="/partner/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Google OAuth Callback Handler
 * The backend redirects to: /auth/callback?token=JWT_TOKEN&email=EMAIL&name=FULL_NAME
 * This component reads those query params, stores them, then navigates to the dashboard.
 */
const GoogleAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');

    if (token) {
      localStorage.setItem('token', token);
      if (email) localStorage.setItem('userEmail', email);
      if (name) localStorage.setItem('userName', name);
      navigate('/dashboard', { replace: true });
    } else {
      // No token received — return to login with error
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 text-sm">جاري تسجيل الدخول عبر Google...</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication routes */}
        <Route
          path="/"
          element={
            <LoginRoute>
              <LoginPage />
            </LoginRoute>
          }
        />
        <Route
          path="/login"
          element={
            <LoginRoute>
              <LoginPage />
            </LoginRoute>
          }
        />
        <Route
          path="/register"
          element={
            <LoginRoute>
              <RegisterPage />
            </LoginRoute>
          }
        />

        {/* Google OAuth callback — processes token from backend redirect */}
        <Route path="/auth/callback" element={<GoogleAuthCallback />} />

        {/* Password reset route */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Privacy Policy route */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* Protected Dashboard workstation */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Partner Portal routes */}
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route
          path="/partner/dashboard"
          element={
            <PartnerRoute>
              <PartnerDashboardPage />
            </PartnerRoute>
          }
        />

        {/* Public view-only routes */}
        <Route path="/p/:slug" element={<PublicPortfolioPageV2 />} />
        <Route path="/p/:slug/:template" element={<PublicPortfolioPageV2 />} />
        <Route path="/endorse/:token" element={<EndorsementPage />} />

        {/* Default fallback redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

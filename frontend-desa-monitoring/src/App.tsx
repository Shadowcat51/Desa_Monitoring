import { Component, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ViewerPage from './pages/ViewerPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PodesPage from './pages/admin/PodesPage';
import UserControlPage from './pages/admin/UserControlPage';
import AccountSettingsPage from './pages/admin/AccountSettingsPage';
import { useAuthStore } from './store/authStore';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fee2e2', minHeight: '100vh', color: '#991b1b' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong.</h1>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/viewer" replace />;
    }
  }

  return <>{children}</>;
};

const AuthRedirect = () => {
  const token = useAuthStore((state) => state.token);
  
  if (token) {
    return <Navigate to="/viewer" replace />;
  }
  
  return <LoginPage />;
};

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Monitoring Desa'; // Default

    if (path === '/') title = 'Login - Monitoring Desa';
    else if (path === '/forgot-password') title = 'Lupa Password - Monitoring Desa';
    else if (path === '/reset-password') title = 'Reset Password - Monitoring Desa';
    else if (path === '/verify-email') title = 'Verifikasi Email - Monitoring Desa';
    else if (path === '/viewer') title = 'Peta Desa - Monitoring Desa';
    else if (path.startsWith('/admin/podes')) title = 'Data Podes - Monitoring Desa';
    else if (path.startsWith('/admin/users')) title = 'Manajemen Pengguna - Monitoring Desa';
    else if (path.startsWith('/admin/settings') || path.startsWith('/viewer/settings')) title = 'Pengaturan Akun - Monitoring Desa';

    document.title = title;
  }, [location]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <PageTitleUpdater />
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route 
            path="/viewer" 
            element={
              <ProtectedRoute>
                <ViewerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/podes" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <PodesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <UserControlPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'admin_prov', 'admin_kab']}>
                <AccountSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/viewer/settings" 
            element={
              <ProtectedRoute allowedRoles={['pegawai']}>
                <AccountSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/podes" replace />} 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

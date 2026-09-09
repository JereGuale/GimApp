import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Lazy-loaded pages (Code Splitting for fast initial bundle)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Orders = lazy(() => import('./pages/Orders'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const Products = lazy(() => import('./pages/Products'));
const Banners = lazy(() => import('./pages/Banners'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const SubscriptionPlans = lazy(() => import('./pages/SubscriptionPlans'));
const Banks = lazy(() => import('./pages/Banks'));

function PageFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      gap: '12px',
      color: 'var(--text-secondary, #94a3b8)',
      fontSize: '14px',
      fontWeight: 500,
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '3px solid rgba(59, 130, 246, 0.2)',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span>Cargando módulo…</span>
    </div>
  );
}

function PrivateLayout() {
  const { token } = useAuth();
  return token ? <Layout /> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Suspense fallback={<PageFallback />}>
                    <Login />
                  </Suspense>
                </PublicRoute>
              }
            />

            {/* Protected Admin Routes with Persistent Layout */}
            <Route element={<PrivateLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="/suscripciones"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Subscriptions />
                  </Suspense>
                }
              />
              <Route
                path="/pedidos"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Orders />
                  </Suspense>
                }
              />
              <Route
                path="/planes"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SubscriptionPlans />
                  </Suspense>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Users />
                  </Suspense>
                }
              />
              <Route
                path="/categorias"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Categories />
                  </Suspense>
                }
              />
              <Route
                path="/productos"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Products />
                  </Suspense>
                }
              />
              <Route
                path="/banners"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Banners />
                  </Suspense>
                }
              />
              <Route
                path="/reportes"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Reports />
                  </Suspense>
                }
              />
              <Route
                path="/bancos"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Banks />
                  </Suspense>
                }
              />
              <Route
                path="/ajustes"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Settings />
                  </Suspense>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}



import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Banners from './pages/Banners';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SubscriptionPlans from './pages/SubscriptionPlans';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
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
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/suscripciones"
              element={
                <PrivateRoute>
                  <Subscriptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <PrivateRoute>
                  <Orders />
                </PrivateRoute>
              }
            />
            <Route
              path="/planes"
              element={
                <PrivateRoute>
                  <SubscriptionPlans />
                </PrivateRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <PrivateRoute>
                  <Users />
                </PrivateRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <PrivateRoute>
                  <Categories />
                </PrivateRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <PrivateRoute>
                  <Products />
                </PrivateRoute>
              }
            />
            <Route
              path="/banners"
              element={
                <PrivateRoute>
                  <Banners />
                </PrivateRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/ajustes"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}



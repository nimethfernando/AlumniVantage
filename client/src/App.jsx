import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ViewAlumni from './pages/ViewAlumni';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    if (
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/forgot-password') ||
      requestUrl.includes('/api/auth/reset-password')
    ) {
      return Promise.reject(error);
    }

    // Force logout on 401 Unauthorized
    if (error.response && error.response.status === 401) {
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Standard Protected Route (Must be logged in)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Loading...</p>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Strict Role-Based Route (Must be logged in AND have a specific role)
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Loading...</p>;
  }

  // Check if logged in and if their role is in the allowed array
  if (user && allowedRoles.includes(user.role)) {
    return children;
  }

  // If logged in but wrong role, send to profile. If not logged in, send to login.
  return user ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Standard Protected Routes (All logged-in users) */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* View Alumni Route */}
          <Route
            path="/alumni"
            element={
              <PrivateRoute>
                <ViewAlumni />
              </PrivateRoute>
            }
          />
          
          {/* Restricted Routes (Strictly Admin Only) */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Dashboard />
              </RoleRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
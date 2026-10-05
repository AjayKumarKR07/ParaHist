import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Histogram from './pages/Histogram';
import Performance from './pages/Performance';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import AccountLayout from './pages/account/AccountLayout';
import Profile from './pages/account/Profile';
import Settings from './pages/account/Settings';
import Security from './pages/account/Security';
import Notifications from './pages/account/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TourProvider } from './context/TourContext';
import { ThemeProvider } from './context/ThemeContext';
import TourOverlay from './components/TourOverlay';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TourProvider>
            <Navbar />
            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/"            element={<Home />} />
                <Route path="/login"       element={<Login />} />
                <Route path="/register"    element={<Register />} />

                {/* Protected Core Laboratory Routes */}
                <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/histogram"   element={<ProtectedRoute><Histogram /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/how-it-works" element={<ProtectedRoute><HowItWorks /></ProtectedRoute>} />
                <Route path="/about"       element={<ProtectedRoute><About /></ProtectedRoute>} />

                {/* Protected Account Center Routes */}
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/account/profile" replace />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="security" element={<Security />} />
                  <Route path="notifications" element={<Notifications />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <TourOverlay />
          </TourProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

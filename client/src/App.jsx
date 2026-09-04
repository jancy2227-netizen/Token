import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import DemoBar from './components/DemoBar';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import WardenDashboard from './pages/WardenDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'warden') return <Navigate to="/warden/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-slate-800 antialiased selection:bg-accent selection:text-primary-dark">
      {/* Sticky Top Evaluation Switcher Bar */}
      <DemoBar />

      {/* Main Navigation Header */}
      <Navbar />

      {/* Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Warden Routes */}
          <Route
            path="/warden/dashboard"
            element={
              <ProtectedRoute allowedRoles={['warden', 'admin']}>
                <WardenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Smart Hostel Mess Management & Food Waste Reduction System
          </p>
          <p>
            B.Tech AI & Data Science Capstone Project • Production-Ready Full Stack Architecture
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Built with React, Vite, Tailwind CSS, Express.js, MongoDB, Scikit-Learn Demand Prediction & Anti-Duplicate Digital QR Tokens.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

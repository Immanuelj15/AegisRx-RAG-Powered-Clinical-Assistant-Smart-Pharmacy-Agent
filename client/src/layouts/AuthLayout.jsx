import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export const AuthLayout = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // If already logged in, redirect to respective dashboard
  if (user) {
    const dashboardPath = 
      user.role === 'Admin' ? '/dashboard/admin' : 
      user.role === 'Pharmacist' ? '/dashboard/pharmacist' : 
      '/dashboard/patient';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative transition-colors duration-200">
      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/40 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-primary-500/10">
            M
          </div>
          <span className="font-extrabold text-2xl bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            AI MedAssist
          </span>
        </Link>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Smart Hospital & Pharmacy AI Agent
        </p>
      </div>

      {/* Renders Login / Register children inside the center portal */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Outlet />
      </div>
    </div>
  );
};

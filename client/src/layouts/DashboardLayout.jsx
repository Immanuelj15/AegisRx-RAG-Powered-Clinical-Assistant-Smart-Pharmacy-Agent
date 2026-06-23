import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader size="large" />
          <p className="mt-4 font-semibold text-slate-600 dark:text-slate-400">Loading AI MedAssist Profile...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Map route paths to friendly Navbar titles
  const getPageTitle = (pathname) => {
    if (pathname.includes('/search')) return 'Medicine Inventory & Alternatives';
    if (pathname.includes('/chat')) return 'AI MedAssist Consultation Chat';
    if (pathname.includes('/prescription')) return 'AI Prescription Understander';
    if (pathname.includes('/inventory')) return 'Medicine Catalog Management';
    if (pathname.includes('/admin')) return 'Administration & Analytics Panel';
    if (pathname.includes('/profile')) return 'Update Clinical Profile';
    return 'MedAssist Portal';
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Collapsible Left Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Sticky Top Header */}
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          title={getPageTitle(location.pathname)} 
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

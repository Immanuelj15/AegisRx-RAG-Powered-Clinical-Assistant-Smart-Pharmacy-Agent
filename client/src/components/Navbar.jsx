import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiLogOut, FiUser, FiMenu } from 'react-icons/fi';

export const Navbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 glass-panel border-b border-slate-200/50 dark:border-slate-800/30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* User Info & Badge */}
        {user && (
          <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider w-fit self-end px-1.5 py-0.5 rounded-md ${
                user.role === 'Admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                user.role === 'Pharmacist' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {user.role}
              </span>
            </div>
            
            {/* Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

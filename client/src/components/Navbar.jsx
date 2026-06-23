import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiLogOut, FiMenu, FiBell } from 'react-icons/fi';

export const Navbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const roleColors = {
    Admin:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Pharmacist: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    Patient:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/30">
      <div className="flex items-center justify-between w-full h-16 px-5 md:px-7">
        
        {/* Left — toggle + page title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <FiMenu size={21} />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Notification Bell */}
          <button className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <FiBell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {/* Separator */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Name + role badge */}
              <div className="hidden md:flex flex-col items-end gap-0.5">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {user.name}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${roleColors[user.role] || roleColors.Patient}`}>
                  {user.role}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-400 flex items-center justify-center font-black text-base text-white shadow-md shadow-primary-500/25">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all"
                title="Logout"
              >
                <FiLogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

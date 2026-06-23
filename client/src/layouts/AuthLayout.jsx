import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export const AuthLayout = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  if (user) {
    const path = user.role === 'Admin' ? '/dashboard/admin' : user.role === 'Pharmacist' ? '/dashboard/pharmacist' : '/dashboard/patient';
    return <Navigate to={path} replace />;
  }

  return (
    <div className="min-h-screen flex bg-mesh dark:bg-mesh relative overflow-hidden">
      {/* Left panel — brand visual */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 p-12 relative overflow-hidden">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='white'/%3E%3C/svg%3E\")", backgroundRepeat: 'repeat'}} />
        
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl">A</div>
          <span className="font-black text-2xl text-white tracking-tight">AegisRx</span>
        </Link>

        <div className="space-y-6 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Clinical AI<br />for the Modern<br />Hospital
            </h2>
            <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-sm">
              RAG-powered search, FDA safety checks, AI triage, dosage calculators, and smart prescription analysis — all in one platform.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              'Real-time FDA drug recall alerts',
              'Hybrid vector search (dense + BM25)',
              'AI triage & dosage calculator',
              'Signed digital prescriptions'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-50 text-base font-semibold">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-sm font-medium relative z-10">© 2026 AegisRx Systems · All rights reserved</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center px-8 py-5">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-black">A</div>
            <span className="font-black text-xl gradient-text">AegisRx</span>
          </Link>
          <div className="lg:ml-auto">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

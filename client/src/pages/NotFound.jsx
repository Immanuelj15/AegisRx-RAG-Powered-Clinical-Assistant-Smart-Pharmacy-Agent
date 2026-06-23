import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md w-full p-8 glass-card">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">404 Error</h1>
        <p className="text-lg font-bold text-slate-600 dark:text-slate-350 mb-4">Page Not Found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          The medical workspace or panel you are trying to reach does not exist, or you do not have permission to view it.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors duration-150 shadow-md shadow-primary-500/10 w-full justify-center"
        >
          <FiArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

import React from 'react';

export const Loader = ({ size = 'medium', color = 'primary' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    secondary: 'border-secondary-500 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export const TypingLoader = () => {
  return (
    <div className="flex items-center space-x-1.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit max-w-[80px] justify-center">
      <div className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

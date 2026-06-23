import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const Login = () => {
  const { login, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      
      // Redirect based on role
      if (user.role === 'Admin') navigate('/dashboard/admin');
      else if (user.role === 'Pharmacist') navigate('/dashboard/pharmacist');
      else navigate('/dashboard/patient');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-8 px-4 border border-slate-200/40 dark:border-slate-800/40 shadow-xl rounded-card sm:px-10">
      <h2 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Sign in to MedAssist
      </h2>

      {(localError || authError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center space-x-2">
          <FiAlertCircle size={16} className="flex-shrink-0" />
          <span>{localError || authError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <FiMail size={16} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hospital.com"
              className="pl-10 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-secondary-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <FiLock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 shadow-primary-500/10"
        >
          {loading ? <Loader size="small" color="white" /> : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          New to the hospital?{' '}
          <Link
            to="/register"
            className="font-bold text-primary-500 hover:text-primary-600 dark:hover:text-secondary-400"
          >
            Create an Account
          </Link>
        </p>
        
        {/* Fast Login hints for development */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-[11px] text-left text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-600 dark:text-slate-350">Quick-Access Demo logins:</p>
          <div className="grid grid-cols-3 gap-1 text-center font-semibold text-primary-500 dark:text-secondary-400">
            <button onClick={() => { setEmail('patient@medassist.com'); setPassword('patient123'); }} className="hover:underline">Patient</button>
            <button onClick={() => { setEmail('pharmacist@medassist.com'); setPassword('pharmacist123'); }} className="hover:underline">Pharmacist</button>
            <button onClick={() => { setEmail('admin@medassist.com'); setPassword('admin123'); }} className="hover:underline">Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Loader } from '../components/Loader';
import { motion } from 'framer-motion';

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
    if (!email || !password) { setLocalError('Please fill in all fields'); return; }
    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'Admin') navigate('/dashboard/admin');
      else if (user.role === 'Pharmacist') navigate('/dashboard/pharmacist');
      else navigate('/dashboard/patient');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role) => {
    if (role === 'Patient')     { setEmail('patient@medassist.com');     setPassword('patient123'); }
    if (role === 'Pharmacist')  { setEmail('pharmacist@medassist.com');  setPassword('pharmacist123'); }
    if (role === 'Admin')       { setEmail('admin@medassist.com');        setPassword('admin123'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
        <p className="text-base text-slate-500 dark:text-slate-400 font-medium mt-2">
          Sign in to your AegisRx clinical portal
        </p>
      </div>

      {/* Error */}
      {(localError || authError) && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm flex items-center gap-2.5 font-semibold">
          <FiAlertCircle size={16} className="flex-shrink-0" />
          {localError || authError}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <FiMail size={17} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hospital.com"
              className="input-premium pl-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <FiLock size={17} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-premium pl-11"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-base mt-2"
        >
          {loading ? <Loader size="small" color="white" /> : (
            <><span>Sign In</span><FiArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-center text-base text-slate-500 dark:text-slate-400 font-medium">
          New to AegisRx?{' '}
          <Link to="/register" className="font-bold text-primary-500 hover:text-primary-600 transition-colors">
            Create Account
          </Link>
        </p>

        {/* Demo quick-fill */}
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">⚡ Demo Quick Access</p>
          <div className="grid grid-cols-3 gap-2">
            {['Patient', 'Pharmacist', 'Admin'].map(role => (
              <button
                key={role}
                onClick={() => quickFill(role)}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-200 transition-all"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { FiMail, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      if (res.data && res.data.success) {
        setMessage(res.data.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || 'Failed to submit recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-8 px-4 border border-slate-200/40 dark:border-slate-800/40 shadow-xl rounded-card sm:px-10 text-xs">
      <h2 className="text-center text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
        Recover Password
      </h2>
      <p className="text-slate-400 text-center mb-6 leading-relaxed">
        Enter your clinical email address and we will mail you password recovery reset details.
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
          isError ? 'bg-red-50 text-red-655 border-red-200 dark:bg-red-950/20 dark:text-red-400' : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400'
        }`}>
          {isError ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Clinical Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <FiMail size={14} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hospital.com"
              className="pl-9 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || message}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-primary-500/10"
        >
          {loading ? <Loader size="small" color="white" /> : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
        <Link
          to="/login"
          className="font-bold text-primary-500 hover:text-primary-600 dark:hover:text-secondary-400"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

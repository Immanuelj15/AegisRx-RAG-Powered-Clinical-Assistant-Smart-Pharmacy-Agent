import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiAlertCircle, FiArrowRight, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const AdminLogin = () => {
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded secure admin password
    if (password === 'aegis-admin-2026') {
      sessionStorage.setItem('admin_unlocked', 'true');
      setUser({
        id: 'admin_root',
        name: 'Super Admin',
        email: 'root@aegisrx.local',
        role: 'Admin'
      });
      navigate('/dashboard/admin');
    } else {
      setError('Invalid admin credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background styling for high-security feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <FiShield size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Restricted Access</h1>
          <p className="text-slate-400 text-sm mt-2">AegisRx Root Administration</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl text-sm flex items-center gap-3 font-semibold">
            <FiAlertCircle size={18} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Master Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <FiLock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
          >
            Authenticate <FiArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

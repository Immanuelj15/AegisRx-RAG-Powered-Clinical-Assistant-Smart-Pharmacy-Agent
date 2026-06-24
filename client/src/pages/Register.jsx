import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { Loader } from '../components/Loader';
import { GoogleLogin } from '@react-oauth/google';

export const Register = () => {
  const { register, loginWithGoogle, error: authError, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Patient');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!name || !email || !password) {
      setLocalError('Name, email, and password are required');
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        name,
        email,
        password,
        role,
        phone,
        age,
        gender
      });

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
        Create Your Account
      </h2>

      {(localError || authError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center space-x-2">
          <FiAlertCircle size={16} className="flex-shrink-0" />
          <span>{localError || authError}</span>
        </div>
      )}

      {/* Google Login */}
      <div className="mb-5 flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              setLoading(true);
              const user = await loginWithGoogle(credentialResponse.credential);
              if (user.role === 'Admin') navigate('/dashboard/admin');
              else if (user.role === 'Pharmacist') navigate('/dashboard/pharmacist');
              else navigate('/dashboard/patient');
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }}
          onError={() => setLocalError('Google Sign Up failed')}
          useOneTap
          theme="filled_blue"
          shape="rectangular"
          size="large"
          text="signup_with"
        />
      </div>

      <div className="flex items-center my-5">
        <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
        <span className="px-4 text-xs font-semibold text-slate-400">or register with email</span>
        <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <FiUser size={16} />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Alexander Flemming"
              className="pl-10 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
            />
          </div>
        </div>

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
              placeholder="alex@hospital.com"
              className="pl-10 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
            >
              <option value="Patient">Patient</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Admin">Hospital Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
            >
              <option value="">Choose...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <FiPhone size={14} />
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-555-5555"
                className="pl-9 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Age
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <FiCalendar size={14} />
              </span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                className="pl-9 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Choose Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <FiLock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="pl-10 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 shadow-primary-500/10 mt-2"
        >
          {loading ? <Loader size="small" color="white" /> : 'Register Account'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-primary-500 hover:text-primary-600 dark:hover:text-secondary-400"
          >
            Sign In Instead
          </Link>
        </p>
      </div>
    </div>
  );
};

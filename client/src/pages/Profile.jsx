import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiPhone, FiCalendar, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [medicalHistory, setMedicalHistory] = useState(user?.medicalHistory || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setLoading(true);

    try {
      await updateProfile({
        name,
        phone,
        age,
        gender,
        medicalHistory
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setIsError(true);
      setMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto glass-card p-6">
      <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        Clinical Profile Settings
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Update your personal details and history parameters to help the AegisRx RAG pipeline tailor its medical advisory suggestions.
      </p>

      {message && (
        <div className={`mb-5 p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
          isError 
            ? 'bg-red-50 text-red-650 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/35' 
            : 'bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/35'
        }`}>
          {isError ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">
            Display Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <FiUser size={14} />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">
              Age
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiCalendar size={14} />
              </span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Years"
                className="pl-9 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <FiPhone size={14} />
            </span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-555-5555"
              className="pl-9 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">
            Clinical History / Allergies
          </label>
          <div className="relative">
            <span className="absolute top-3 left-3 text-slate-400">
              <FiFileText size={14} />
            </span>
            <textarea
              rows={4}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="List diabetic status, hypertenstion histories, or allergy parameters (e.g. Penicillin allergy)..."
              className="pl-9 block w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100 leading-normal"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 shadow-primary-500/10"
        >
          {loading ? <Loader size="small" color="white" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

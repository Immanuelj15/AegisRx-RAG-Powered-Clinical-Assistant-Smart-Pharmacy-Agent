import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiSearch, 
  FiMessageSquare, 
  FiUploadCloud, 
  FiHeart, 
  FiClock, 
  FiBookOpen 
} from 'react-icons/fi';

export const PatientDashboard = () => {
  const { user } = useAuth();

  const healthTips = [
    {
      title: 'Antibiotic Completeness',
      text: 'Always complete the full course of prescribed antibiotics, even if you feel better, to prevent bacterial resistance.',
      color: 'border-teal-500'
    },
    {
      title: 'Stomach Protection',
      text: 'Take NSAID medicines like Ibuprofen or Naproxen with or after food to protect your gastric lining from irritation.',
      color: 'border-blue-500'
    },
    {
      title: 'Blood Pressure Monitoring',
      text: 'Monitor your blood pressure daily if you are taking Amlodipine or Losartan. Report dry cough symptoms immediately.',
      color: 'border-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-card text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold md:text-3xl">Hello, {user?.name}!</h2>
          <p className="text-xs font-semibold text-blue-100 mt-1.5 max-w-md">
            Welcome to your patient portal. Search for your medicines, chat with our clinical AI agent, or analyze your prescription documents.
          </p>
        </div>
        <Link
          to="/chat"
          className="mt-4 md:mt-0 px-5 py-2.5 bg-white text-primary-600 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors shadow-sm inline-flex items-center space-x-2"
        >
          <FiMessageSquare size={16} />
          <span>Consult AI Assistant</span>
        </Link>
      </div>

      {/* Grid Shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Search Shortcut */}
        <div className="glass-card p-6 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-primary-500 dark:text-primary-400 flex items-center justify-center">
              <FiSearch size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">LOOKUP</span>
          </div>
          <div className="mt-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Check Medicine Stock</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check availability and locate generic equivalents.</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-primary-500 hover:underline mt-4 flex items-center space-x-1">
            <span>Search Inventory</span>
            <span>→</span>
          </Link>
        </div>

        {/* Prescription Parser Shortcut */}
        <div className="glass-card p-6 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FiUploadCloud size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">SCHEDULER</span>
          </div>
          <div className="mt-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Analyze Prescription</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload a prescription image to extract your timeline schedule.</p>
          </div>
          <Link to="/prescription" className="text-xs font-bold text-primary-500 hover:underline mt-4 flex items-center space-x-1">
            <span>Upload Image</span>
            <span>→</span>
          </Link>
        </div>

        {/* Profile Card Summary */}
        <div className="glass-card p-6 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 flex items-center justify-center">
              <FiHeart size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">PROFILE</span>
          </div>
          <div className="mt-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Medical Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Age: {user?.age || 'Not set'} | Medical History: {user?.medicalHistory ? user.medicalHistory.substring(0, 15) + '...' : 'None'}
            </p>
          </div>
          <Link to="/profile" className="text-xs font-bold text-primary-500 hover:underline mt-4 flex items-center space-x-1">
            <span>Edit Profile</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Health Tips Slider / Layout */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <FiBookOpen className="text-primary-500" size={18} />
          <span>Interactive Health Tips</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {healthTips.map((tip, idx) => (
            <div key={idx} className={`p-5 bg-white dark:bg-slate-900 border-l-4 ${tip.color} rounded-r-card shadow-sm space-y-2`}>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-150">{tip.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

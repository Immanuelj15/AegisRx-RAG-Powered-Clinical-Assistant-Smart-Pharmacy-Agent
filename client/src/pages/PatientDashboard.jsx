import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
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
  const [trials, setTrials] = useState([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialQuery, setTrialQuery] = useState('');
  const [trialError, setTrialError] = useState('');

  // Auto-fill query based on clinical profile history
  useEffect(() => {
    if (user && user.medicalHistory) {
      const parts = user.medicalHistory.split(',');
      const firstCondition = parts[0]?.trim();
      if (firstCondition) {
        setTrialQuery(firstCondition);
      } else {
        setTrialQuery('Diabetes');
      }
    } else {
      setTrialQuery('Diabetes');
    }
  }, [user]);

  const fetchTrials = async (searchCond) => {
    if (!searchCond) return;
    try {
      setTrialLoading(true);
      setTrialError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/ai/trials/${encodeURIComponent(searchCond)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setTrials(res.data.trials);
      }
    } catch (err) {
      console.error(err);
      setTrialError('Unable to match clinical trials.');
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    if (trialQuery) {
      fetchTrials(trialQuery);
    }
  }, [trialQuery]);

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

      {/* Clinical Trial Matcher Widget */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-805/50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <span className="p-1 bg-primary-100 dark:bg-primary-950/30 text-primary-500 rounded-lg">🏥</span>
              <span>Smart Clinical Trial Matcher</span>
            </h3>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">
              Connect patient profiles with recruiting clinical studies on ClinicalTrials.gov.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="text"
              value={trialQuery}
              onChange={(e) => setTrialQuery(e.target.value)}
              placeholder="e.g., Asthma, Cancer"
              className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs w-full sm:w-44 focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={() => fetchTrials(trialQuery)}
              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-primary-500/10 whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>

        {trialLoading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500">
            Scanning ClinicalTrials.gov registry database...
          </div>
        ) : trialError ? (
          <div className="p-4 bg-red-50 text-red-650 rounded-xl text-xs font-bold text-center">
            {trialError}
          </div>
        ) : trials.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-450">
            No active recruiting trials found for "{trialQuery}". Try typing another condition.
          </div>
        ) : (
          <div className="space-y-4">
            {trials.map((trial) => (
              <div key={trial.nctId} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-450 rounded text-[10px] font-extrabold uppercase">
                      {trial.status}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400 rounded text-[10px] font-bold">
                      {trial.nctId}
                    </span>
                    <span className="text-[10px] text-slate-450">
                      Sponsor: {trial.sponsor}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-150 text-sm">
                    {trial.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {trial.summary}
                  </p>
                  {trial.eligibility && (
                    <div className="text-[10px] text-slate-450 font-medium">
                      <span className="font-bold text-slate-500">Criteria shorthand:</span> {trial.eligibility.substring(0, 150)}...
                    </div>
                  )}
                </div>

                <a
                  href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-350 shadow-sm flex items-center space-x-1.5 self-end sm:self-center"
                >
                  <span>View Study</span>
                  <span>↗</span>
                </a>
              </div>
            ))}
          </div>
        )}
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

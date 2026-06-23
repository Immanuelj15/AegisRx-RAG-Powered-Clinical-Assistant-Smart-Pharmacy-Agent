import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiActivity, FiSearch, FiX, FiCheckCircle, FiAlertTriangle, FiAlertOctagon 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const InteractionMatrix = () => {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch catalog for typeahead
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get(`${API_URL}/medicine?limit=100`, config);
        if (res.data && res.data.success) {
          setCatalog(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load medicines:', err);
      }
    };
    fetchCatalog();
  }, []);

  const handleAddDrug = (medName) => {
    if (selectedDrugs.length >= 5) {
      setError('Maximum 5 drugs allowed for matrix analysis.');
      return;
    }
    if (!selectedDrugs.includes(medName)) {
      setSelectedDrugs([...selectedDrugs, medName]);
      setSearch('');
      setError('');
      setInteractions([]); // Reset matrix when inputs change
    }
  };

  const handleRemoveDrug = (medName) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== medName));
    setInteractions([]);
    setError('');
  };

  const filteredCatalog = search 
    ? catalog.filter(m => m.Medicine_Name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleAnalyze = async () => {
    if (selectedDrugs.length < 2) {
      setError('Please select at least 2 medications to check interactions.');
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/ai/check-interactions`, { drugs: selectedDrugs }, config);
      if (res.data.success) {
        setInteractions(res.data.interactions);
      } else {
        setError('Failed to analyze interactions.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reach AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'severe': return 'bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-950/30 dark:text-red-400';
      case 'moderate': return 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400';
      case 'safe': return 'bg-teal-500/10 text-teal-600 border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-400';
      default: return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'severe': return <FiAlertOctagon size={16} className="text-red-500" />;
      case 'moderate': return <FiAlertTriangle size={16} className="text-orange-500" />;
      case 'safe': return <FiCheckCircle size={16} className="text-teal-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500 rounded-2xl flex items-center justify-center">
            <FiActivity size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Drug Interaction Matrix</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Select up to 5 medications. AegisRx AI will cross-reference FDA guidelines to map interactions.
            </p>
          </div>
        </div>
        <button 
          onClick={handleAnalyze} 
          disabled={selectedDrugs.length < 2 || isLoading}
          className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
        >
          {isLoading ? <span className="animate-pulse">Analyzing...</span> : <span>Analyze Matrix</span>}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Drug Selection Panel */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            Add Medications ({selectedDrugs.length}/5)
          </h3>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search catalog..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
            {search && filteredCatalog.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {filteredCatalog.map(med => (
                  <li 
                    key={med.Medicine_ID} 
                    onClick={() => handleAddDrug(med.Medicine_Name)}
                    className="px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-medium"
                  >
                    {med.Medicine_Name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <AnimatePresence>
              {selectedDrugs.map(drug => (
                <motion.div 
                  key={drug} 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-between items-center px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl"
                >
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{drug}</span>
                  <button onClick={() => handleRemoveDrug(drug)} className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
                    <FiX size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Matrix Rendering Panel */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500 animate-pulse">Running cross-encoder against FDA RAG...</p>
            </div>
          ) : interactions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Interaction Results
              </h3>
              <div className="grid gap-3">
                {interactions.map((ix, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-2xl border ${getSeverityStyle(ix.severity)} flex gap-4`}
                  >
                    <div className="mt-1">{getSeverityIcon(ix.severity)}</div>
                    <div>
                      <h4 className="font-bold text-sm">
                        {ix.drug1} <span className="text-slate-400 mx-1">↔</span> {ix.drug2}
                      </h4>
                      <div className="text-[10px] font-black uppercase tracking-wider mb-1.5 opacity-70">
                        {ix.severity} Interaction
                      </div>
                      <p className="text-sm font-medium leading-relaxed opacity-90">{ix.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FiActivity size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">Add medications and click Analyze to view the interaction matrix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

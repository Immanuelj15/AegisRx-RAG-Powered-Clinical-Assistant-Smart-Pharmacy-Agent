import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiActivity, 
  FiHexagon, 
  FiSearch, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiShield,
  FiUserPlus
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const Pharmacogenomics = () => {
  const [targetDrug, setTargetDrug] = useState('');
  const [phenotypes, setPhenotypes] = useState({
    CYP2D6: 'Normal',
    CYP2C19: 'Normal',
    CYP3A4: 'Normal'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const handleEnzymeChange = (enzyme, value) => {
    setPhenotypes(prev => ({ ...prev, [enzyme]: value }));
  };

  const runGenomicAnalysis = async (e) => {
    e.preventDefault();
    if (!targetDrug) {
      setError('Please enter a target medication to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await axios.post(`${API_URL}/ai/genomic-analysis`, {
        targetDrug,
        phenotypes
      }, config);

      if (res.data.success) {
        setReport(res.data.report);
      } else {
        setError('Failed to analyze genomics.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reach AI Genetic Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (!action) return 'bg-slate-100 text-slate-800 border-slate-200';
    if (action.includes('AVOID')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
    if (action.includes('ADJUST DOSE')) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50';
    if (action.includes('USE ALTERNATIVE')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
  };

  const metabolizerOptions = ['Poor', 'Intermediate', 'Normal', 'Ultra-Rapid'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-indigo-500">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500 rounded-2xl flex items-center justify-center">
            <FiHexagon size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Pharmacogenomics Dashboard</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
              Cross-reference a patient's Cytochrome P450 (CYP) enzyme phenotypes against target medications to predict drug efficacy and toxicity at the DNA level.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Input Panel */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={runGenomicAnalysis} className="glass-card p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <FiSearch className="text-indigo-500" />
                Target Medication
              </label>
              <input 
                type="text"
                value={targetDrug}
                onChange={(e) => setTargetDrug(e.target.value)}
                placeholder="e.g. Clopidogrel, Codeine, Omeprazole"
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">Patient Phenotype Matrix</h3>
              
              {['CYP2D6', 'CYP2C19', 'CYP3A4'].map(enzyme => (
                <div key={enzyme} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm tracking-wide">{enzyme}</span>
                  <select
                    value={phenotypes[enzyme]}
                    onChange={(e) => handleEnzymeChange(enzyme, e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-400 px-3 py-1.5 focus:ring-0 cursor-pointer text-right"
                  >
                    {metabolizerOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} Metabolizer</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <FiHexagon className="animate-spin" size={18} />
                  <span>Sequencing DNA Data...</span>
                </>
              ) : (
                <>
                  <FiActivity size={18} />
                  <span>Run Genomic Analysis</span>
                </>
              )}
            </button>
            {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
          </form>
        </div>

        {/* Right Results Panel */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="glass-card h-full min-h-[400px] flex flex-col items-center justify-center p-12 space-y-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <FiHexagon size={64} className="text-indigo-500/30 animate-pulse-slow absolute" />
                <FiHexagon size={48} className="text-indigo-500/60 animate-spin absolute" style={{ animationDirection: 'reverse' }} />
                <FiActivity size={24} className="text-indigo-500 animate-pulse relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-black tracking-widest uppercase text-indigo-500 text-sm">Processing Genomic Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cross-referencing drug metabolism pathways against patient phenotype...</p>
              </div>
            </div>
          ) : report ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden border border-slate-200/50 dark:border-slate-800/80"
            >
              <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Clinical Genomic Report</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 tracking-wide">
                    Target: <span className="text-indigo-600 dark:text-indigo-400">{report.drug}</span>
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${getActionColor(report.clinicalAction)}`}>
                  {report.clinicalAction}
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Pathway Info */}
                <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Enzyme</span>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">{report.primaryMetabolizingEnzyme}</p>
                  </div>
                  <div className="w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Patient Status</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{report.metabolizerStatus} Metabolizer</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Efficacy */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 font-black text-sm text-emerald-600 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
                      <FiCheckCircle />
                      Efficacy Prediction
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {report.efficacyPrediction}
                    </p>
                  </div>

                  {/* Toxicity */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 font-black text-sm text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 pb-2">
                      <FiAlertTriangle />
                      Toxicity Risk
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {report.toxicityRisk}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <h4 className="flex items-center gap-2 font-black text-sm text-indigo-700 dark:text-indigo-400 mb-2">
                    <FiShield />
                    Clinical Recommendation
                  </h4>
                  <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-medium">
                    {report.recommendation}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
              <FiUserPlus size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="font-bold text-slate-500 dark:text-slate-400">No Patient Profile Loaded</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Enter a target medication and adjust the patient's enzyme phenotypes on the left to run an advanced DNA interaction simulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

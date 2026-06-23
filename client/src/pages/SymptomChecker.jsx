import React, { useState } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiPlus, FiX,
  FiActivity, FiShield, FiHeart
} from 'react-icons/fi';

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Sore Throat', 'Shortness of Breath',
  'Chest Pain', 'Nausea', 'Vomiting', 'Diarrhoea', 'Fatigue',
  'Dizziness', 'Abdominal Pain', 'Back Pain', 'Rash', 'Joint Pain',
  'Loss of Appetite', 'Blurred Vision', 'Swollen Ankles', 'Palpitations', 'Night Sweats'
];

const URGENCY_STYLES = {
  ER: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    light: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-400',
    icon: <FiAlertTriangle size={28} className="text-white" />,
    label: '🚨 EMERGENCY — Go to ER Now',
  },
  GP: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    light: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <FiAlertCircle size={28} className="text-white" />,
    label: '👨‍⚕️ See a GP / Doctor Today',
  },
  'Self-Care': {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    light: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <FiCheckCircle size={28} className="text-white" />,
    label: '🏠 Self-Care at Home',
  }
};

export const SymptomChecker = () => {
  const { user } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const addSymptom = (sym) => {
    if (!selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(prev => [...prev, sym]);
      setTriageResult(null);
    }
  };

  const removeSymptom = (sym) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== sym));
    setTriageResult(null);
  };

  const addCustom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      addSymptom(trimmed);
      setCustomSymptom('');
    }
  };

  const runTriage = async () => {
    if (selectedSymptoms.length === 0) return;
    try {
      setLoading(true);
      setError('');
      setTriageResult(null);
      const res = await axios.post(`${API_URL}/ai/symptom-check`, {
        symptoms: selectedSymptoms,
        age: user?.age || null,
        gender: user?.gender || null
      }, config);
      if (res.data?.success) {
        setTriageResult(res.data.triage);
      }
    } catch (err) {
      setError('AI triage service is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const urgencyStyle = triageResult ? URGENCY_STYLES[triageResult.urgencyLevel] || URGENCY_STYLES.GP : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-card text-white shadow-md">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FiActivity size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">AI Symptom Triage</h2>
            <p className="text-xs text-violet-200 mt-1 max-w-lg">
              Select your symptoms and our clinical AI will assess urgency, suggest likely conditions, and recommend next steps. This is a screening tool — not a medical diagnosis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left — Symptom Picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Common Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  onClick={() => addSymptom(sym)}
                  disabled={selectedSymptoms.includes(sym)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                    selectedSymptoms.includes(sym)
                      ? 'bg-primary-500 text-white border-primary-500 opacity-60 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Custom Symptom */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={customSymptom}
                onChange={e => setCustomSymptom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Type another symptom..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button onClick={addCustom} className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
                <FiPlus size={14} />
              </button>
            </div>
          </div>

          {/* Patient context info */}
          {user && (
            <div className="glass-card p-4 text-xs space-y-1">
              <p className="font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Using Patient Profile</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-bold">Age:</span> {user.age || 'Not set'}</p>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-bold">Medical History:</span> {user.medicalHistory?.substring(0, 60) || 'None'}</p>
              <p className="text-[9px] text-slate-400 mt-1">Update in Profile settings for better triage accuracy.</p>
            </div>
          )}
        </div>

        {/* Right — Selected & Result */}
        <div className="lg:col-span-3 space-y-4">
          {/* Selected Symptoms */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                Selected Symptoms ({selectedSymptoms.length})
              </h3>
              {selectedSymptoms.length > 0 && (
                <button
                  onClick={() => { setSelectedSymptoms([]); setTriageResult(null); }}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedSymptoms.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No symptoms selected. Pick from the list on the left.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map(sym => (
                  <span key={sym} className="flex items-center space-x-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-bold border border-violet-200 dark:border-violet-900/50">
                    <span>{sym}</span>
                    <button onClick={() => removeSymptom(sym)} className="hover:text-red-500 transition-colors">
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={runTriage}
              disabled={selectedSymptoms.length === 0 || loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-violet-500/20 disabled:opacity-40 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>AI Analysing Symptoms...</span>
                </>
              ) : (
                <>
                  <FiActivity size={16} />
                  <span>Run AI Triage Assessment</span>
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold">
              {error}
            </div>
          )}

          {/* Triage Results */}
          <AnimatePresence>
            {triageResult && urgencyStyle && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Urgency Banner */}
                <div className={`p-5 rounded-2xl ${urgencyStyle.bg} text-white flex items-center space-x-4 shadow-lg`}>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {urgencyStyle.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg">{urgencyStyle.label}</p>
                    <p className="text-xs opacity-90 mt-1">{triageResult.urgencyReason}</p>
                  </div>
                </div>

                {/* Immediate Actions */}
                {triageResult.immediateActions?.length > 0 && (
                  <div className={`p-4 rounded-xl border ${urgencyStyle.border} ${urgencyStyle.light} space-y-2`}>
                    <p className={`font-extrabold text-[11px] uppercase tracking-wider ${urgencyStyle.text}`}>⚡ Immediate Actions</p>
                    <ul className="space-y-1">
                      {triageResult.immediateActions.map((action, i) => (
                        <li key={i} className={`text-xs font-semibold ${urgencyStyle.text} flex items-start space-x-2`}>
                          <span className="mt-0.5">→</span><span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Likely Conditions Grid */}
                {triageResult.likelyConditions?.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">🩺 Likely Conditions</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {triageResult.likelyConditions.map((cond, i) => (
                        <div key={i} className="p-3 glass-card space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{cond.name}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              cond.confidence === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                              cond.confidence === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {cond.confidence}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{cond.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red Flags */}
                {triageResult.redFlags?.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-xl space-y-2">
                    <p className="font-extrabold text-[11px] text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1">
                      <FiAlertTriangle size={12} /><span>Red Flag Symptoms — Seek Help If Present</span>
                    </p>
                    <ul className="space-y-1">
                      {triageResult.redFlags.map((flag, i) => (
                        <li key={i} className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-start space-x-2">
                          <span className="text-red-400 mt-0.5">⚠</span><span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* OTC Recommendations (Self-Care only) */}
                {triageResult.recommendedOTC?.length > 0 && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/30 rounded-xl space-y-2">
                    <p className="font-extrabold text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                      <FiShield size={12} /><span>OTC Medicines That May Help</span>
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {triageResult.recommendedOTC.map((otc, i) => (
                        <div key={i} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                          <p className="font-extrabold text-emerald-800 dark:text-emerald-300 text-[10px]">{otc.medicine}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400">For: {otc.forSymptom}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 italic mt-0.5">{otc.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-start space-x-3">
                  <span className="text-xl flex-shrink-0">⚕️</span>
                  <div>
                    <p className="font-extrabold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider">Medical Disclaimer</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      {triageResult.disclaimer || 'This AI triage is for screening only. Always consult a licensed physician for proper diagnosis and treatment.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

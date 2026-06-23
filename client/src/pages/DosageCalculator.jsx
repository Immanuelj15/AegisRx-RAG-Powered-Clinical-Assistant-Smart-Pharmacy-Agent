import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiShield, FiSearch } from 'react-icons/fi';

const RENAL_OPTIONS = [
  { label: 'Normal (eGFR > 60)', value: 'Normal (eGFR > 60 mL/min)' },
  { label: 'Mild (eGFR 45–59)', value: 'Mild impairment (eGFR 45–59 mL/min)' },
  { label: 'Moderate (eGFR 30–44)', value: 'Moderate impairment (eGFR 30–44 mL/min)' },
  { label: 'Severe (eGFR 15–29)', value: 'Severe impairment (eGFR 15–29 mL/min)' },
  { label: 'End Stage (eGFR < 15)', value: 'End-stage renal disease (eGFR < 15 mL/min)' },
];

const EXAMPLE_MEDICINES = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Amlodipine', 'Lisinopril', 'Atorvastatin', 'Omeprazole'];

export const DosageCalculator = () => {
  const [medicineName, setMedicineName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [renalFunction, setRenalFunction] = useState(RENAL_OPTIONS[0].value);
  const [indication, setIndication] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const calculate = async () => {
    if (!medicineName || !weightKg || !ageYears) {
      setError('Please fill in medicine name, weight, and age.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const res = await axios.post(`${API_URL}/ai/dosage-calc`, {
        medicineName,
        weightKg: parseFloat(weightKg),
        ageYears: parseInt(ageYears),
        renalFunction,
        indication
      }, config);
      if (res.data?.success) {
        setResult(res.data.dosing);
      }
    } catch (err) {
      setError('Dosage calculation service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    if (!cat) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    if (cat === 'Pediatric') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
    if (cat === 'Geriatric') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    return 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-orange-500 to-rose-500 rounded-card text-white shadow-md">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FiActivity size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Clinical Dosage Calculator</h2>
            <p className="text-xs text-orange-100 mt-1 max-w-xl">
              Enter patient parameters to get a clinically adjusted, weight- and age-appropriate dose range with renal function modifications. Always verify with a physician.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Patient Parameters</h3>

            {/* Medicine Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Medicine Name *</label>
              <input
                type="text"
                value={medicineName}
                onChange={e => { setMedicineName(e.target.value); setResult(null); }}
                placeholder="e.g., Paracetamol"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 dark:text-slate-300"
              />
              {/* Quick picks */}
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_MEDICINES.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMedicineName(m); setResult(null); }}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${
                      medicineName === m
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-orange-400 hover:text-orange-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Weight (kg) *</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={e => { setWeightKg(e.target.value); setResult(null); }}
                  placeholder="e.g., 70"
                  min="1"
                  max="300"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Age (years) *</label>
                <input
                  type="number"
                  value={ageYears}
                  onChange={e => { setAgeYears(e.target.value); setResult(null); }}
                  placeholder="e.g., 35"
                  min="0"
                  max="120"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            {/* Renal Function */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Renal Function</label>
              <select
                value={renalFunction}
                onChange={e => { setRenalFunction(e.target.value); setResult(null); }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 dark:text-slate-300"
              >
                {RENAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Indication */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Clinical Indication (optional)</label>
              <input
                type="text"
                value={indication}
                onChange={e => setIndication(e.target.value)}
                placeholder="e.g., Fever, Pneumonia, Hypertension..."
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 dark:text-slate-300"
              />
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-2.5 rounded-lg">{error}</p>
            )}

            <button
              onClick={calculate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Calculating Safe Dose...</span>
                </>
              ) : (
                <>
                  <FiSearch size={15} />
                  <span>Calculate Dose</span>
                </>
              )}
            </button>
          </div>

          {/* Disclaimer Card */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-start space-x-3">
            <span className="text-xl flex-shrink-0">⚕️</span>
            <div>
              <p className="font-extrabold text-amber-800 dark:text-amber-300 text-[10px] uppercase tracking-wider">Clinical Use Only</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                Results are AI-generated guidelines. Actual dosing must be confirmed by a licensed prescriber with complete patient assessment.
              </p>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence>
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[400px]"
              >
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center">
                  <FiActivity size={36} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-300">Enter Patient Parameters</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Fill in the medicine name, patient weight, age, and renal function, then click "Calculate Dose."
                  </p>
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px]"
              >
                <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 animate-pulse">AI computing patient-specific dose...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Main Dose Card */}
                <div className="p-6 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl text-white shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-extrabold opacity-80 uppercase tracking-wider">Calculated Dose</p>
                      <h3 className="text-3xl font-black mt-1">{result.recommendedDose || '—'}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getCategoryColor(result.patientCategory)}`}>
                      {result.patientCategory || 'Adult'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/20">
                    {[
                      { label: 'Frequency', val: result.frequency },
                      { label: 'Route', val: result.route },
                      { label: 'Max Daily', val: result.maxDailyDose },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[9px] opacity-70 font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-extrabold mt-0.5">{item.val || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {result.dosePerKg && (
                    <div className="px-3 py-2 bg-white/15 rounded-xl text-xs font-bold">
                      Weight-based: {result.dosePerKg}
                    </div>
                  )}
                </div>

                {/* Adjustments */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Renal Adjustment</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{result.renalAdjustment || 'No adjustment required'}</p>
                  </div>
                  <div className="glass-card p-4 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hepatic Note</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{result.hepaticNote || 'No hepatic note'}</p>
                  </div>
                </div>

                <div className="glass-card p-4 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Treatment Duration</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{result.durationNote || '—'}</p>
                </div>

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-xl space-y-2">
                    <p className="font-extrabold text-[11px] text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1">
                      <FiAlertTriangle size={11} /><span>Warnings</span>
                    </p>
                    <ul className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-start space-x-2">
                          <span className="mt-0.5 flex-shrink-0">⚠</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monitoring */}
                {result.monitoringParameters?.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/15 border border-blue-200 dark:border-blue-900/30 rounded-xl space-y-2">
                    <p className="font-extrabold text-[11px] text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center space-x-1">
                      <FiShield size={11} /><span>Monitoring Parameters</span>
                    </p>
                    <ul className="space-y-1">
                      {result.monitoringParameters.map((m, i) => (
                        <li key={i} className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-start space-x-2">
                          <span className="mt-0.5 flex-shrink-0">→</span><span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contraindications */}
                {result.contraindications?.length > 0 && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/30 rounded-xl space-y-2">
                    <p className="font-extrabold text-[11px] text-rose-700 dark:text-rose-400 uppercase tracking-wider">Contraindications</p>
                    <ul className="space-y-1">
                      {result.contraindications.map((c, i) => (
                        <li key={i} className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-start space-x-2">
                          <span className="flex-shrink-0">✕</span><span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

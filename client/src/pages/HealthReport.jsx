import React, { useState } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import { FiDownload, FiFileText, FiPlusCircle, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

export const HealthReport = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Editable medications list
  const [medications, setMedications] = useState([
    { medicineName: '', strength: '', foodRelation: 'After food', durationDays: 7, frequency: { morning: true, afternoon: false, night: true } }
  ]);
  const [allergies, setAllergies] = useState(user?.medicalHistory || '');
  const [notes, setNotes] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' };

  const addMedRow = () => {
    setMedications(prev => [...prev, {
      medicineName: '', strength: '', foodRelation: 'After food', durationDays: 7,
      frequency: { morning: true, afternoon: false, night: false }
    }]);
  };

  const updateMed = (idx, field, value) => {
    setMedications(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const updateFreq = (idx, slot) => {
    setMedications(prev => prev.map((m, i) =>
      i === idx ? { ...m, frequency: { ...m.frequency, [slot]: !m.frequency[slot] } } : m
    ));
  };

  const removeMed = (idx) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const downloadReport = async () => {
    try {
      setGenerating(true);
      setGenerated(false);

      const payload = {
        patientData: {
          name: user?.name,
          age: user?.age,
          gender: user?.gender,
          role: user?.role,
          medicalHistory: user?.medicalHistory,
          email: user?.email
        },
        medications: medications.filter(m => m.medicineName.trim()),
        allergies,
        upcomingDoses: [],
        notes
      };

      const res = await axios.post(`${API_URL}/ai/health-report`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `AegisRx-HealthReport-${user?.name?.replace(' ', '-')}-${Date.now()}.pdf`;
      link.click();
      setGenerated(true);
    } catch (err) {
      console.error('Health report download failed:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-500 rounded-card text-white shadow-md">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FiFileText size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Patient Health Report</h2>
            <p className="text-xs text-teal-100 mt-1 max-w-lg">
              Generate a comprehensive AI-powered PDF summary of your current medications, allergies, and clinical profile — shareable with your physician.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Patient Info Preview */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Patient Profile</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Name', val: user?.name },
                { label: 'Age', val: user?.age ? `${user.age} years` : 'Not set' },
                { label: 'Gender', val: user?.gender || 'Not set' },
                { label: 'Role', val: user?.role },
                { label: 'Email', val: user?.email },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.val || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allergies / Medical History */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Allergies / Conditions</h3>
            <textarea
              rows={4}
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
              placeholder="e.g., Penicillin allergy, Type 2 Diabetes, Hypertension..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 dark:text-slate-300"
            />
          </div>

          {/* Notes */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Additional Notes</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional clinical notes for your physician..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Right — Medication Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Current Medications</h3>
              <button
                onClick={addMedRow}
                className="flex items-center space-x-1.5 text-xs font-bold text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-xl border border-primary-100 dark:border-primary-900/20 transition-colors"
              >
                <FiPlusCircle size={13} /><span>Add Medicine</span>
              </button>
            </div>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No medications added yet. Click "Add Medicine" above.</p>
            ) : (
              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Medicine Name</label>
                        <input
                          type="text"
                          value={med.medicineName}
                          onChange={e => updateMed(idx, 'medicineName', e.target.value)}
                          placeholder="e.g., Paracetamol"
                          className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Strength</label>
                        <input
                          type="text"
                          value={med.strength}
                          onChange={e => updateMed(idx, 'strength', e.target.value)}
                          placeholder="e.g., 500mg"
                          className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Food Relation</label>
                        <select
                          value={med.foodRelation}
                          onChange={e => updateMed(idx, 'foodRelation', e.target.value)}
                          className="mt-1 w-full px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                        >
                          <option>After food</option>
                          <option>Before food</option>
                          <option>With food</option>
                          <option>Empty stomach</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Duration (Days)</label>
                        <input
                          type="number"
                          value={med.durationDays}
                          onChange={e => updateMed(idx, 'durationDays', parseInt(e.target.value) || 1)}
                          min="1"
                          className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Schedule</label>
                        <div className="flex gap-1 mt-1">
                          {['morning', 'afternoon', 'night'].map(slot => (
                            <button
                              key={slot}
                              onClick={() => updateFreq(idx, slot)}
                              className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase transition-all ${
                                med.frequency[slot]
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {slot === 'morning' ? 'AM' : slot === 'afternoon' ? 'PM' : 'NT'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => removeMed(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Report Preview & Download */}
          <div className="glass-card p-5 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <p className="font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Report Will Include</p>
              {[
                '✅ Patient demographics and clinical profile',
                '✅ AI-generated clinical narrative summary',
                '✅ Full medication table with schedule',
                '✅ Documented allergies and medical conditions',
                '✅ AegisRx branded header with Report ID',
                '✅ Physician disclaimer footer'
              ].map((item, i) => (
                <p key={i} className="text-slate-600 dark:text-slate-400 font-medium">{item}</p>
              ))}
            </div>

            <button
              onClick={downloadReport}
              disabled={generating}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-extrabold rounded-xl transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>AI Generating Report...</span>
                </>
              ) : (
                <>
                  <FiDownload size={18} />
                  <span>Generate & Download PDF Report</span>
                </>
              )}
            </button>

            {generated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold"
              >
                <FiCheckCircle size={14} />
                <span>Report downloaded successfully! Share with your physician.</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiCoffee, 
  FiAlertOctagon, 
  FiCheckCircle, 
  FiHeart,
  FiCalendar,
  FiChevronDown,
  FiDownload
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const DietPlanner = () => {
  const [conditions, setConditions] = useState('');
  const [activeMeds, setActiveMeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dietPlan, setDietPlan] = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  const [expandedDay, setExpandedDay] = useState(0);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch current meds from schedules
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await axios.get(`${API_URL}/schedules`, config);
        if (res.data && res.data.success) {
          const uniqueMeds = [...new Set(res.data.schedules.map(s => s.medicineName))];
          setActiveMeds(uniqueMeds);
        }
      } catch (err) {
        console.error('Failed to load meds:', err);
      }
    };
    fetchMeds();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!conditions) {
      setError('Please enter at least one health condition.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setDietPlan(null);

    try {
      const conditionArr = conditions.split(',').map(c => c.trim());
      const res = await axios.post(`${API_URL}/ai/diet-plan`, {
        conditions: conditionArr,
        medications: activeMeds.length > 0 ? activeMeds : ['None']
      }, config);
      
      if (res.data.success) {
        setDietPlan(res.data.dietPlan);
      } else {
        setError('Failed to generate diet plan.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reach AI Diet Planner.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download diet plan as formatted PDF
  const handleDownloadPDF = async () => {
    if (!dietPlan) return;
    setIsDownloadingPDF(true);
    try {
      const conditionArr = conditions.split(',').map(c => c.trim());
      const response = await axios.post(
        `${API_URL}/ai/export-diet-plan-pdf`,
        { conditions: conditionArr, medications: activeMeds, dietPlan },
        { ...config, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `AegisRx-Diet-Plan-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      console.error('Diet plan PDF download failed:', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 rounded-2xl flex items-center justify-center">
            <FiCoffee size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">AI Diet & Lifestyle Planner</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Generate a personalized 7-day meal plan that actively avoids dangerous drug-food interactions based on your current prescriptions.
            </p>
          </div>
        </div>
        {/* Download PDF button shown after plan is generated */}
        {dietPlan && (
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isDownloadingPDF ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiDownload size={16} />
            )}
            <span>{isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6 h-fit">
          <form onSubmit={handleGeneratePlan} className="glass-card p-6 space-y-5">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <FiHeart className="text-rose-500" />
              <span>Health Profile</span>
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Diagnosed Conditions
              </label>
              <textarea 
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Acid Reflux"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[80px]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Separate multiple conditions with commas.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Medications (Auto-detected)
              </label>
              <div className="flex flex-wrap gap-2">
                {activeMeds.length > 0 ? (
                  activeMeds.map(med => (
                    <span key={med} className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      {med}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No active prescriptions found in calendar.</span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary text-sm px-6 py-3 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Profile...</span>
                </>
              ) : (
                <>
                  <FiCoffee size={16} />
                  <span>Generate Diet Plan</span>
                </>
              )}
            </button>

            {error && <p className="text-xs text-red-500 font-semibold text-center mt-2">{error}</p>}
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 min-h-[400px]">
          {isLoading ? (
            <div className="glass-card h-full flex flex-col items-center justify-center p-12 space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <FiCoffee className="absolute inset-0 m-auto text-emerald-500" size={20} />
              </div>
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300">Cross-referencing FDA Databases</h3>
              <p className="text-xs text-slate-400 text-center max-w-sm">
                Evaluating food compounds against your medications to prevent absorption issues or toxicity...
              </p>
            </div>
          ) : dietPlan ? (
            <div className="space-y-6">
              
              {/* Warnings & Recommendations */}
              <div className="grid sm:grid-cols-2 gap-4">
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="glass-card p-5 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
                  <h4 className="font-black text-sm text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                    <FiAlertOctagon />
                    <span>CRITICAL FOOD AVOIDANCES</span>
                  </h4>
                  <ul className="space-y-2">
                    {dietPlan.drugFoodWarnings.map((warning, i) => (
                      <li key={i} className="text-xs font-semibold text-red-900/80 dark:text-red-300 leading-relaxed flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                    <FiCheckCircle />
                    <span>RECOMMENDED FOODS</span>
                  </h4>
                  <ul className="space-y-2">
                    {dietPlan.recommendedFoods.map((food, i) => (
                      <li key={i} className="text-xs font-semibold text-emerald-900/80 dark:text-emerald-300 leading-relaxed flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* 7-Day Meal Plan */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FiCalendar className="text-emerald-500" />
                    <span>7-Day Clinical Meal Plan</span>
                  </h3>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dietPlan.weeklyPlan.map((dayPlan, idx) => (
                    <motion.div 
                      key={dayPlan.day}
                      initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: idx * 0.05}}
                      className="group"
                    >
                      <button 
                        onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{dayPlan.day}</span>
                        <FiChevronDown className={`text-slate-400 transition-transform ${expandedDay === idx ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {expandedDay === idx && (
                          <motion.div 
                            initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}}
                            className="overflow-hidden bg-slate-50/30 dark:bg-slate-900/30"
                          >
                            <div className="p-4 pt-0 grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Breakfast</span>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dayPlan.breakfast}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lunch</span>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dayPlan.lunch}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dinner</span>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dayPlan.dinner}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Snack</span>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dayPlan.snack}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <FiCoffee size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">Enter your conditions and click Generate to build your customized safe meal plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

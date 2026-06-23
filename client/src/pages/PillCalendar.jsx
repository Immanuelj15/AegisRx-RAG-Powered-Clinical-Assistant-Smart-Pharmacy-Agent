import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiBell, 
  FiCoffee, 
  FiRefreshCw 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '../components/Loader';
import { FiTarget, FiStar, FiAward } from 'react-icons/fi';

export const PillCalendar = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const [showReward, setShowReward] = useState(false);
  const [points, setPoints] = useState(0);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch Schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/schedules`, config);
      if (res.data && res.data.success) {
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('Unable to load prescription schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request Notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification('AegisRx Enabled', {
        body: 'You will receive desktop dose reminders from your clinical calendar.',
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏥</text></svg>'
      });
    }
  };

  // Log dose checkoff
  const handleToggleDose = async (scheduleId, dateStr, timeSlot, currentVal) => {
    try {
      const res = await axios.post(`${API_URL}/schedules/take-dose`, {
        scheduleId,
        date: dateStr,
        timeSlot,
        isTaken: !currentVal
      }, config);

      if (res.data && res.data.success) {
        // Update local state quickly
        setSchedules(prev => prev.map(s => {
          if (s._id === scheduleId || s.id === scheduleId) {
            return res.data.schedule;
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Failed to log dose:', err);
    }

    // Trigger Gamification Reward if marking as taken
    if (!currentVal) {
      setShowReward(true);
      setPoints(prev => prev + 10);
      setTimeout(() => setShowReward(false), 2500);
    }
  };

  // Request Refill
  const handleRequestRefill = async (scheduleId) => {
    try {
      const res = await axios.post(`${API_URL}/schedules/request-refill`, { scheduleId }, config);
      if (res.data && res.data.success) {
        setSchedules(prev => prev.map(s => {
          if (s._id === scheduleId || s.id === scheduleId) {
            return res.data.schedule;
          }
          return s;
        }));
        
        // Show success alert
        if (notificationPermission === 'granted') {
          new Notification('Refill Requested', {
            body: `Dispensed 30 units refill. Catalog stock updated successfully.`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to request refill:', err);
    }
  };

  // Trigger Mock Reminder
  const triggerMockReminder = (medName) => {
    if (notificationPermission === 'granted') {
      new Notification('💊 AegisRx Dose Reminder', {
        body: `It is time to take your scheduled dose of ${medName}. Remember to check food directions!`,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💊</text></svg>'
      });
    } else {
      alert(`Reminder Triggered! Time to take: ${medName}`);
    }
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - 3 + i); // 3 days ago, today, and 3 days ahead
      days.push(date);
    }
    return days;
  };

  const daysToShow = getDaysArray();
  const todayStr = new Date().toISOString().split('T')[0];

  // --- GAMIFICATION CALCULATIONS ---
  const calculateTodayAdherence = () => {
    let totalExpected = 0;
    let totalTaken = 0;

    schedules.forEach(sched => {
      ['morning', 'afternoon', 'night'].forEach(slot => {
        if (sched.frequency[slot]) {
          totalExpected++;
          const takenObj = sched.takenDates.find(td => td.date.startsWith(todayStr) && td.timeSlot === slot);
          if (takenObj && takenObj.isTaken) {
            totalTaken++;
          }
        }
      });
    });

    if (totalExpected === 0) return 100;
    return Math.round((totalTaken / totalExpected) * 100);
  };

  const adherenceScore = calculateTodayAdherence();
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (adherenceScore / 100) * circumference;

  return (
    <div className="space-y-6 relative">
      {/* Gamification Reward Overlay */}
      <AnimatePresence>
        {showReward && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.6)] flex flex-col items-center">
              <FiStar size={48} className="text-white animate-spin-slow mb-2" />
              <span className="text-white font-black text-2xl tracking-widest uppercase">Excellent!</span>
              <span className="text-yellow-100 font-bold text-lg">+10 Adherence Points</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-card p-6 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <FiCalendar size={22} className="text-primary-500" />
            <span>Daily Pill Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Monitor timing schedules, mark doses taken, and trigger desktop push notifications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/20 dark:text-primary-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
            >
              <FiBell size={14} className="animate-swing" />
              <span>Enable Notifications</span>
            </button>
          )}

          <button
            onClick={fetchSchedules}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
            title="Refresh Schedules"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader size="large" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading Clinical Calendar...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4">
          <FiCalendar size={48} className="mx-auto text-slate-350 dark:text-slate-700" />
          <h3 className="font-extrabold text-slate-700 dark:text-slate-350">No active pill schedule found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your calendar is empty! Once a pharmacist or clinician writes a digital prescription for you, your timing cards and notifications will activate here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Gamification Sidebar */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiTarget className="text-indigo-500" />
                <span>Today's Adherence</span>
              </h3>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="30" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <motion.circle 
                    cx="64" cy="64" r="30" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`${adherenceScore === 100 ? 'text-green-500' : adherenceScore > 50 ? 'text-orange-500' : 'text-red-500'} drop-shadow-md`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{adherenceScore}%</span>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 w-full flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <FiAward size={18} />
                  <span className="font-bold text-sm">Total Points</span>
                </div>
                <span className="font-black text-lg text-indigo-800 dark:text-indigo-300">{points}</span>
              </div>
            </div>
          </div>

          {/* Calendar timeline sheet */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {/* Timeline header */}
            <div className="grid grid-cols-7 gap-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm text-center">
              {daysToShow.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const isToday = dateStr === todayStr;
                return (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-xl text-xs flex flex-col items-center ${
                      isToday ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10' : 'text-slate-650 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wide">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-extrabold mt-1">
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* List of active schedules */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <FiClock size={16} className="text-teal-500" />
                <span>Active Medication Intake Timeline</span>
              </h3>

              {schedules.map((sched) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={sched._id || sched.id} 
                  className="glass-card p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {sched.medicineName} {sched.strength}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center space-x-1">
                          <FiCoffee size={10} />
                          <span>{sched.foodRelation}</span>
                        </span>
                        <span>•</span>
                        <span>Duration: {sched.durationDays} Days</span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerMockReminder(sched.medicineName)}
                      className="px-2 py-1 rounded bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 text-[10px] font-extrabold flex items-center space-x-1"
                    >
                      <FiBell size={10} />
                      <span>Test Alert</span>
                    </button>
                  </div>

                  {/* Frequency timetable */}
                  <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {['morning', 'afternoon', 'night'].map((slot) => {
                      if (!sched.frequency[slot]) return null;

                      // Check if taken on today's date
                      const dateKey = todayStr;
                      const isTaken = sched.dosesTaken.some(d => d.date === dateKey && d.timeSlot === slot);

                      return (
                        <div 
                          key={slot} 
                          onClick={() => handleToggleDose(sched._id || sched.id, dateKey, slot, isTaken)}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isTaken 
                              ? 'bg-teal-50/50 border-teal-200/50 dark:bg-teal-950/10 dark:border-teal-900/30' 
                              : 'bg-slate-50/40 border-slate-200 dark:bg-slate-950/10 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <input 
                              type="checkbox"
                              checked={isTaken}
                              onChange={() => {}} // Controlled click via parent div
                              className="rounded border-slate-300 text-teal-500 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">{slot}</span>
                          </div>

                          {isTaken && (
                            <FiCheckCircle size={14} className="text-teal-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Warnings & Refills side panel */}
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-850 dark:text-slate-150 flex items-center space-x-1.5">
              <FiAlertTriangle size={16} className="text-amber-500" />
              <span>Compliance & Refills Tracker</span>
            </h3>

            {schedules.map((sched) => {
              // Calculate remaining days
              const start = new Date(sched.startDate);
              const elapsed = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
              const remaining = Math.max(0, sched.durationDays - elapsed);
              const needsRefill = remaining <= 2;

              return (
                <div key={sched._id || sched.id} className="glass-card p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-350">{sched.medicineName}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      needsRefill ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    }`}>
                      {remaining} days left
                    </span>
                  </div>

                  {/* Refill Prompt */}
                  {needsRefill ? (
                    <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/35 p-3 rounded-xl space-y-2">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                        Your supply of this medication is running low. Please submit a refill request to sync with pharmacy inventories.
                      </p>
                      
                      {sched.refillRequested ? (
                        <div className="text-[10px] font-bold text-teal-600 flex items-center space-x-1">
                          <FiCheckCircle size={12} />
                          <span>Refill Requested & Processed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestRefill(sched._id || sched.id)}
                          className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <FiRefreshCw size={12} />
                          <span>Request Refill Now</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-450 dark:text-slate-500">
                      Supply is stable. Refill options will open when the duration reaches 2 days or less.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

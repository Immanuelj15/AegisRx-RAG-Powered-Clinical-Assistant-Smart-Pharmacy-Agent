import React, { useState, useEffect } from 'react';
import { 
  FiVideo, 
  FiMic, 
  FiMicOff, 
  FiVideoOff, 
  FiPhoneMissed, 
  FiMaximize, 
  FiShield, 
  FiActivity,
  FiFileText,
  FiHeart
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';

export const Telemedicine = () => {
  const { user } = useAuth();
  const [callState, setCallState] = useState('connecting'); // 'connecting', 'active', 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Simulate connection delay
  useEffect(() => {
    if (callState === 'connecting') {
      const timer = setTimeout(() => {
        setCallState('active');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callState === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
  };

  if (callState === 'ended') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-200 dark:border-slate-800">
          <FiPhoneMissed size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Call Ended</h2>
        <p className="text-sm font-semibold text-slate-500">Duration: {formatTime(callDuration)}</p>
        <button 
          onClick={() => { setCallState('connecting'); setCallDuration(0); }}
          className="btn-primary px-6 py-3 mt-4"
        >
          Start New Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT / MAIN PANEL: The Video Call */}
      <div className="lg:col-span-8 flex flex-col h-full bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800">
        
        {/* Top Overlay Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className="bg-red-500 w-2.5 h-2.5 rounded-full animate-pulse"></span>
            <span className="text-white font-bold text-sm drop-shadow-md">
              {callState === 'active' ? formatTime(callDuration) : 'Establishing secure connection...'}
            </span>
          </div>
          <div className="flex space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <FiShield /> HIPAA Compliant
            </span>
          </div>
        </div>

        {/* Main Video Feed (Pharmacist or Patient depending on role) */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center bg-slate-950">
          <AnimatePresence>
            {callState === 'connecting' && (
              <motion.div 
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md"
              >
                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <FiVideo size={32} className="text-indigo-400 relative z-10" />
                </div>
                <h3 className="text-white text-xl font-bold tracking-tight">Virtual Waiting Room</h3>
                <p className="text-indigo-300/80 text-sm mt-2 font-medium">Please wait for the clinician to join...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {callState === 'active' && (
            <div className="w-full h-full bg-slate-900 absolute inset-0 z-20">
              <JitsiMeeting
                domain="meet.jit.si"
                roomName="AegisRx-Secure-Clinic-Consultation"
                configOverwrite={{
                  startWithAudioMuted: false,
                  startWithVideoMuted: false,
                  disableModeratorIndicator: true,
                  prejoinPageEnabled: false // Skip their native prejoin page since we have our waiting room
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                  SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                  TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
                    'videoquality', 'filmstrip', 'shortcuts', 'tileview'
                  ]
                }}
                userInfo={{
                  displayName: user?.name || (user?.role === 'Pharmacist' ? 'Dr. AegisRx' : 'AegisRx Patient')
                }}
                onApiReady={(externalApi) => {
                  // When the user clicks the red hangup button inside Jitsi
                  externalApi.addListener('videoConferenceLeft', () => {
                    handleEndCall();
                  });
                }}
                getIFrameRef={(iframeRef) => {
                  iframeRef.style.height = '100%';
                  iframeRef.style.width = '100%';
                  iframeRef.style.border = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Clinical Context */}
      <div className="lg:col-span-4 h-full flex flex-col space-y-4">
        <div className="glass-card flex-1 p-6 flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <FiActivity className="text-emerald-500" /> Live Clinical Context
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            
            {/* Context Widget 1 */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80">
              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <FiHeart className="text-rose-500" /> Active Symptoms
              </h4>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Reports persistent mild headache and nausea over the last 48 hours. No fever.
              </p>
            </div>

            {/* Context Widget 2 */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80">
              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <FiFileText className="text-indigo-500" /> Recent Prescriptions
              </h4>
              <ul className="space-y-2">
                <li className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Atorvastatin 20mg</span>
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">Adherent</span>
                </li>
                <li className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Metformin 500mg</span>
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">Adherent</span>
                </li>
              </ul>
            </div>

            {/* Chat Overlay / Notes */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex-1 min-h-[150px] flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Live Consultation Notes</h4>
              <textarea 
                className="flex-1 w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-600 dark:text-slate-300 resize-none placeholder-slate-300 dark:placeholder-slate-600"
                placeholder="Type clinician notes here during the call..."
              ></textarea>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

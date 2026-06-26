import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useVoice } from '../hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, 
  FiMic, 
  FiMicOff, 
  FiVolume2, 
  FiVolumeX, 
  FiDownload, 
  FiFolder,
  FiPlusCircle,
  FiMessageSquare,
  FiTrash2,
  FiRadio
} from 'react-icons/fi';
import { Loader, TypingLoader } from '../components/Loader';

export const AiChat = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [readBackEnabled, setReadBackEnabled] = useState(false);
  
  const chatBottomRef = useRef(null);

  const { 
    speechSupported, 
    isListening, 
    isSpeaking, 
    speak, 
    stopSpeaking, 
    startListening, 
    stopListening 
  } = useVoice();

  // Scroll to bottom on messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load chat sessions lists
  const loadSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/sessions`);
      if (res.data && res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = (session) => {
    setCurrentSessionId(session._id || session.id);
    setMessages(session.messages);
    stopSpeaking();
  };

  const handleCreateNewSession = () => {
    setCurrentSessionId('');
    setMessages([]);
    stopSpeaking();
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation(); // prevent selecting the session when clicking delete
    try {
      const res = await axios.delete(`${API_URL}/ai/sessions/${sessionId}`);
      if (res.data && res.data.success) {
        setSessions(prev => prev.filter(s => (s._id || s.id) !== sessionId));
        // If we deleted the currently active session, clear the screen
        if (currentSessionId === sessionId) {
          handleCreateNewSession();
        }
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    // Append user message immediately
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ai/chat`, {
        message: text,
        sessionId: currentSessionId
      });

      if (res.data && res.data.success) {
        setCurrentSessionId(res.data.sessionId);
        setMessages(res.data.session.messages);
        loadSessions(); // reload list
        
        // Voice read back if enabled
        if (readBackEnabled) {
          speak(res.data.response);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Connection error. RAG pipeline is offline.', 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Voice Microphone start/stop
  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setQuery(transcript);
        handleSendMessage(transcript);
      });
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (messages.length === 0) return;

    try {
      const response = await axios.post(`${API_URL}/ai/export-pdf`, {
        title: sessions.find(s => s._id === currentSessionId || s.id === currentSessionId)?.title || 'AegisRx consultation',
        messages: messages
      }, {
        responseType: 'blob' // Important to stream binaries
      });

      // Trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Consultation-Summary-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)]">
      {/* Session lists sidebar */}
      <div className="glass-card p-4 flex flex-col h-64 lg:h-full lg:col-span-1 order-2 lg:order-1">
        <button
          onClick={handleCreateNewSession}
          className="w-full flex items-center justify-center space-x-2 p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
        >
          <FiPlusCircle size={14} />
          <span>New Consultation</span>
        </button>

        <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mt-6 mb-2 flex items-center space-x-1.5">
          <FiFolder size={12} />
          <span>Previous Consultations</span>
        </h4>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-slate-400 p-2 italic">No past sessions found.</p>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess._id || sess.id}
                className={`w-full flex items-center justify-between rounded-xl overflow-hidden transition-colors ${
                  (sess._id === currentSessionId || sess.id === currentSessionId)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-secondary-400 border border-primary-200/50 dark:border-primary-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <button
                  onClick={() => handleSelectSession(sess)}
                  className="flex-1 text-left p-2.5 text-xs font-semibold truncate"
                >
                  {sess.title || 'General consultation'}
                </button>
                <button
                  onClick={(e) => handleDeleteSession(e, sess._id || sess.id)}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete Chat"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat frame */}
      <div className="glass-card p-4 md:p-5 flex flex-col h-[65vh] lg:h-full lg:col-span-3 order-1 lg:order-2">
        {/* Chat Control toolbar */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">RAG AI Clinician</h4>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setReadBackEnabled(!readBackEnabled);
                if (isSpeaking) stopSpeaking();
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                readBackEnabled 
                  ? 'bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40' 
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
              title="Toggle Text-to-Speech Response Read Back"
            >
              {readBackEnabled ? <FiVolume2 size={14} /> : <FiVolumeX size={14} />}
              <span className="hidden sm:inline">Voice Response</span>
              {/* Speaking indicator */}
              {isSpeaking && (
                <span className="flex gap-0.5 ml-1">
                  {[0,0.1,0.2,0.1].map((delay, i) => (
                    <span key={i} className="w-0.5 bg-teal-500 rounded-full animate-bounce" style={{height: '10px', animationDelay: `${delay}s`}} />
                  ))}
                </span>
              )}
            </button>

            {/* PDF Export Button */}
            <button
              onClick={handleExportPDF}
              disabled={messages.length === 0}
              className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center space-x-1.5 text-xs font-bold"
              title="Export Conversation to PDF"
            >
              <FiDownload size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Message board */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/30 text-primary-500 rounded-2xl flex items-center justify-center">
                <FiMessageSquare size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100">Consult Clinical Support AI</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Query stock status, search side effects, review cautions, or map medicine alternatives. Responses are RAG-indexed against catalog registers.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex space-x-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
              >
                {msg.role !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    AI
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white border-transparent shadow-sm'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200/40 dark:border-slate-700/50'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="font-medium whitespace-pre-line">{msg.content}</p>
                  ) : (
                    <div className="prose prose-xs prose-slate dark:prose-invert max-w-none
                      [&>h1]:text-sm [&>h1]:font-extrabold [&>h1]:mb-2 [&>h1]:mt-3
                      [&>h2]:text-xs [&>h2]:font-extrabold [&>h2]:mb-1.5 [&>h2]:mt-3 [&>h2]:text-primary-600 dark:[&>h2]:text-primary-400
                      [&>h3]:text-xs [&>h3]:font-bold [&>h3]:mb-1 [&>h3]:mt-2
                      [&>p]:mb-2 [&>p]:leading-relaxed [&>p]:font-medium
                      [&>ul]:my-2 [&>ul]:pl-4 [&>ul>li]:mb-1 [&>ul>li]:list-disc [&>ul>li]:font-medium
                      [&>ol]:my-2 [&>ol]:pl-4 [&>ol>li]:mb-1 [&>ol>li]:list-decimal [&>ol>li]:font-medium
                      [&>table]:w-full [&>table]:text-[10px] [&>table]:border-collapse [&>table]:my-2
                      [&>table_th]:px-2 [&>table_th]:py-1 [&>table_th]:bg-slate-200 dark:[&>table_th]:bg-slate-700 [&>table_th]:font-extrabold [&>table_th]:text-left [&>table_th]:border [&>table_th]:border-slate-300 dark:[&>table_th]:border-slate-600
                      [&>table_td]:px-2 [&>table_td]:py-1 [&>table_td]:border [&>table_td]:border-slate-200 dark:[&>table_td]:border-slate-700
                      [&>blockquote]:border-l-4 [&>blockquote]:border-primary-400 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-500
                      [&>hr]:border-slate-300 dark:[&>hr]:border-slate-600 [&>hr]:my-3
                      [&>strong]:font-extrabold [&>em]:italic
                    ">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-350 flex items-center justify-center text-xs font-bold">
                    ME
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex space-x-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-xs">
                AI
              </div>
              <TypingLoader />
            </div>
          )}
          
          {/* Listening state bubble */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="flex space-x-3 max-w-[85%] ml-auto justify-end"
              >
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center gap-3">
                  <FiRadio size={14} className="text-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">Listening... speak now</span>
                  <span className="flex gap-0.5">
                    {[0,0.15,0.3,0.15,0].map((delay, i) => (
                      <span key={i} className="w-0.5 bg-red-500 rounded-full animate-bounce" style={{height: '12px', animationDelay: `${delay}s`}} />
                    ))}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatBottomRef}></div>
        </div>

        {/* Input panel */}
        <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Voice Microphone */}
          {speechSupported && (
            <div className="relative">
              <button
                onClick={handleToggleVoice}
                disabled={loading}
                className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center relative ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-red-500/30 shadow-lg scale-110' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
                }`}
                title={isListening ? 'Stop Listening' : 'Start Voice Input'}
              >
                {isListening ? <FiMicOff size={16} /> : <FiMic size={16} />}
                {/* Animated pulse rings when listening */}
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400 opacity-30" />
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400 opacity-20" style={{animationDelay: '0.2s'}} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? "Listening..." : "Ask AegisRx about medicine stock, instructions, warnings..."}
            disabled={isListening}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100 transition-all"
          />

          <button
            onClick={() => handleSendMessage()}
            className="p-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-500/10"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

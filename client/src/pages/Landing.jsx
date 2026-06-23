import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiCpu, 
  FiSearch, 
  FiFileText, 
  FiMic, 
  FiLayers, 
  FiCheckCircle,
  FiActivity
} from 'react-icons/fi';

export const Landing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <header className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            AI MedAssist
          </span>
        </div>

        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm shadow-sm"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 text-primary-600 dark:text-primary-400">
            <FiActivity className="animate-pulse" size={16} />
            <span className="text-xs font-bold tracking-wide uppercase">Next-Gen Clinical AI Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
            Smart Hospital & <span className="bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent">Pharmacy AI Agent</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
            Empower clinicians, pharmacists, and patients with instant prescription summaries, semantic search, out-of-stock substitute finders, and RAG-driven medical consultation.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-base transition-colors shadow-lg shadow-primary-500/20 inline-flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <FiArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
            >
              Interactive Live Demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Illustration Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-md mx-auto w-full"
        >
          {/* Decorative glow background */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-card blur-lg opacity-25 dark:opacity-40"></div>
          
          {/* Chat Window Mockup */}
          <div className="relative glass-card border border-white/20 dark:border-slate-800 p-6 flex flex-col h-[380px]">
            <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-sm">A</div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Clinical Support Assistant</p>
                <p className="text-[10px] text-teal-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block mr-1.5 animate-pulse"></span>RAG Vector DB Active</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="flex space-x-2.5 max-w-[85%]">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-[10px] font-bold text-primary-500">AI</div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-350">
                  Hello! How can I assist you in the hospital database today?
                </div>
              </div>

              <div className="flex space-x-2.5 max-w-[85%] ml-auto justify-end">
                <div className="p-3 bg-primary-500 text-white rounded-2xl text-xs shadow-sm">
                  Do you have Paracetamol 500mg in stock?
                </div>
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold">DR</div>
              </div>

              <div className="flex space-x-2.5 max-w-[90%]">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-[10px] font-bold text-primary-500">AI</div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-350 space-y-2">
                  <p className="font-bold text-teal-600 dark:text-teal-400">Yes, Paracetamol 500mg (Panadol) is available!</p>
                  <p>• Stock: **150 units**<br/>• Price: **$2.50 /strip**<br/>• Dosage: 1 tab every 6 hrs after food</p>
                </div>
              </div>
            </div>

            {/* Input bar mockup */}
            <div className="mt-4 flex space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Ask about prescription dosages, alternatives...</span>
                <FiMic size={14} className="text-slate-400" />
              </div>
              <button className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center"><FiArrowRight size={14} /></button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Intelligent Clinical Workflows</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              AI MedAssist utilizes advanced retrieval mechanisms to parse inventory and understand pharmacology safety boundaries.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-primary-500 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                <FiSearch size={22} />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">RAG Medicine Search</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Find stock availability, prices, active generic names, and dosage guidelines using semantic vector queries.
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center">
                <FiLayers size={22} />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Alternative Mapping</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If a medicine is out of stock, the clinical agent instantly scans for generic or brand alternatives with a full safety comparison.
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                <FiFileText size={22} />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Prescription OCR</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload scans or pictures of hand-written prescriptions. The AI extracts the items and lays out a timed morning/afternoon/night schedule.
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                <FiMic size={22} />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Voice Integration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Speak directly to search catalog items hands-free, and listen as the assistant reads out warnings and intake directions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RAG Details section */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Structured CSV RAG Pipeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            AI MedAssist maintains high diagnostic integrity by coupling large language models with a local vector database. Hospital staff upload inventory sheets which are cleaned, embedded via SentenceTransformers, and queried in real-time.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FiCheckCircle className="text-primary-500" size={18} />
              <span>ChromaDB local document store (all-MiniLM-L6-v2)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FiCheckCircle className="text-primary-500" size={18} />
              <span>Groq API Integration (Llama 3.3 70B & Mixtral)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FiCheckCircle className="text-primary-500" size={18} />
              <span>Role-based portal filters (Patient, Pharmacist, Admin)</span>
            </div>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-card p-6 shadow-sm flex flex-col justify-center items-center">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-6">Pipeline Visualization</span>
          <div className="flex flex-col space-y-4 w-full text-xs font-semibold text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">CSV Upload & Parsing (Multer)</div>
            <div className="text-slate-400">⬇️</div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/30 text-teal-700 dark:text-teal-400 rounded-xl">Embedding generation (SentenceTransformers)</div>
            <div className="text-slate-400">⬇️</div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/30 text-primary-600 dark:text-primary-400 rounded-xl">Storage & Search (ChromaDB)</div>
            <div className="text-slate-400">⬇️</div>
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl shadow-sm">Groq LLM Prompt Integration (Llama 3.3)</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/40 dark:border-slate-800/30 py-8 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-medium text-slate-400">
          <span>© 2026 AI MedAssist Systems. All rights reserved.</span>
          <span className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Clinical Guidelines</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

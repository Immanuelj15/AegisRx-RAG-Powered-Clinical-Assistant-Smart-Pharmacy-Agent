import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { 
  FiArrowRight, FiSearch, FiFileText, FiMic,
  FiCheckCircle, FiActivity, FiShield, FiZap, FiSliders
} from 'react-icons/fi';

// Custom CountUp Hook
const useCountUp = (end, duration = 2.5) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

  React.useEffect(() => {
    if (!isInView) return;
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(end * easeProgress);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return { count, ref };
};

// Custom Typewriter Hook
const useTypewriter = (words, typingSpeed = 50, deletingSpeed = 30, delay = 2500) => {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout;
    
    if (isDeleting) {
      if (text === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        timeout = setTimeout(() => setText(text.slice(0, -1)), deletingSpeed);
      }
    } else {
      if (text === currentWord) {
        timeout = setTimeout(() => setIsDeleting(true), delay);
      } else {
        timeout = setTimeout(() => setText(currentWord.slice(0, text.length + 1)), typingSpeed);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, delay]);

  return text;
};

// StatCard Component to obey Rules of Hooks
const StatCard = ({ stat, index }) => {
  const { count, ref } = useCountUp(stat.end);
  return (
    <motion.div ref={ref}
      custom={index} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
      className="text-center space-y-2">
      <div className={`text-4xl md:text-5xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
        {stat.prefix || ''}{stat.decimals ? count.toFixed(stat.decimals) : Math.round(count)}{stat.suffix || ''}
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
    </motion.div>
  );
};

const fade = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 1.2, ease: [0.22,1,0.36,1], delay: i * 0.15 }
  })
};

const STATS = [
  { end: 10, suffix: 'M+', label: 'Patient Queries Handled', color: 'from-blue-500 to-cyan-400' },
  { end: 99.2, decimals: 1, suffix: '%', label: 'Drug Safety Accuracy', color: 'from-teal-500 to-emerald-400' },
  { end: 1, prefix: '<', suffix: 's', label: 'RAG Response Time', color: 'from-violet-500 to-purple-400' },
  { end: 50, suffix: '+', label: 'Hospital Integrations', color: 'from-orange-500 to-rose-400' },
];

const FEATURES = [
  {
    icon: <FiSearch size={24} />,
    color: 'from-blue-500 to-cyan-400',
    iconColor: 'text-blue-500 dark:text-cyan-400',
    bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20',
    title: 'Hybrid RAG Search',
    desc: 'Dense + BM25 vector retrieval with cross-encoder reranking. Find any medicine by symptom, name, or code in milliseconds.'
  },
  {
    icon: <FiShield size={24} />,
    color: 'from-red-500 to-rose-400',
    iconColor: 'text-red-500 dark:text-rose-400',
    bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20',
    title: 'FDA Safety Auditing',
    desc: 'Real-time openFDA recall checks, drug-drug interaction detection, and allergy conflict blocking at point of dispensing.'
  },
  {
    icon: <FiFileText size={24} />,
    color: 'from-violet-500 to-purple-400',
    iconColor: 'text-violet-500 dark:text-purple-400',
    bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20',
    title: 'Smart Prescription OCR',
    desc: 'Canvas-preprocessed Tesseract.js OCR extracts handwritten prescriptions and builds AM/PM/Night schedules instantly.'
  },
  {
    icon: <FiActivity size={24} />,
    color: 'from-teal-500 to-emerald-400',
    iconColor: 'text-teal-500 dark:text-emerald-400',
    bg: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20',
    title: 'AI Symptom Triage',
    desc: 'Patients describe symptoms — the clinical AI triages urgency (ER / GP / Self-Care), conditions, and OTC recommendations.'
  },
  {
    icon: <FiSliders size={24} />,
    color: 'from-orange-500 to-amber-400',
    iconColor: 'text-orange-500 dark:text-amber-400',
    bg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
    title: 'Dosage Calculator',
    desc: 'Weight, age, and renal-function-adjusted dosing with contraindications, monitoring parameters, and hepatic notes.'
  },
  {
    icon: <FiMic size={24} />,
    color: 'from-pink-500 to-rose-400',
    iconColor: 'text-pink-500 dark:text-rose-400',
    bg: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20',
    title: 'Voice AI Interface',
    desc: 'Speak naturally to search, consult, or get dose reminders. Text-to-speech reads back AI responses hands-free.'
  }
];

const PIPELINE = [
  { label: 'CSV / Prescription Upload', icon: '📄', color: 'border-slate-300 dark:border-slate-700' },
  { label: 'Embedding (SentenceTransformers)', icon: '🧠', color: 'border-primary-300 dark:border-primary-700' },
  { label: 'ChromaDB Vector Store + BM25', icon: '🗄️', color: 'border-teal-300 dark:border-teal-700' },
  { label: 'Cross-Encoder Reranking', icon: '🔀', color: 'border-violet-300 dark:border-violet-700' },
  { label: 'Groq LLM — Llama 3.3 70B', icon: '⚡', color: 'border-primary-500 dark:border-primary-400', highlight: true },
];

export const Landing = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const typingText = useTypewriter([
    'Patients Safer',
    'Hospitals Smarter',
    'Pharmacists Faster',
    'Dosages Accurate'
  ]);

  // Parallax scroll hooks
  const { scrollY } = useScroll();
  const yHeroBg = useTransform(scrollY, [0, 1000], [0, 150]);
  const yOrbs = useTransform(scrollY, [0, 1000], [0, -200]);
  const yImage1 = useTransform(scrollY, [500, 2500], [50, -100]); // Isometric Pipeline
  const yImage2 = useTransform(scrollY, [1500, 3500], [50, -100]); // Doctor Tech

  const chatMessages = [
    { role: 'ai', text: 'Hello! I\'m AegisRx — your clinical AI assistant. How can I help today?' },
    { role: 'user', text: 'Do you have Paracetamol 500mg in stock?' },
    { role: 'ai', text: '✅ **Paracetamol 500mg (Panadol)** is available!\n• Stock: **150 units**\n• Price: **$2.50/strip**\n• Dosage: 1 tab every 6 hrs after food\n• No active FDA recalls detected.' },
  ];

  return (
    <div className="min-h-screen bg-mesh dark:bg-mesh text-slate-800 dark:text-slate-100">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full">
        <div className="glass-panel border-b border-slate-200/40 dark:border-slate-800/30">
          <div className="max-w-7xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30">
                A
              </div>
              <div>
                <span className="font-black text-xl gradient-text tracking-tight">AegisRx</span>
                <p className="text-[10px] font-bold text-slate-400 -mt-0.5 tracking-widest uppercase">Clinical AI Platform</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {['Features', 'Pipeline', 'Safety'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mr-2"
                title="Toggle Dark Mode"
              >
                {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
              <Link to="/login" className="btn-secondary text-sm px-5 py-2.5">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5 hidden sm:inline-flex">
                Start Free <FiArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
        {/* 3D Medical AI Background Overlay with Parallax */}
        <motion.div 
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] opacity-15 dark:opacity-30 pointer-events-none mix-blend-screen"
          style={{ 
            y: yHeroBg,
            backgroundImage: "url('/hero-ai.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            maskImage: 'radial-gradient(circle at center, black 0%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 60%)'
          }} 
        />
        
        <motion.div className="hero-orb-1" style={{ y: yOrbs }} />
        <motion.div className="hero-orb-2" style={{ y: yOrbs }} />

        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left */}
          <div className="space-y-8">
            <motion.div custom={0} variants={fade} initial="hidden" animate="visible"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200/60 dark:border-primary-800/40 text-primary-600 dark:text-primary-400">
              <FiActivity size={15} className="animate-pulse" />
              <span className="text-sm font-bold tracking-wide">Next-Gen Clinical AI Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />
            </motion.div>

            <motion.h1 custom={1} variants={fade} initial="hidden" animate="visible"
              className="font-black text-slate-900 dark:text-white leading-none h-[80px] sm:h-auto">
              The AI That Keeps<br className="hidden sm:block" />
              <span className="gradient-text relative pr-1">
                {typingText}
                <span className="absolute right-0 top-0 h-full w-[2px] bg-primary-500 animate-pulse"></span>
              </span>
            </motion.h1>

            <motion.p custom={2} variants={fade} initial="hidden" animate="visible"
              className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
              AegisRx combines <strong className="text-slate-700 dark:text-slate-200">RAG-powered search</strong>, real-time FDA safety auditing, 
              AI triage, OCR prescriptions, and clinical decision support — all in one platform.
            </motion.p>

            <motion.div custom={3} variants={fade} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary text-base px-8 py-4">
                Get Started Free <FiArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-4">
                See Live Demo
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div custom={4} variants={fade} initial="hidden" animate="visible"
              className="flex flex-wrap items-center gap-5 pt-2">
              {['FDA Data Integration', 'HIPAA-Aligned', 'Groq Llama 3.3'].map(badge => (
                <div key={badge} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <FiCheckCircle size={15} className="text-teal-500" />
                  {badge}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Chat Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22,1,0.36,1], delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-3 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-[28px] blur-2xl" />
            <div className="relative glass-card border border-white/30 dark:border-slate-700/50 p-6 shadow-2xl">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-black shadow-md shadow-primary-500/30">
                  A
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">AegisRx Clinical AI</p>
                  <p className="text-xs text-teal-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block animate-pulse" />
                    RAG Vector DB · FDA Live
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {['bg-red-400','bg-amber-400','bg-green-400'].map((c,i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 min-h-[260px]">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.4 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-[10px] font-black text-primary-600 dark:text-primary-400 flex-shrink-0">AI</div>
                    )}
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed font-medium ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm shadow-sm shadow-primary-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                    }`}>
                      {msg.text.split('\n').map((line, li) => (
                        <span key={li}>
                          {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                          {li < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300 flex-shrink-0">DR</div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Input bar */}
              <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                  <span>Ask about prescriptions, drug safety...</span>
                  <FiMic size={16} className="text-slate-400" />
                </div>
                <button className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-500/30 hover:shadow-primary-500/50 transition-shadow">
                  <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────── */}
      <section className="border-y border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-14">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <motion.div custom={0} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400">
            <FiZap size={13} className="text-primary-500" /> Platform Capabilities
          </motion.div>
          <motion.h2 custom={1} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-slate-900 dark:text-white font-black">
            Built for <span className="gradient-text">Real Clinical Work</span>
          </motion.h2>
          <motion.p custom={2} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Every feature addresses a real gap in clinical pharmacy workflows — not just tech for the sake of tech.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <motion.div key={i}
              custom={i} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card p-7 space-y-4 group cursor-default">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.bg} flex items-center justify-center`}>
                <div className={`${feat.iconColor}`}>
                  {feat.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:gradient-text transition-all">{feat.title}</h3>
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECURITY SECTION ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div custom={0} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="rounded-[32px] overflow-hidden bg-slate-900 relative grid md:grid-cols-2 items-center shadow-2xl">
          <div className="p-12 md:p-16 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-teal-400">
              <FiShield size={14} /> HIPAA Compliant
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Enterprise-Grade <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">Security</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Your patient data is protected with end-to-end AES-256 encryption. We never train public LLMs on your clinical data, ensuring strict HIPAA compliance and absolute privacy.
            </p>
          </div>
          <div className="h-full min-h-[300px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-10 w-24 hidden md:block" />
            <img src="/data-security.png" alt="Data Security" loading="lazy" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90" />
          </div>
        </motion.div>
      </section>

      {/* ── PIPELINE SECTION ──────────────────────────────── */}
      <section id="pipeline" className="bg-slate-900 dark:bg-slate-950 py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div custom={0} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <span className="text-sm font-bold text-primary-400 uppercase tracking-widest">Technical Architecture</span>
                <h2 className="text-white font-black mt-3">
                  Hybrid RAG<br /><span className="gradient-text">Pipeline</span>
                </h2>
              </motion.div>
              <motion.p custom={1} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-lg text-slate-400 leading-relaxed font-medium">
                AegisRx fuses dense semantic search with sparse keyword matching, then cross-encoder reranks results for clinical accuracy — so "MED4819" or "Paracetamol fever" both work perfectly.
              </motion.p>
              <div className="space-y-3">
                {['ChromaDB local vector store', 'SimpleBM25 sparse index', 'Cross-Encoder reranking (ms-marco)', 'Groq Llama 3.3 70B generation'].map((item, i) => (
                  <motion.div key={i} custom={i+2} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="flex items-center gap-3 text-base font-semibold text-slate-300">
                    <FiCheckCircle size={18} className="text-teal-400 flex-shrink-0" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div custom={3} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative">
              
              {/* Isometric Image with Parallax */}
              <motion.div className="relative rounded-[28px] overflow-hidden shadow-2xl mb-8 group border border-slate-700/50" style={{ y: yImage1 }}>
                <img src="/features-iso.png" alt="AegisRx Dashboard Architecture" loading="lazy" className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-[1.5s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              </motion.div>

              {/* Steps overlapping the image */}
              <div className="space-y-3 relative z-10 -mt-16 px-4">
                {PIPELINE.map((step, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${step.color} ${
                  step.highlight
                    ? 'bg-gradient-to-r from-primary-600/20 to-teal-600/20'
                    : 'bg-slate-800/50'
                } backdrop-blur-sm`}>
                  <span className="text-2xl">{step.icon}</span>
                  <span className={`font-semibold text-base ${step.highlight ? 'text-white' : 'text-slate-300'}`}>
                    {step.label}
                  </span>
                  {i < PIPELINE.length - 1 && (
                    <div className="ml-auto text-slate-500">↓</div>
                  )}
                  {step.highlight && (
                    <span className="ml-auto badge badge-ai">Live</span>
                  )}
                </div>
              ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY PROFESSIONALS ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <motion.div custom={0} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-primary-500/10 aspect-[4/3] group border border-slate-200/50 dark:border-slate-700/50" style={{ y: yImage2 }}>
            <img src="/doctor-tech.png" alt="Doctor using AegisRx" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass-card p-5 rounded-2xl border border-white/20 backdrop-blur-md bg-slate-900/40">
                <p className="text-white font-bold text-sm leading-relaxed">"AegisRx reduced our prescription verification time by 40% while catching critical interactions we almost missed."</p>
                <p className="text-primary-300 text-xs font-semibold mt-2">— Dr. Sarah Jenkins, Clinical Pharmacy</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div custom={1} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400">
             <FiCheckCircle className="text-primary-500" size={14} /> Trusted Nationwide
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            Designed for <br/><span className="gradient-text">Real Clinical Environments</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-md">
            Whether you are running a busy hospital pharmacy or a community clinic, AegisRx provides the instant, reliable, FDA-backed data you need to make confident clinical decisions.
          </p>
          <ul className="space-y-4 pt-4">
            {['Pharmacist-first design', 'Zero-learning-curve UI', '24/7 Clinical Uptime'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <FiCheckCircle size={12} />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div custom={0} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="relative overflow-hidden rounded-[28px] p-12 md:p-16 text-center shadow-2xl shadow-primary-500/30 group"
          style={{ 
            backgroundImage: "url('/hero-ai.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }}
        >
          {/* Dark Glass Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-slate-900/70 group-hover:bg-slate-900/60 transition-colors duration-500 backdrop-blur-[2px]" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-white font-black text-4xl md:text-5xl">
              Ready to Transform <br />Clinical Care?
            </h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
              Join thousands of healthcare professionals using AegisRx to deliver safer, faster, evidence-based pharmacy care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-600 font-bold text-base hover:bg-blue-50 transition-all shadow-lg">
                Create Free Account <FiArrowRight size={18} />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/30 transition-all">
                Sign In to Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-slate-200/40 dark:border-slate-800/30 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-black shadow-sm">A</div>
            <span className="font-bold text-slate-700 dark:text-slate-300">AegisRx <span className="text-slate-400 font-normal">© 2026</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-400 hover:[&>a]:text-primary-500">
            {['Privacy Policy', 'Terms of Service', 'Clinical Guidelines', 'API Docs'].map(link => (
              <a key={link} href="#" className="transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-sm text-slate-400 font-medium">Built with ❤️ for safer healthcare</p>
        </div>
      </footer>
    </div>
  );
};

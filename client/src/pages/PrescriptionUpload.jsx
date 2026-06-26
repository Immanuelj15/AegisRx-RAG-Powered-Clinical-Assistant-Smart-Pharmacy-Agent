import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiAlertCircle, 
  FiClock, 
  FiDownloadCloud, 
  FiCheckCircle,
  FiCalendar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '../components/Loader';


// Helper for client-side canvas image preprocessing (Grayscale, Contrast enhancement, and Binarization)
const preprocessImage = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image on canvas
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const contrastFactor = 1.8; // Contrast multiplier
        const threshold = 120;       // Luminance threshold
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 1. Grayscale using percieved weights
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // 2. Contrast adjustment
          gray = contrastFactor * (gray - 128) + 128;
          
          // 3. Thresholding (Binarization)
          const finalVal = gray < threshold ? 0 : 255;
          
          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
  });
};

export const PrescriptionUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    
    // Create image preview if it is an image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }
  };

  const [ocrProgress, setOcrProgress] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a prescription file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setOcrProgress(0);

    let extractedText = '';
    
    // 1. Run local Tesseract OCR on Image
    try {
      let targetSource = file;
      
      // Apply advanced filters to images to increase OCR transcription rates
      if (file.type.startsWith('image/') && preview) {
        console.log("Applying canvas-level image preprocessing filters (Grayscale, Contrast Boost, Binarization)...");
        try {
          const processedDataUrl = await preprocessImage(preview);
          targetSource = processedDataUrl;
        } catch (prepErr) {
          console.warn("Failed to preprocess image, falling back to raw file:", prepErr);
          targetSource = file;
        }
      }
      
      const Tesseract = await import('tesseract.js');
      const ocrResult = await Tesseract.default.recognize(
        targetSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      extractedText = ocrResult.data.text;
    } catch (ocrErr) {
      console.warn('Tesseract OCR failed client-side, falling back to backend parser:', ocrErr);
    } finally {
      setOcrProgress(null);
    }

    // 2. Submit to backend API
    const formData = new FormData();
    formData.append('file', file);
    if (extractedText) {
      formData.append('extractedText', extractedText);
    }

    try {
      const res = await axios.post(`${API_URL}/ai/prescription`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload and parse prescription.');
    } finally {
      setLoading(false);
    }
  };


  // Download PDF Summary
  const handleDownloadPDF = async () => {
    if (!result || !result.analysis) return;

    try {
      const response = await axios.post(`${API_URL}/ai/export-prescription-pdf`, {
        analysis: result.analysis
      }, {
        responseType: 'blob'
      });

      // Stream PDF download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Prescription-Schedule-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      console.error('Prescription PDF download failed:', err);
    }
  };

  // Sync AI-parsed medications directly to Pill Calendar
  const handleSyncToCalendar = async () => {
    if (!result?.analysis) return;
    setSyncStatus('syncing');

    // Parse medication names from the AI analysis text using simple regex heuristics
    // Look for patterns like "Medicine: X", "Drug: X", lines with mg/mcg/ml, or listed items
    const analysisText = result.analysis;
    const medLines = analysisText.split('\n').filter(line => {
      const lower = line.toLowerCase();
      return (
        lower.includes('mg') || lower.includes('mcg') || lower.includes('ml') ||
        lower.includes('tablet') || lower.includes('capsule') || lower.includes('syrup') ||
        lower.includes('dose') || lower.includes('medicine') || lower.includes('drug')
      ) && line.length > 5 && line.length < 120;
    });

    // Extract a clean medicine name from each matched line
    const medsToSync = [];
    medLines.forEach(line => {
      // Strip bullet points, numbers, colons, markdown formatting
      const cleaned = line.replace(/^[\s\-\*\d\.]+/, '').replace(/\*\*/g, '').trim();
      if (cleaned.length > 3 && cleaned.length < 80) {
        // Extract just the drug name (first part before " - " or ":" or parenthesis)
        const name = cleaned.split(/[-:(]/)[0].trim();
        if (name.length > 2) medsToSync.push(name);
      }
    });

    // De-duplicate
    const uniqueMeds = [...new Set(medsToSync)].slice(0, 10); // cap at 10

    if (uniqueMeds.length === 0) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Create a schedule entry for each extracted medication
      const promises = uniqueMeds.map(medName =>
        axios.post(`${API_URL}/schedules/create`, {
          medicineName: medName,
          strength: '',
          frequency: { morning: true, afternoon: false, night: true },
          foodRelation: 'After Food',
          durationDays: 7,
          startDate: new Date().toISOString()
        }, config).catch(() => null) // don't fail the whole batch on one error
      );

      await Promise.all(promises);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err) {
      console.error('Calendar sync failed:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* File Uploader box */}
      <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between h-[420px]">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Upload Prescription</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Upload an image of a hand-written or digital prescription. The clinical OCR agent will extract the items, check schedules, and warn of side effects.
          </p>
        </div>

        <form onSubmit={handleUpload} className="mt-4 flex-1 flex flex-col justify-between">
          <label className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl cursor-pointer transition-colors max-h-[220px]">
            {preview ? (
              <img
                src={preview}
                alt="Prescription preview"
                className="w-full h-full object-cover rounded-2xl p-1 max-h-[210px]"
              />
            ) : (
              <div className="text-center p-4">
                <FiUploadCloud className="mx-auto text-slate-400 mb-2 animate-bounce-slow" size={32} />
                <span className="text-xs font-extrabold text-primary-500 block">Select Prescription Image</span>
                <span className="text-[10px] text-slate-450 block mt-1">JPEG, PNG, WebP or PDF</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <p className="text-[10px] font-bold text-red-500 text-center mt-2 flex items-center justify-center space-x-1">
              <FiAlertCircle size={12} />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full mt-4 flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-teal-500/10"
          >
            {loading ? <Loader size="small" color="white" /> : 'Analyze Schedule'}
          </button>
        </form>
      </div>

      {/* Parse Result / Dosage schedule summary */}
      <div className="glass-card p-6 lg:col-span-3 min-h-[420px] flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Loader size="large" color="secondary" />
            <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {ocrProgress !== null 
                ? `Extracting text from prescription: ${ocrProgress}%` 
                : 'Structuring dosage timeline via Groq AI...'}
            </p>
            {ocrProgress !== null && (
              <div className="w-48 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-150" 
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : result ? (
          <div className="flex-1 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FiCheckCircle className="text-teal-500" size={18} />
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-150">Dosage Schedule Extracted</h4>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Sync to Calendar Button */}
                  <AnimatePresence mode="wait">
                    {syncStatus === 'done' ? (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs font-bold flex items-center space-x-1"
                      >
                        <FiCheckCircle size={14} />
                        <span>Synced to Calendar!</span>
                      </motion.div>
                    ) : syncStatus === 'error' ? (
                      <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-xs font-bold"
                      >
                        Could not parse meds
                      </motion.div>
                    ) : (
                      <motion.button
                        key="btn"
                        onClick={handleSyncToCalendar}
                        disabled={syncStatus === 'syncing'}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 text-xs font-bold transition-all flex items-center space-x-1 disabled:opacity-50"
                      >
                        {syncStatus === 'syncing' ? (
                          <><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1" /><span>Syncing...</span></>
                        ) : (
                          <><FiCalendar size={14} /><span>Sync to Calendar</span></>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/20 dark:text-teal-400 text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    <FiDownloadCloud size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Analysis Text rendering */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl text-xs leading-relaxed space-y-4">
                <div className="whitespace-pre-line font-medium text-slate-700 dark:text-slate-350">
                  {result.analysis}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 italic text-center pt-2">
              Disclaimer: Scanned schedules are parsed via OCR. Verify timing schedules with physical prescription text.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FiFileText className="text-slate-300 dark:text-slate-700 mb-3" size={48} />
            <h4 className="font-extrabold text-slate-700 dark:text-slate-300">No active scan</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Upload and submit a clinical prescription image to translate messy medical handwritings into clear hourly scheduling charts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

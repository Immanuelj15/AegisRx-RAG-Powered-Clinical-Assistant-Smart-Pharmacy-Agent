import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiAlertCircle, 
  FiClock, 
  FiDownloadCloud, 
  FiCheckCircle 
} from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const PrescriptionUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      const Tesseract = await import('tesseract.js');
      const ocrResult = await Tesseract.default.recognize(
        file,
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
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FiCheckCircle className="text-teal-500" size={18} />
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-150">Dosage Schedule Extracted</h4>
                </div>
                
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/20 dark:text-teal-400 text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <FiDownloadCloud size={14} />
                  <span>Download Summary PDF</span>
                </button>
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

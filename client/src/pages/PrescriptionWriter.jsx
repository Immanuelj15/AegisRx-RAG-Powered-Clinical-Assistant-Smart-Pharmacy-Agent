import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiFileText, 
  FiUser, 
  FiPlus, 
  FiTrash, 
  FiDownloadCloud, 
  FiCheckCircle,
  FiPenTool
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertOctagon } from 'react-icons/fi';

export const PrescriptionWriter = () => {
  const [patientName, setPatientName] = useState('John Patient');
  const [patientAge, setPatientAge] = useState(32);
  const [patientGender, setPatientGender] = useState('Male');
  const [doctorName, setDoctorName] = useState('Sarah Pharmacist');

  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [prescribedItems, setPrescribedItems] = useState([
    { medicineName: 'Paracetamol 500mg', strength: '500mg', frequency: { morning: true, afternoon: true, night: true }, foodRelation: 'After food', durationDays: 7 }
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  
  const [liveWarnings, setLiveWarnings] = useState([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  const canvasRef = useRef(null);
  const checkTimeoutRef = useRef(null);
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch medicines catalog on load for dropdown selection
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get(`${API_URL}/medicine?limit=50`, config);
        if (res.data && res.data.success) {
          setAvailableMedicines(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load medicines list:', err);
      }
    };
    fetchCatalog();
  }, []);

  // Live Interaction Checker
  useEffect(() => {
    const checkLiveInteractions = async () => {
      const activeDrugs = prescribedItems
        .map(item => item.medicineName?.trim())
        .filter(name => name && name.length > 2);

      // Only check if we have 2 or more distinct drugs
      const uniqueDrugs = [...new Set(activeDrugs)];
      
      if (uniqueDrugs.length < 2) {
        setLiveWarnings([]);
        return;
      }

      setIsCheckingInteractions(true);
      try {
        const res = await axios.post(`${API_URL}/ai/check-interactions`, { drugs: uniqueDrugs }, config);
        if (res.data.success) {
          // Filter only severe warnings for the live banner to avoid annoying the doctor
          const severe = res.data.interactions.filter(ix => ix.severity?.toLowerCase() === 'severe');
          setLiveWarnings(severe);
        }
      } catch (err) {
        console.error('Failed to check live interactions:', err);
      } finally {
        setIsCheckingInteractions(false);
      }
    };

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(checkLiveInteractions, 1500); // Debounce 1.5s

    return () => clearTimeout(checkTimeoutRef.current);
  }, [prescribedItems]);

  // HTML5 Canvas signature pad listeners
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Dark blue ink
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignatureImage();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const saveSignatureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  // Manage Prescribed Item Rows
  const addMedRow = () => {
    setPrescribedItems(prev => [
      ...prev,
      { medicineName: '', strength: '', frequency: { morning: false, afternoon: false, night: false }, foodRelation: 'None', durationDays: 7 }
    ]);
  };

  const removeMedRow = (idx) => {
    setPrescribedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateMedRow = (idx, field, value) => {
    setPrescribedItems(prev => prev.map((item, i) => {
      if (i === idx) {
        if (field === 'frequency') {
          return { ...item, frequency: { ...item.frequency, ...value } };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSelectMedFromCatalog = (idx, medName) => {
    const matched = availableMedicines.find(m => m.Medicine_Name === medName);
    if (matched) {
      updateMedRow(idx, 'medicineName', matched.Medicine_Name);
      updateMedRow(idx, 'strength', matched.Strength || '');
      updateMedRow(idx, 'foodRelation', matched.BeforeFood ? 'Before food' : matched.AfterFood ? 'After food' : 'None');
      updateMedRow(idx, 'frequency', {
        morning: matched.Morning === '1',
        afternoon: matched.Afternoon === '1',
        night: matched.Night === '1'
      });
    } else {
      updateMedRow(idx, 'medicineName', medName);
    }
  };

  // Submit and download
  const handleSaveAndExport = async (e) => {
    e.preventDefault();

    if (prescribedItems.some(item => !item.medicineName)) {
      alert('Please fill out all medication names.');
      return;
    }

    try {
      // 1. Save schedules to patient calendar in backend
      for (const item of prescribedItems) {
        await axios.post(`${API_URL}/schedules/create`, {
          medicineName: item.medicineName,
          strength: item.strength,
          frequency: item.frequency,
          foodRelation: item.foodRelation,
          durationDays: item.durationDays
        }, config);
      }

      // 2. Export signed PDF
      const pdfRes = await axios.post(`${API_URL}/ai/export-signed-prescription-pdf`, {
        patientName,
        age: patientAge,
        gender: patientGender,
        doctorName,
        medicines: prescribedItems,
        signatureBase64: signatureData
      }, {
        ...config,
        responseType: 'blob'
      });

      // Stream PDF download
      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Signed-Prescription-${Date.now()}.pdf`;
      link.click();

      alert('Prescription successfully created and schedules assigned to patient calendar!');
    } catch (err) {
      console.error('Prescription generation failed:', err);
      alert('Failed to save prescription.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-primary-500 rounded-2xl flex items-center justify-center">
          <FiFileText size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Digital Prescription Writer</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Prescribe stock medications, draw clinic authorization signatures, and compile print-ready scheduling PDFs.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {liveWarnings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-slow"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-black mb-2">
              <FiAlertOctagon size={20} className="animate-bounce" />
              <span>SEVERE DRUG INTERACTION DETECTED</span>
            </div>
            <div className="space-y-2">
              {liveWarnings.map((warn, i) => (
                <div key={i} className="text-sm font-semibold text-red-700 dark:text-red-300">
                  <span className="underline decoration-red-400 decoration-2">{warn.drug1} + {warn.drug2}</span>: {warn.reason}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSaveAndExport} className="grid lg:grid-cols-3 gap-6 text-xs">
        {/* Prescription Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Patient Demographics
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Patient Display Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prescribed Items Table */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Prescription Medicines</h3>
              <button
                type="button"
                onClick={addMedRow}
                className="px-2.5 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/20 dark:text-primary-400 font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <FiPlus size={12} />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {prescribedItems.map((item, idx) => (
                <div key={idx} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-655 dark:text-slate-400 mb-1">Select Medicine from Catalog</label>
                      <select
                        onChange={(e) => handleSelectMedFromCatalog(idx, e.target.value)}
                        value={item.medicineName}
                        className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                      >
                        <option value="">Select...</option>
                        {availableMedicines.map(m => (
                          <option key={m.Medicine_ID} value={m.Medicine_Name}>{m.Medicine_Name} ({m.Stock} left)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-655 dark:text-slate-400 mb-1">Strength</label>
                      <input
                        type="text"
                        placeholder="e.g. 500mg"
                        value={item.strength}
                        onChange={(e) => updateMedRow(idx, 'strength', e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-655 dark:text-slate-400 mb-1">Food Relation</label>
                      <select
                        value={item.foodRelation}
                        onChange={(e) => updateMedRow(idx, 'foodRelation', e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                      >
                        <option value="None">None</option>
                        <option value="Before food">Before food</option>
                        <option value="After food">After food</option>
                        <option value="With food">With food</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center space-x-6">
                      <span className="font-semibold text-slate-500">Frequency:</span>
                      
                      {['morning', 'afternoon', 'night'].map(slot => (
                        <label key={slot} className="inline-flex items-center space-x-1.5 capitalize font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.frequency[slot]}
                            onChange={(e) => updateMedRow(idx, 'frequency', { [slot]: e.target.checked })}
                            className="rounded border-slate-350 text-primary-500 focus:ring-primary-500 h-3.5 w-3.5"
                          />
                          <span>{slot}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-500">Duration (Days):</span>
                        <input
                          type="number"
                          value={item.durationDays}
                          onChange={(e) => updateMedRow(idx, 'durationDays', e.target.value)}
                          className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-950 dark:border-slate-850"
                        />
                      </div>

                      {prescribedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedRow(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/10"
                        >
                          <FiTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Info & Signature Canvas */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Issuing Clinician
            </h3>

            <div>
              <label className="block font-semibold text-slate-655 dark:text-slate-400 mb-1">Doctor Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FiUser size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="pl-9 block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl"
                />
              </div>
            </div>

            {/* Signature Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-655 dark:text-slate-400 flex items-center space-x-1">
                  <FiPenTool size={12} />
                  <span>Clinician Signature Ink</span>
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] font-extrabold text-red-500 hover:underline"
                >
                  Clear Pad
                </button>
              </div>

              {/* HTML5 Signature Canvas Drawing Target */}
              <canvas
                ref={canvasRef}
                width={300}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-crosshair shadow-inner"
              />
              <p className="text-[9px] text-slate-400 italic">
                Draw signature inside the box using mouse or touch stylus pointer.
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-primary-500/10 space-x-2"
            >
              <FiDownloadCloud size={16} />
              <span>Save & Export signed PDF</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

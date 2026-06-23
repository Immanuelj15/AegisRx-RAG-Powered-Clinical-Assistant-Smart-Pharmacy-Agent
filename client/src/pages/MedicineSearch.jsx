import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  FiSearch, 
  FiInfo, 
  FiXCircle, 
  FiCheckCircle, 
  FiAlertCircle,
  FiExternalLink,
  FiPlusCircle,
  FiMinusCircle,
  FiShield
} from 'react-icons/fi';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export const MedicineSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [alternativeMed, setAlternativeMed] = useState(null);

  // DDI checker state
  const [ddiList, setDdiList] = useState([]);
  const [ddiResults, setDdiResults] = useState(null);
  const [ddiLoading, setDdiLoading] = useState(false);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/medicine?limit=50`, config);
      if (res.data && res.data.success) {
        setAllMedicines(res.data.data);
        setResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(allMedicines);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/medicine/search?query=${query}`, config);
      
      if (res.data && res.data.success) {
        if (res.data.found && res.data.medicine) {
          setResults([res.data.medicine]);
          if (res.data.alternatives && res.data.alternatives.length > 0) {
            setAlternativeMed(res.data.alternatives[0]);
          } else {
            setAlternativeMed(null);
          }
        } else {
          setResults([]);
          setAlternativeMed(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openMedDetails = (med) => {
    setSelectedMed(med);
    if (med.Stock === 0 && med.Alternative) {
      const foundAlt = allMedicines.find(m => 
        m.Medicine_Name.toLowerCase().includes(med.Alternative.toLowerCase()) ||
        m.Brand.toLowerCase().includes(med.Alternative.toLowerCase())
      );
      setAlternativeMed(foundAlt || { Medicine_Name: med.Alternative, Note: 'Generic recommendation.' });
    } else {
      setAlternativeMed(null);
    }
  };

  // Allergy warning helper check
  const checkAllergyAlert = (med) => {
    if (!user || !user.medicalHistory) return null;
    const historyLower = user.medicalHistory.toLowerCase();
    
    // Allergen keywords
    const allergens = ['penicillin', 'sulfa', 'aspirin', 'nsaid', 'ibuprofen', 'amoxicillin', 'paracetamol'];
    
    for (const key of allergens) {
      if (historyLower.includes(key)) {
        const nameLower = med.Medicine_Name.toLowerCase();
        const genericLower = (med.Generic_Name || '').toLowerCase();
        const categoryLower = (med.Category || '').toLowerCase();
        const warningsLower = (med.Warnings || '').toLowerCase();

        if (
          nameLower.includes(key) || 
          genericLower.includes(key) || 
          (key === 'nsaid' && categoryLower.includes('nsaid')) ||
          (key === 'nsaid' && nameLower.includes('ibuprofen'))
        ) {
          return key.toUpperCase();
        }
      }
    }
    return null;
  };

  // Add/Remove from DDI interaction checker list
  const toggleDdiListItem = (med) => {
    setDdiResults(null);
    if (ddiList.some(item => item.Medicine_Name === med.Medicine_Name)) {
      setDdiList(prev => prev.filter(item => item.Medicine_Name !== med.Medicine_Name));
    } else {
      if (ddiList.length >= 4) {
        alert('You can check up to 4 medicines at a time.');
        return;
      }
      setDdiList(prev => [...prev, med]);
    }
  };

  const checkDdiInteractions = async () => {
    if (ddiList.length < 2) return;
    try {
      setDdiLoading(true);
      const res = await axios.post(`${API_URL}/medicine/interaction-check`, {
        medicines: ddiList.map(item => item.Medicine_Name)
      }, config);
      
      if (res.data && res.data.success) {
        setDdiResults(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Interaction check failed.');
    } finally {
      setDdiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input bar */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <FiSearch size={18} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type medicine name or use case, e.g., 'Paracetamol 500mg' or 'Fever'..."
            className="pl-10 block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-slate-100 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md transition-colors"
        >
          Search
        </button>
      </form>

      {/* DDI Checker Floating Bar */}
      <AnimatePresence>
        {ddiList.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
          >
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <FiShield className="text-primary-500" />
                <span>Drug-Drug Interaction Checker ({ddiList.length}/4)</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {ddiList.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-150 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl font-bold flex items-center space-x-1">
                    <span>{item.Medicine_Name}</span>
                    <button onClick={() => toggleDdiListItem(item)} className="text-red-500 hover:text-red-700">✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setDdiList([]); setDdiResults(null); }}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-500 rounded-xl font-bold"
              >
                Clear
              </button>
              <button
                onClick={checkDdiInteractions}
                disabled={ddiList.length < 2 || ddiLoading}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl font-bold shadow-md transition-colors"
              >
                {ddiLoading ? 'Checking...' : 'Check Safety'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DDI Results Section */}
      <AnimatePresence>
        {ddiResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`p-5 rounded-2xl border text-xs space-y-3 ${
              ddiResults.hasInteractions 
                ? 'bg-red-50 border-red-200 dark:bg-red-950/15 dark:border-red-900/35' 
                : 'bg-teal-50 border-teal-200 dark:bg-teal-950/15 dark:border-teal-900/35'
            }`}
          >
            <h4 className={`font-extrabold text-sm flex items-center space-x-1.5 ${
              ddiResults.hasInteractions ? 'text-red-700 dark:text-red-400' : 'text-teal-700 dark:text-teal-400'
            }`}>
              {ddiResults.hasInteractions ? (
                <>
                  <FiAlertCircle />
                  <span>Interaction Alerts Detected</span>
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  <span>No Interactions Detected</span>
                </>
              )}
            </h4>
            
            {ddiResults.hasInteractions ? (
              <div className="space-y-3">
                {ddiResults.warnings.map((warn, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-red-200/50 dark:border-red-950/40 rounded-xl space-y-1">
                    <p className="font-extrabold text-red-650 dark:text-red-400">
                      [{warn.severity}] {warn.drugA} + {warn.drugB}
                    </p>
                    <p className="text-slate-600 dark:text-slate-350 leading-relaxed">{warn.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-teal-650 dark:text-teal-350">
                All selected drugs are safe to take together based on the active local hospital interaction matrices.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid listing medicines */}
      {loading ? (
        <Loader size="large" />
      ) : (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-705 dark:text-slate-400 text-xs uppercase tracking-wider">
            Search Results ({results.length})
          </h3>

          {results.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FiXCircle className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
              <p className="font-bold text-slate-700 dark:text-slate-300">No matching medicines found in catalog.</p>
              <p className="text-xs text-slate-450 mt-1">Try querying using our smart AI Chat which accesses advanced medical context.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((med, idx) => {
                const allergyMatch = checkAllergyAlert(med);
                const inDdiList = ddiList.some(item => item.Medicine_Name === med.Medicine_Name);

                return (
                  <div
                    key={idx}
                    className={`glass-card p-5 cursor-pointer flex flex-col justify-between hover:border-primary-300 dark:hover:border-teal-500 relative ${
                      allergyMatch ? 'border-red-200 dark:border-red-950 bg-red-50/10' : ''
                    }`}
                  >
                    <div className="space-y-2" onClick={() => openMedDetails(med)}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          med.Stock > 0 ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {med.Stock > 0 ? `${med.Stock} units` : 'Out of Stock'}
                        </span>
                        
                        {allergyMatch && (
                          <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                            Allergy Risk: {allergyMatch}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight">
                        {med.Medicine_Name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">Brand: {med.Brand} | Generic: {med.Generic_Name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{med.Use_Case}</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-800 dark:text-slate-200 text-sm">${med.Price?.toFixed(2)}</span>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleDdiListItem(med); }}
                          className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                            inDdiList 
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25' 
                              : 'text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/25'
                          }`}
                          title={inDdiList ? "Remove from DDI Check" : "Add to DDI Check"}
                        >
                          {inDdiList ? <FiMinusCircle size={16} /> : <FiPlusCircle size={16} />}
                        </button>
                      </div>

                      <button 
                        onClick={() => openMedDetails(med)}
                        className="text-xs font-bold text-primary-500 inline-flex items-center space-x-1 hover:underline"
                      >
                        <span>View Details</span>
                        <FiInfo size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Medicine Detail Modal */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800 text-xs">
            {/* Header info */}
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100">{selectedMed.Medicine_Name}</h3>
                <p className="text-xs text-slate-400">Category: {selectedMed.Category} | ID: {selectedMed.Medicine_ID}</p>
              </div>
              <button
                onClick={() => setSelectedMed(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-4 leading-relaxed">
              {checkAllergyAlert(selectedMed) && (
                <div className="p-3.5 bg-red-600 text-white rounded-xl font-bold flex items-start space-x-2 shadow-md">
                  <FiAlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="uppercase text-[10px] tracking-wider">CRITICAL ALLERGY CONFLICT BLOCKED</p>
                    <p className="font-medium mt-0.5">This medication matches the allergy profile in your clinical settings. Purchasing or dispensing is blocked.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-bold">Generic Name</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedMed.Generic_Name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">Brand Name</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedMed.Brand || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold">Primary Use Case</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedMed.Use_Case || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                <div>
                  <p className="text-slate-400 font-bold">In-Stock</p>
                  <p className={`font-black ${selectedMed.Stock > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {selectedMed.Stock} units
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">Price</p>
                  <p className="text-slate-800 dark:text-slate-200 font-black">${selectedMed.Price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">Strength</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{selectedMed.Strength || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold">Dosage Instruction</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedMed.Dosage || 'N/A'}</p>
              </div>

              {selectedMed.Warnings && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl space-y-1">
                  <p className="text-red-700 dark:text-red-400 font-extrabold flex items-center space-x-1">
                    <FiAlertCircle size={14} />
                    <span>Safety Warnings & Contraindications</span>
                  </p>
                  <p className="text-red-650 dark:text-red-300 leading-normal">{selectedMed.Warnings}</p>
                </div>
              )}

              {selectedMed.SideEffects && (
                <div>
                  <p className="text-slate-400 font-bold">Potential Side Effects</p>
                  <p className="text-slate-700 dark:text-slate-350">{selectedMed.SideEffects}</p>
                </div>
              )}

              {/* Alternative details if out of stock */}
              {selectedMed.Stock === 0 && selectedMed.Alternative && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/40 rounded-xl space-y-3">
                  <div>
                    <h4 className="font-extrabold text-teal-800 dark:text-teal-400 text-sm">🔄 Alternative Substitute Available</h4>
                    <p className="text-[10px] text-slate-400">The requested medicine is out of stock. We recommend:</p>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-teal-100 dark:border-teal-900/50">
                    <div>
                      <p className="font-extrabold text-teal-700 dark:text-teal-300">{alternativeMed?.Medicine_Name || selectedMed.Alternative}</p>
                      <p className="text-[9px] text-slate-450">Stock: {alternativeMed?.Stock ?? 'N/A'} units | Price: ${alternativeMed?.Price?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                    {alternativeMed?._id && (
                      <button
                        onClick={() => openMedDetails(alternativeMed)}
                        className="text-[10px] text-primary-500 font-bold underline flex items-center space-x-0.5"
                      >
                        <span>View</span>
                        <FiExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

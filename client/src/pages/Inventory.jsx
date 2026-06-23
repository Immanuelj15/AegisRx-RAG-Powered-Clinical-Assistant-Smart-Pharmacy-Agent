import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiEdit3, 
  FiTrash2, 
  FiPlus, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle,
  FiDownload,
  FiShield
} from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // FDA Recall Safety Audit state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditMed, setAuditMed] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Form states for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formMed, setFormMed] = useState({
    Medicine_ID: '',
    Medicine_Name: '',
    Brand: '',
    Generic_Name: '',
    Strength: '',
    Use_Case: '',
    Alternative: '',
    Stock: 0,
    Price: 0.0,
    Category: '',
    Dosage: '',
    Warnings: '',
    SideEffects: '',
    Morning: '1',
    Afternoon: '0',
    Night: '1',
    BeforeFood: false,
    AfterFood: true
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/medicine?limit=100`);
      if (res.data && res.data.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormMed(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormMed({
      Medicine_ID: `MED${Date.now().toString().slice(-4)}`,
      Medicine_Name: '',
      Brand: '',
      Generic_Name: '',
      Strength: '',
      Use_Case: '',
      Alternative: '',
      Stock: 50,
      Price: 5.00,
      Category: 'Analgesics',
      Dosage: '1 tablet twice daily',
      Warnings: '',
      SideEffects: '',
      Morning: '1',
      Afternoon: '0',
      Night: '1',
      BeforeFood: false,
      AfterFood: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med) => {
    setIsEditMode(true);
    setFormMed({ ...med });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      if (isEditMode) {
        const res = await axios.put(`${API_URL}/medicine/update`, formMed);
        if (res.data && res.data.success) {
          setMessage('Medicine updated successfully and synced with RAG database!');
        }
      } else {
        // Since POST /upload handles CSV, we can mock direct addition by utilizing PUT /update with upsert
        const res = await axios.put(`${API_URL}/medicine/update`, formMed);
        if (res.data && res.data.success) {
          setMessage('New medicine added and indexed into ChromaDB!');
        }
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || 'Operation failed.');
    }
  };

  const handleDelete = async (medId) => {
    if (!window.confirm(`Are you sure you want to delete medicine with ID: ${medId}?`)) return;
    
    setMessage('');
    setIsError(false);
    
    try {
      const res = await axios.delete(`${API_URL}/medicine/delete`, {
        data: { Medicine_ID: medId }
      });
      if (res.data && res.data.success) {
        setMessage(res.data.message);
        fetchInventory();
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || 'Deletion failed.');
    }
  };

  const handleDownloadPO = async () => {
    try {
      setLoading(true);
      setMessage('');
      setIsError(false);
      const res = await axios.post(`${API_URL}/ai/export-po-pdf`, {}, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Procurement_PO_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage('Procurement PO PDF generated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage('Failed to generate procurement PO PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunFdaAudit = async (med) => {
    setAuditMed(med);
    setAuditResult(null);
    setShowAuditModal(true);
    setAuditLoading(true);
    try {
      const res = await axios.get(`${API_URL}/ai/fda-audit/${encodeURIComponent(med.Medicine_Name)}`);
      if (res.data && res.data.success) {
        setAuditResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control panel */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <FiPlus size={14} />
            <span>Add New Product</span>
          </button>
          <button
            onClick={handleDownloadPO}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <FiDownload size={14} />
            <span>Draft PO PDF</span>
          </button>
        </div>

        <button
          onClick={fetchInventory}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
          title="Refresh List"
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
          isError 
            ? 'bg-red-50 text-red-650 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/35' 
            : 'bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/35'
        }`}>
          {isError ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
          <span>{message}</span>
        </div>
      )}

      {/* Main product spreadsheet */}
      {loading ? (
        <Loader size="large" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
                  <th className="p-4 font-extrabold uppercase">Code</th>
                  <th className="p-4 font-extrabold uppercase">Medicine Name</th>
                  <th className="p-4 font-extrabold uppercase">Category</th>
                  <th className="p-4 font-extrabold uppercase">Brand</th>
                  <th className="p-4 font-extrabold uppercase text-center">Stock</th>
                  <th className="p-4 font-extrabold uppercase text-right">Price</th>
                  <th className="p-4 font-extrabold uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {medicines.map((med) => (
                  <tr key={med._id || med.Medicine_ID} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4 font-bold text-slate-500">{med.Medicine_ID}</td>
                    <td className="p-4">
                      <p className="font-extrabold text-slate-800 dark:text-slate-150">{med.Medicine_Name}</p>
                      <p className="text-[10px] text-slate-400">Generic: {med.Generic_Name}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-350 font-medium">{med.Category}</td>
                    <td className="p-4 text-slate-500">{med.Brand}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                        med.Stock <= 0
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200/50 dark:border-red-900/30'
                          : med.Stock < 10
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-250 dark:border-rose-900/30 animate-pulse'
                          : 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'
                      }`}>
                        {med.Stock <= 0 ? 'Out of Stock' : med.Stock < 10 ? `Low: ${med.Stock} units` : `${med.Stock} units`}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800 dark:text-slate-200">${med.Price?.toFixed(2)}</td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                        title="Edit Details"
                      >
                        <FiEdit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(med.Medicine_ID)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        title="Delete Product"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleRunFdaAudit(med)}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"
                        title="FDA Recall Audit"
                      >
                        <FiShield size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {isEditMode ? 'Update Medicine Details' : 'Add New Clinical Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Med ID Code</label>
                  <input
                    type="text"
                    name="Medicine_ID"
                    required
                    disabled={isEditMode}
                    value={formMed.Medicine_ID}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    name="Category"
                    required
                    value={formMed.Category}
                    onChange={handleInputChange}
                    placeholder="e.g. Antibiotics"
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Medicine Name & Strength</label>
                <input
                  type="text"
                  name="Medicine_Name"
                  required
                  value={formMed.Medicine_Name}
                  onChange={handleInputChange}
                  placeholder="e.g. Paracetamol 500mg"
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Generic Chemical</label>
                  <input
                    type="text"
                    name="Generic_Name"
                    value={formMed.Generic_Name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Brand Name</label>
                  <input
                    type="text"
                    name="Brand"
                    value={formMed.Brand}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Stock Level</label>
                  <input
                    type="number"
                    name="Stock"
                    required
                    value={formMed.Stock}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="Price"
                    required
                    value={formMed.Price}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Strength</label>
                  <input
                    type="text"
                    name="Strength"
                    value={formMed.Strength}
                    onChange={handleInputChange}
                    placeholder="e.g. 500mg"
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Alternative Substitutes</label>
                <input
                  type="text"
                  name="Alternative"
                  value={formMed.Alternative}
                  onChange={handleInputChange}
                  placeholder="Recommended substitute if out of stock"
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Intake Dosage Directions</label>
                <input
                  type="text"
                  name="Dosage"
                  value={formMed.Dosage}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Clinical Use Cases</label>
                  <textarea
                    rows={2}
                    name="Use_Case"
                    value={formMed.Use_Case}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl leading-normal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Warnings / Cautions</label>
                  <textarea
                    rows={2}
                    name="Warnings"
                    value={formMed.Warnings}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl leading-normal"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-md shadow-primary-500/10"
              >
                Save Clinical Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FDA Recall Audit Modal */}
      {showAuditModal && auditMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-card p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                FDA Safety Recall Audit Report
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-slate-400 font-bold">Audit Item</p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                  {auditMed.Medicine_Name} (ID: {auditMed.Medicine_ID})
                </p>
                <p className="text-[10px] text-slate-450 mt-0.5">Generic: {auditMed.Generic_Name}</p>
              </div>

              {auditLoading ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-500 animate-pulse">
                  Connecting to openFDA live database API...
                </div>
              ) : auditResult ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border flex items-start space-x-2.5 ${
                    auditResult.isRecalled 
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/35' 
                      : 'bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-900/35'
                  }`}>
                    <div className="mt-0.5">
                      {auditResult.isRecalled ? (
                        <span className="text-red-500">❌</span>
                      ) : (
                        <span className="text-emerald-500">✅</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        {auditResult.isRecalled ? 'RECALL WARNING TRIGGERED' : 'SAFETY VERIFICATION PASSED'}
                      </p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed">
                        {auditResult.isRecalled 
                          ? `This product description has active enforcement matches in the FDA recalls database. Batch safety actions are ongoing.` 
                          : `No active Class I, Class II, or Class III recalls are logged in the openFDA database matching this product description.`}
                      </p>
                    </div>
                  </div>

                  {auditResult.isRecalled && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <p className="font-bold text-red-650 dark:text-red-400 text-xs">Recall Batch Details:</p>
                      {auditResult.recalls.map((rec, i) => (
                        <div key={i} className="space-y-1 text-[10px] border-t border-slate-100 dark:border-slate-850 pt-2 first:border-0 first:pt-0 text-slate-650 dark:text-slate-405 leading-relaxed">
                          <p><span className="font-bold text-slate-450 dark:text-slate-500">Firm:</span> {rec.recallingFirm}</p>
                          <p><span className="font-bold text-slate-450 dark:text-slate-500">FDA Reason:</span> {rec.reason}</p>
                          <p><span className="font-bold text-slate-450 dark:text-slate-500">Classification:</span> {rec.classification} ({rec.voluntaryMandated})</p>
                          <p><span className="font-bold text-slate-450 dark:text-slate-500">Report Date:</span> {rec.reportDate} | Number: {rec.recallNumber}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all mt-2"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

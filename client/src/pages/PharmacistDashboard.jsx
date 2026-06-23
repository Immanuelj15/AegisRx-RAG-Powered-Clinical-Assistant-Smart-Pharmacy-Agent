import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiUpload, 
  FiAlertTriangle, 
  FiFileText, 
  FiActivity, 
  FiPackage,
  FiTrendingUp,
  FiExternalLink
} from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const PharmacistDashboard = () => {
  const [stats, setStats] = useState(null);
  const [outOfStock, setOutOfStock] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchStats = async () => {
    try {
      const statsRes = await axios.get(`${API_URL}/dashboard/stats`);
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      const inventoryRes = await axios.get(`${API_URL}/medicine?limit=100`);
      if (inventoryRes.data && inventoryRes.data.success) {
        // filter out-of-stock
        const oos = inventoryRes.data.data.filter(m => m.Stock === 0);
        setOutOfStock(oos);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err.message);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('');
    setIsError(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/medicine/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data && res.data.success) {
        setUploadMessage(`Success: ${res.data.message}`);
        fetchStats(); // Reload metrics
      }
    } catch (err) {
      setIsError(true);
      setUploadMessage(err.response?.data?.error || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-blue-100 dark:bg-blue-950/30 text-primary-500 rounded-2xl">
            <FiPackage size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Medicines</p>
            <p className="text-2xl font-black mt-0.5 text-slate-800 dark:text-slate-100">
              {stats ? stats.totalMedicines : <span className="animate-pulse">...</span>}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-2xl">
            <FiAlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Out of Stock</p>
            <p className="text-2xl font-black mt-0.5 text-red-600 dark:text-red-400">
              {stats ? stats.outOfStockCount : <span className="animate-pulse">...</span>}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded-2xl">
            <FiActivity size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Search Queries</p>
            <p className="text-2xl font-black mt-0.5 text-slate-800 dark:text-slate-100">
              {stats ? stats.totalSearches : <span className="animate-pulse">...</span>}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-purple-100 dark:bg-purple-950/30 text-purple-600 rounded-2xl">
            <FiTrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">In Stock Count</p>
            <p className="text-2xl font-black mt-0.5 text-slate-800 dark:text-slate-100">
              {stats ? stats.inStockCount : <span className="animate-pulse">...</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CSV Upload Portal */}
        <div className="glass-card p-6 flex flex-col justify-between lg:col-span-1 h-[270px]">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Seed Medicine Inventory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Upload a `.csv` sheet containing standard columns (Medicine_ID, Medicine_Name, Price, Stock, Category, Alternative, etc.) to ingest catalog items.
            </p>
          </div>

          <div className="mt-4">
            <label className={`w-full flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
              uploading ? 'bg-slate-50 dark:bg-slate-800 border-primary-500' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-300 dark:border-slate-800 dark:hover:bg-slate-900'
            }`}>
              {uploading ? (
                <div className="text-center">
                  <Loader size="small" />
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 block">Seeding RAG vector store...</span>
                </div>
              ) : (
                <div className="text-center p-3">
                  <FiUpload className="mx-auto text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-extrabold text-primary-500">Choose CSV File</span>
                  <span className="text-[10px] text-slate-400 block mt-1">drag & drop here</span>
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {uploadMessage && (
            <p className={`text-[11px] font-bold mt-3 text-center ${isError ? 'text-red-500' : 'text-teal-600'}`}>
              {uploadMessage}
            </p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6 lg:col-span-2 h-[270px] flex flex-col">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <FiAlertTriangle className="text-red-500" size={18} />
            <span>Critical Low Stock Alerts</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Out-of-stock items that need restocking or generic recommendations.</p>

          <div className="mt-4 overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {outOfStock.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No medicines are currently out of stock. Good job!</p>
            ) : (
              outOfStock.map((med, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 text-xs bg-slate-50/20 dark:bg-slate-900/10">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{med.Medicine_Name}</p>
                    <p className="text-[10px] text-slate-400">Generic: {med.Generic_Name} | Category: {med.Category}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold rounded text-[10px]">OUT OF STOCK</span>
                    <Link
                      to={`/chat?query=Suggest alternative for out of stock ${med.Medicine_Name}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary-500 flex items-center space-x-1 font-bold"
                      title="Trigger AI Alternative Guide"
                    >
                      <span className="text-[10px]">Alternative</span>
                      <FiExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Prescription Uplod Shortcuts */}
      <div className="p-6 bg-slate-100/50 dark:bg-slate-900/30 rounded-card flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-200/40 dark:border-slate-800/30">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded-xl">
            <FiFileText size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Patient Prescription Scheduler</h4>
            <p className="text-xs text-slate-400">Upload hand-written patient charts to output automated dosages.</p>
          </div>
        </div>
        <Link
          to="/prescription"
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          Open Prescription Panel
        </Link>
      </div>
    </div>
  );
};

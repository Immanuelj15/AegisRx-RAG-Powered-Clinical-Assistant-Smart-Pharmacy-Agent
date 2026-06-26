import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FiUsers, 
  FiPlus, 
  FiDatabase, 
  FiRefreshCw, 
  FiShield,
  FiFileText,
  FiCpu
} from 'react-icons/fi';
import { Loader } from '../components/Loader';

export const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Register manual user modal
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Pharmacist',
    phone: '',
    age: '',
    gender: ''
  });

  const [filterType, setFilterType] = useState('All');
  
  // Add medicine modal
  const [showMedModal, setShowMedModal] = useState(false);
  const [newMed, setNewMed] = useState({
    Medicine_Name: '',
    Brand: '',
    Stock: 0,
    Price: 0,
    Category: 'General'
  });

  const fetchUsers = async () => {
    // SECURITY CHECK: If admin is not unlocked via the master password, kick them out
    if (sessionStorage.getItem('admin_unlocked') !== 'true') {
      navigate('/admin');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await axios.get(`${API_URL}/auth/users`, config);
      if (res.data && res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/register`, newUser);
      if (res.data && res.data.success) {
        setShowModal(false);
        // Refresh list
        setUsers(prev => [
          ...prev, 
          { 
            id: `usr_${Date.now()}`,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone
          }
        ]);
        alert('Account created successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleMedInputChange = (e) => {
    const { name, value } = e.target;
    setNewMed(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitMed = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.post(`${API_URL}/medicine/add`, newMed, config);
      if (res.data && res.data.success) {
        setShowMedModal(false);
        setNewMed({ Medicine_Name: '', Brand: '', Stock: 0, Price: 0, Category: 'General' });
        alert('Medicine added successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add medicine.');
    }
  };

  const filteredUsers = users.filter(usr => {
    if (filterType === 'All') return true;
    if (filterType === 'Today') {
      if (!usr.lastLogin) return false;
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      return new Date(usr.lastLogin) >= yesterday;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Utility controllers bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex gap-3">
          <button
            onClick={() => { setShowModal(true); setNewUser(prev => ({ ...prev, role: 'Patient' })); }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <FiPlus size={14} />
            <span>Add User</span>
          </button>

          <button
            onClick={() => { setShowModal(true); setNewUser(prev => ({ ...prev, role: 'Pharmacist' })); }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <FiPlus size={14} />
            <span>Add Pharmacist</span>
          </button>

          <button
            onClick={() => setShowMedModal(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <FiPlus size={14} />
            <span>Add Medicine</span>
          </button>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
          title="Reload Directory"
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User directory lists */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <FiUsers className="text-primary-500" size={18} />
              <span>Hospital User Directory</span>
            </h3>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Users</option>
              <option value="Today">Today's Visits</option>
            </select>
          </div>
          <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <Loader size="small" />
            ) : (
              filteredUsers.map((usr) => (
                <div key={usr.id} className="flex justify-between items-center p-3.5 text-xs hover:bg-slate-50/25 dark:hover:bg-slate-900/35">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-150">{usr.name}</p>
                    <p className="text-[10px] text-slate-400">Email: {usr.email} | Phone: {usr.phone || 'N/A'}</p>
                    {usr.lastLogin && (
                      <p className="text-[9px] text-slate-400 mt-0.5">Last Visit: {new Date(usr.lastLogin).toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                    usr.role === 'Admin' ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-450' :
                    usr.role === 'Pharmacist' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/20 dark:text-teal-450' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450'
                  }`}>
                    {usr.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security configuration policies */}
        <div className="glass-card p-6 h-[400px] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <FiShield className="text-teal-600" size={18} />
              <span>Security Policies</span>
            </h3>
            
            <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-450 font-medium">
              <div className="flex items-start space-x-2">
                <FiShield size={14} className="text-teal-500 mt-0.5" />
                <span>**JWT Verification**: Signatures are encrypted using HS256 password hashing. Expired tokens auto-logout.</span>
              </div>
              <div className="flex items-start space-x-2">
                <FiShield size={14} className="text-teal-500 mt-0.5" />
                <span>**Role Safeguards**: CRUD operations (Inventory upload, deletes) validate permission claims explicitly.</span>
              </div>
              <div className="flex items-start space-x-2">
                <FiShield size={14} className="text-teal-500 mt-0.5" />
                <span>**Helmet Headers**: Standard Cross-Origin headers are applied at the server gateway.</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-[10px] space-y-2">
            <p className="font-extrabold uppercase text-slate-400">Gateway Status</p>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-350">
              <p>• CORS Policy: <span className="text-teal-500 font-bold">Enabled</span></p>
              <p>• Rate Limit: <span className="text-teal-500 font-bold">100 req/15m</span></p>
              <p>• DB Engine: <span className="text-teal-500 font-bold">MongoDB Atlas</span></p>
              <p>• Vector Index: <span className="text-teal-500 font-bold">ChromaDB</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual provision account dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-card p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                Provision Clinical User
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="text-[10px] font-bold text-red-500 mb-3 text-center">{error}</p>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={newUser.name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Select Role</label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Admin">Hospital Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={newUser.phone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Initial Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={newUser.password}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-md shadow-primary-500/10"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual provision medicine dialog */}
      {showMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-card p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                Add New Medicine
              </h3>
              <button
                onClick={() => setShowMedModal(false)}
                className="p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="text-[10px] font-bold text-red-500 mb-3 text-center">{error}</p>
            )}

            <form onSubmit={handleSubmitMed} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Medicine Name</label>
                <input
                  type="text"
                  name="Medicine_Name"
                  required
                  value={newMed.Medicine_Name}
                  onChange={handleMedInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  name="Brand"
                  value={newMed.Brand}
                  onChange={handleMedInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Stock Amount</label>
                  <input
                    type="number"
                    name="Stock"
                    min="0"
                    value={newMed.Stock}
                    onChange={handleMedInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    name="Price"
                    step="0.01"
                    min="0"
                    value={newMed.Price}
                    onChange={handleMedInputChange}
                    className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-400 mb-1">Category</label>
                <select
                  name="Category"
                  value={newMed.Category}
                  onChange={handleMedInputChange}
                  className="block w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  <option value="General">General</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Psychiatric">Psychiatric</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-500/10"
              >
                Add Medicine
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

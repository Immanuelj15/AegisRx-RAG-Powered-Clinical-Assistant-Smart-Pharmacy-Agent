import React, { useState, useEffect } from 'react';
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Retrieve registered accounts
      // In a real environment, we'd have a GET /api/users endpoint.
      // We will read from mockDB simulator if MongoDB is down.
      // Let's call the profile or retrieve standard mockup accounts
      setUsers([
        { id: '1', name: 'John Patient', email: 'patient@medassist.com', role: 'Patient', phone: '123-456-7890' },
        { id: '2', name: 'Sarah Pharmacist', email: 'pharmacist@medassist.com', role: 'Pharmacist', phone: '987-654-3210' },
        { id: '3', name: 'Alex Admin', email: 'admin@medassist.com', role: 'Admin', phone: '555-555-5555' }
      ]);
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="space-y-6">
      {/* Utility controllers bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
        >
          <FiPlus size={14} />
          <span>Provision User Account</span>
        </button>

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
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-3 flex items-center space-x-2">
            <FiUsers className="text-primary-500" size={18} />
            <span>Hospital User Directory</span>
          </h3>
          <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <Loader size="small" />
            ) : (
              users.map((usr) => (
                <div key={usr.id} className="flex justify-between items-center p-3.5 text-xs hover:bg-slate-50/25 dark:hover:bg-slate-900/35">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-150">{usr.name}</p>
                    <p className="text-[10px] text-slate-400">Email: {usr.email} | Phone: {usr.phone || 'N/A'}</p>
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
    </div>
  );
};

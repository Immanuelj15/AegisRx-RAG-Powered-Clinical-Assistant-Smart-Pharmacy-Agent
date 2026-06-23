import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiGrid, FiSearch, FiMessageSquare, FiUploadCloud, FiUsers, 
  FiLayers, FiFileText, FiX, FiCalendar, FiActivity, FiHeart, FiSliders,
  FiLogOut
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/dashboard/admin';
    if (user.role === 'Pharmacist') return '/dashboard/pharmacist';
    return '/dashboard/patient';
  };

  const menuGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: getDashboardPath(), icon: <FiGrid size={18} />, roles: ['Patient','Pharmacist','Admin'] },
        { name: 'Medicine Search', path: '/search', icon: <FiSearch size={18} />, roles: ['Patient','Pharmacist','Admin'] },
        { name: 'AI Medical Chat', path: '/chat', icon: <FiMessageSquare size={18} />, roles: ['Patient','Pharmacist','Admin'] },
      ]
    },
    {
      label: 'Clinical Tools',
      items: [
        { name: 'Symptom Checker', path: '/symptom-checker', icon: <FiActivity size={18} />, roles: ['Patient','Pharmacist','Admin'], badge: 'AI' },
        { name: 'Dosage Calculator', path: '/dosage-calc', icon: <FiSliders size={18} />, roles: ['Patient','Pharmacist','Admin'], badge: 'AI' },
        { name: 'Health Report', path: '/health-report', icon: <FiHeart size={18} />, roles: ['Patient','Pharmacist','Admin'], badge: 'PDF' },
        { name: 'Prescription Upload', path: '/prescription', icon: <FiUploadCloud size={18} />, roles: ['Patient','Pharmacist','Admin'] },
        { name: 'Pill Calendar', path: '/calendar', icon: <FiCalendar size={18} />, roles: ['Patient','Pharmacist','Admin'] },
      ]
    },
    {
      label: 'Pharmacy',
      items: [
        { name: 'Prescription Writer', path: '/prescription-writer', icon: <FiFileText size={18} />, roles: ['Pharmacist','Admin'] },
        { name: 'System Inventory', path: '/inventory', icon: <FiLayers size={18} />, roles: ['Pharmacist','Admin'] },
      ]
    },
    {
      label: 'Account',
      items: [
        { name: 'Admin Panel', path: '/admin', icon: <FiUsers size={18} />, roles: ['Admin'] },
        { name: 'Update Profile', path: '/profile', icon: <FiFileText size={18} />, roles: ['Patient','Pharmacist','Admin'] },
      ]
    }
  ];

  const badgeStyle = {
    AI:  'bg-gradient-to-r from-blue-500 to-teal-500 text-white',
    PDF: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>

        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/60 dark:border-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-black text-base shadow-lg shadow-primary-500/30">
              A
            </div>
            <div>
              <span className="font-black text-lg gradient-text tracking-tight">AegisRx</span>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase -mt-0.5">Clinical AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* User mini-card */}
        {user && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-br from-primary-50 to-teal-50 dark:from-primary-950/30 dark:to-teal-950/20 border border-primary-100 dark:border-primary-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-400 flex items-center justify-center font-black text-sm text-white flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {menuGroups.map(group => {
            const visible = group.items.filter(item => user && item.roles.includes(user.role));
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-4 mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visible.map((item, idx) => (
                    <NavLink
                      key={idx}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                        }`
                      }
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 leading-none">{item.name}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${badgeStyle[item.badge]}`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/40">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all"
          >
            <FiLogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden" />
      )}
    </>
  );
};

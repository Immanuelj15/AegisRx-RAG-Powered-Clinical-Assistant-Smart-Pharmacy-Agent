import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiGrid, 
  FiSearch, 
  FiMessageSquare, 
  FiUploadCloud, 
  FiUsers, 
  FiLayers, 
  FiFileText,
  FiX,
  FiCalendar
} from 'react-icons/fi';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/dashboard/admin';
    if (user.role === 'Pharmacist') return '/dashboard/pharmacist';
    return '/dashboard/patient';
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: getDashboardPath(),
      icon: <FiGrid size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    },
    {
      name: 'Medicine Search',
      path: '/search',
      icon: <FiSearch size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    },
    {
      name: 'AI Medical Chat',
      path: '/chat',
      icon: <FiMessageSquare size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    },
    {
      name: 'Prescription Upload',
      path: '/prescription',
      icon: <FiUploadCloud size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    },
    {
      name: 'Pill Calendar',
      path: '/calendar',
      icon: <FiCalendar size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    },
    {
      name: 'Prescription Writer',
      path: '/prescription-writer',
      icon: <FiFileText size={18} />,
      roles: ['Pharmacist', 'Admin']
    },
    {
      name: 'System Inventory',
      path: '/inventory',
      icon: <FiLayers size={18} />,
      roles: ['Pharmacist', 'Admin']
    },
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: <FiUsers size={18} />,
      roles: ['Admin']
    },
    {
      name: 'Update Profile',
      path: '/profile',
      icon: <FiFileText size={18} />,
      roles: ['Patient', 'Pharmacist', 'Admin']
    }
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  const linkClass = ({ isActive }) => 
    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
      isActive 
        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-secondary-400'
    }`;

  return (
    <>
      {/* Sidebar Drawer container */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              AegisRx
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {filteredItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              onClick={onClose}
              className={linkClass}
            >
              {item.icon}
              <span className="text-sm font-semibold">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        ></div>
      )}
    </>
  );
};

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { PatientDashboard } from './pages/PatientDashboard';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MedicineSearch } from './pages/MedicineSearch';
import { AiChat } from './pages/AiChat';
import { PrescriptionUpload } from './pages/PrescriptionUpload';
import { Inventory } from './pages/Inventory';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';
import { PillCalendar } from './pages/PillCalendar';
import { PrescriptionWriter } from './pages/PrescriptionWriter';
import { NotFound } from './pages/NotFound';
import { SymptomChecker } from './pages/SymptomChecker';
import { HealthReport } from './pages/HealthReport';
import { DosageCalculator } from './pages/DosageCalculator';
import { InteractionMatrix } from './pages/InteractionMatrix';
import { DietPlanner } from './pages/DietPlanner';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />

            {/* Auth Layout Portal */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Secure Dashboard Portal */}
            <Route element={<DashboardLayout />}>
              {/* Role Dashboards */}
              <Route path="/dashboard/patient" element={<PatientDashboard />} />
              <Route path="/dashboard/pharmacist" element={<PharmacistDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />

              {/* Shared Core AI and Catalog Tools */}
              <Route path="/search" element={<MedicineSearch />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/prescription" element={<PrescriptionUpload />} />
              <Route path="/calendar" element={<PillCalendar />} />
              <Route path="/prescription-writer" element={<PrescriptionWriter />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/health-report" element={<HealthReport />} />
              <Route path="/dosage-calc" element={<DosageCalculator />} />
              <Route path="/interaction-matrix" element={<InteractionMatrix />} />
              <Route path="/diet-plan" element={<DietPlanner />} />
            </Route>

            {/* 404 Route */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

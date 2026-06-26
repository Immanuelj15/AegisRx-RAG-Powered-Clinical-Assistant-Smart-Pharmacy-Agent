const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// In-memory tables for resilient fallback
const users = [];
const medicines = [];
const chatSessions = [];
const searchLogs = [];

// Seed some initial users for easy testing out of the box
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const seedMockUsers = () => {
  if (users.length === 0) {
    users.push({
      _id: 'mock_patient_id',
      name: 'John Patient',
      email: 'patient@medassist.com',
      password: bcrypt.hashSync('patient123', salt),
      role: 'Patient',
      phone: '123-456-7890',
      age: 32,
      gender: 'Male',
      medicalHistory: 'None',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    users.push({
      _id: 'mock_pharmacist_id',
      name: 'Sarah Pharmacist',
      email: 'pharmacist@medassist.com',
      password: bcrypt.hashSync('pharmacist123', salt),
      role: 'Pharmacist',
      phone: '987-654-3210',
      age: 28,
      gender: 'Female',
      medicalHistory: '',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    users.push({
      _id: 'mock_admin_id',
      name: 'Alex Admin',
      email: 'admin@medassist.com',
      password: bcrypt.hashSync('admin123', salt),
      role: 'Admin',
      phone: '555-555-5555',
      age: 40,
      gender: 'Male',
      medicalHistory: '',
      createdAt: new Date(),
      lastLogin: new Date()
    });
  }
};

seedMockUsers();

// Seed medicines from CSV if available
const loadMockMedicinesFromCsv = () => {
  const csvPath = path.join(__dirname, '..', 'csv', 'medicines.csv');
  if (fs.existsSync(csvPath)) {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (data) => {
        medicines.push({
          ...data,
          _id: data.Medicine_ID || `MED${medicines.length + 1}`,
          Stock: parseInt(data.Stock) || 0,
          Price: parseFloat(data.Price) || 0.0,
          BeforeFood: data.BeforeFood === 'true',
          AfterFood: data.AfterFood === 'true'
        });
      })
      .on('end', () => {
        console.log(`Loaded ${medicines.length} medicines into mock memory store.`);
      });
  } else {
    // Hardcoded fallback if CSV also fails
    medicines.push({
      _id: 'MED001',
      Medicine_ID: 'MED001',
      Medicine_Name: 'Paracetamol 500mg',
      Brand: 'Panadol',
      Generic_Name: 'Paracetamol',
      Strength: '500mg',
      Use_Case: 'Fever and mild pain relief',
      Alternative: 'Ibuprofen 400mg',
      Stock: 150,
      Price: 2.50,
      Manufacturer: 'GSK',
      Dosage: '1 tablet every 6 hours',
      Morning: '1',
      Afternoon: '1',
      Night: '1',
      BeforeFood: false,
      AfterFood: true,
      SideEffects: 'Nausea',
      Warnings: 'Do not exceed 4g per day. Avoid alcohol.',
      Expiry: '2028-12-31',
      Category: 'Analgesics'
    });
  }
};

// Start load
loadMockMedicinesFromCsv();

module.exports = {
  users,
  medicines,
  chatSessions,
  searchLogs,

  // User methods
  getMockUserById: (id) => users.find(u => u._id === id || u.id === id),
  getMockUserByEmail: (email) => users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  saveMockUser: (user) => {
    const existingIdx = users.findIndex(u => u._id === user._id);
    if (existingIdx !== -1) {
      users[existingIdx] = user;
    } else {
      user._id = user._id || `user_${Date.now()}`;
      users.push(user);
    }
    return user;
  },

  // Medicine methods
  getMockMedicines: () => medicines,
  getMockMedicineById: (id) => medicines.find(m => m.Medicine_ID === id || m._id === id),
  saveMockMedicine: (med) => {
    const existingIdx = medicines.findIndex(m => m.Medicine_ID === med.Medicine_ID);
    if (existingIdx !== -1) {
      medicines[existingIdx] = { ...medicines[existingIdx], ...med };
      return medicines[existingIdx];
    } else {
      med._id = med.Medicine_ID || `MED${Date.now()}`;
      medicines.push(med);
      return med;
    }
  },
  deleteMockMedicine: (id) => {
    const idx = medicines.findIndex(m => m.Medicine_ID === id || m._id === id);
    if (idx !== -1) {
      medicines.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Chat session methods
  getMockChatSessionsByUserId: (userId) => chatSessions.filter(c => c.userId === userId.toString()),
  getMockChatSessionById: (id) => chatSessions.find(c => c._id === id.toString() || c.id === id.toString()),
  saveMockChatSession: (session) => {
    const id = session._id || session.id || `chat_${Date.now()}`;
    const existingIdx = chatSessions.findIndex(c => c._id === id || c.id === id);
    if (existingIdx !== -1) {
      chatSessions[existingIdx] = { ...chatSessions[existingIdx], ...session, updatedAt: new Date() };
      return chatSessions[existingIdx];
    } else {
      const newSession = { ...session, _id: id, id, createdAt: new Date(), updatedAt: new Date() };
      chatSessions.push(newSession);
      return newSession;
    }
  },
  deleteMockChatSession: (id) => {
    const existingIdx = chatSessions.findIndex(c => c._id === id.toString() || c.id === id.toString());
    if (existingIdx !== -1) {
      chatSessions.splice(existingIdx, 1);
      return true;
    }
    return false;
  },

  // Log methods
  getMockSearchLogs: () => searchLogs,
  saveMockSearchLog: (log) => {
    log._id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    log.timestamp = new Date();
    searchLogs.push(log);
    return log;
  },

  // Schedule methods
  getMockSchedulesByUserId: (userId) => mockSchedules.filter(s => s.userId === userId.toString()),
  saveMockSchedule: (schedule) => {
    const id = schedule._id || schedule.id || `sched_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const existingIdx = mockSchedules.findIndex(s => s._id === id || s.id === id);
    if (existingIdx !== -1) {
      mockSchedules[existingIdx] = { ...mockSchedules[existingIdx], ...schedule };
      return mockSchedules[existingIdx];
    } else {
      const newSchedule = { ...schedule, _id: id, id, dosesTaken: schedule.dosesTaken || [], createdAt: new Date() };
      mockSchedules.push(newSchedule);
      return newSchedule;
    }
  },

  // Interaction methods
  getMockInteractions: () => mockInteractions,
  saveMockInteraction: (interaction) => {
    const id = interaction._id || `int_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    mockInteractions.push({ ...interaction, _id: id });
  }
};

// Seeding Mock Interactions
const mockSchedules = [];
const mockInteractions = [
  { drugA: 'ibuprofen', drugB: 'aspirin', severity: 'High', description: 'Both are NSAIDs. Concomitant use increases risk of gastrointestinal ulcers and bleeding.' },
  { drugA: 'ibuprofen', drugB: 'warfarin', severity: 'High', description: 'NSAID and anticoagulant combination. Severe risk of major gastrointestinal and systemic hemorrhage.' },
  { drugA: 'lisinopril', drugB: 'spironolactone', severity: 'Moderate', description: 'ACE inhibitor and potassium-sparing diuretic combination. High risk of developing hyperkalemia (dangerously high blood potassium levels).' },
  { drugA: 'metformin', drugB: 'contrast dye', severity: 'High', description: 'Iodinated contrast media and Metformin. High risk of lactic acidosis. Temporarily withhold Metformin before/after imaging studies.' },
  { drugA: 'amoxicillin', drugB: 'methotrexate', severity: 'Moderate', description: 'Penicillins reduce renal clearance of methotrexate, potentially increasing methotrexate toxicity risks.' },
  { drugA: 'cetirizine', drugB: 'alcohol', severity: 'Moderate', description: 'Central nervous system depressant synergy. Enhances drowsiness, cognitive impairment, and psychomotor coordination deficits.' }
];


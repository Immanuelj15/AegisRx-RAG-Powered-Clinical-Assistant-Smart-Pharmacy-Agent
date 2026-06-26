# 🛡️ AegisRx — RAG-Powered Clinical Assistant & Smart Pharmacy Agent

<div align="center">

![AegisRx Banner](https://img.shields.io/badge/AegisRx-Clinical%20AI%20Platform-2563EB?style=for-the-badge&logo=health&logoColor=white)
![Version](https://img.shields.io/badge/version-2.0.0-success?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Active-brightgreen?style=for-the-badge)

**A full-stack AI-powered clinical assistant combining Retrieval-Augmented Generation (RAG), Groq LLM, and real-time pharmacy management into one unified platform.**

</div>

---

## 🌟 Overview

AegisRx is a production-ready, AI-native healthcare platform designed for hospitals, pharmacists, and patients. It combines:

- **RAG Pipeline** — ChromaDB vector store + sentence-transformers for semantic medicine search
- **Groq LLM** — Ultra-fast Llama-3 inference for all AI clinical tasks
- **Supabase/PostgreSQL** — Real-time relational database via Prisma ORM
- **Multi-Role Auth** — Patients, Pharmacists, and Admin with JWT
- **Voice AI** — Web Speech API for voice input + Text-to-Speech responses
- **Live Video** — Jitsi Meet integration for telemedicine consultations

---

## ✨ Features

### 🤖 AI-Powered Clinical Tools

| Feature | Description |
|---|---|
| **Smart RAG Chat Agent** | Conversational medical AI with memory, indexed against your medicine catalog |
| **Prescription OCR** | Upload handwritten/digital prescriptions — auto-extract dosage schedules via Tesseract.js + Groq |
| **Prescription-to-Calendar Sync** | One-click sync of extracted medications directly into the Pill Calendar |
| **Symptom Checker** | AI triage with urgency levels (ER / GP / Self-Care) and possible conditions |
| **Dosage Calculator** | Weight-based, age-adjusted safe dosing for any medication |
| **Drug Interaction Matrix** | Analyze up to 5 drugs simultaneously for Safe/Moderate/Severe cross-reactions |
| **AI Health Report** | Personalized health score + risk factors + action plan from biometric data |
| **Diet & Lifestyle Planner** | 7-day meal plan with drug-food warnings + downloadable PDF |
| **Pharmacogenomics** | CYP enzyme-based drug metabolism analysis from genetic markers |
| **Clinical Trials Matcher** | Searches ClinicalTrials.gov for recruiting trials by condition |
| **FDA Recall Auditor** | Real-time openFDA safety database queries for drug recalls |

### 💊 Pharmacy & Inventory Management

| Feature | Description |
|---|---|
| **Medicine Catalog** | Full CRUD with real-time stock tracking, expiry alerts, and RAG auto-ingestion |
| **Prescription Writer** | Pharmacist tool to compose, sign, and export professional prescription PDFs |
| **Pill Calendar** | Visual medication schedule tracker with dose logging and refill requests |
| **Inventory Dashboard** | Stock analytics with low-stock/expiry alerts and procurement insights |

### 🎤 Voice & Media

| Feature | Description |
|---|---|
| **Voice Input** | Mic button with animated recording indicator in AI chat |
| **Text-to-Speech** | AI responses read aloud with animated equalizer feedback |
| **Telemedicine** | HIPAA-compliant live video consultations via Jitsi Meet |
| **PDF Export** | Chat logs, prescriptions, health reports, and diet plans all exportable as PDFs |

### 🔐 Admin Panel

| Feature | Description |
|---|---|
| **Analytics Dashboard** | Real-time today visits, total users, medicine count from live DB |
| **User Management** | View all users, filter by today activity, add new pharmacists |
| **Medicine Management** | Add medicines directly to DB, filter by stock/category |

---

## 🔧 Tech Stack

### Frontend
- **React 19** + **Vite 8**
- **Tailwind CSS 3** + **Framer Motion**
- **React Router 7**, **React Markdown**, **Chart.js**
- **Tesseract.js** (client-side OCR)
- **@jitsi/react-sdk** (live video)
- **@react-oauth/google** (OAuth)

### Backend
- **Node.js + Express**
- **Prisma ORM** + **Supabase PostgreSQL**
- **PDFKit** (PDF generation)
- **JWT + bcryptjs** (auth)
- **Multer** (file uploads)

### AI / ML Pipeline
- **Python + FastAPI** — RAG microservice
- **ChromaDB** — Persistent vector store
- **Sentence-Transformers** (`all-MiniLM-L6-v2`)
- **Groq API** (Llama-3-70b)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- [Groq API Key](https://console.groq.com)
- [Supabase](https://supabase.com) project

### 1. Clone the Repository
```bash
git clone https://github.com/Immanuelj15/AegisRx-RAG-Powered-Clinical-Assistant-Smart-Pharmacy-Agent.git
cd AegisRx-RAG-Powered-Clinical-Assistant-Smart-Pharmacy-Agent
```

### 2. Configure Environment Variables

Create `.env` in the root:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
RAG_SERVICE_URL=http://127.0.0.1:5001
ADMIN_SECRET_KEY=your_admin_password_here
```

Create `client/.env`:
```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 4. Set Up Python RAG Service
```bash
cd backend/services
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

### 5. Push Database Schema
```bash
npx prisma db push
```

### 6. Start Development Server
```bash
npm run dev
```

This starts all three services concurrently:
- **Express API** → `http://127.0.0.1:5000`
- **Python RAG Service** → `http://127.0.0.1:5001`
- **Vite Frontend** → `http://localhost:5173`

---

## 🏗️ Architecture

```
React Frontend (Vite + Tailwind)
        │
        │ HTTP / REST
        ▼
Express.js Backend (JWT Auth + Multer + PDFKit)
        │
        ├─── Groq API (Llama-3-70b) — LLM Inference
        ├─── FastAPI RAG Service (ChromaDB + Embeddings)
        └─── Supabase PostgreSQL (Prisma ORM)
```

---

## 📁 Project Structure

```
AegisRx/
├── server.js                   # Express entry point
├── prisma/schema.prisma        # Database models
├── backend/
│   ├── config/db.js            # DB connection
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes
│   ├── services/
│   │   ├── groqService.js      # Groq LLM wrapper
│   │   └── rag_service.py      # FastAPI RAG microservice
│   └── utils/
│       ├── pdfGenerator.js     # PDF templates
│       └── mockDb.js           # In-memory fallback
└── client/
    └── src/
        ├── context/            # Auth + Theme
        ├── hooks/useVoice.js   # Speech AI hook
        ├── layouts/            # Dashboard layout
        ├── components/         # Reusable UI
        └── pages/              # All page components
```

---

## 🔐 Security

- All API routes protected with **JWT Bearer token** middleware
- Passwords hashed with **bcryptjs** (salt: 10)
- Admin panel secured via master password
- `.env` secrets never committed — see `.gitignore`

---

## 👨‍💻 Author

**Immanuel J**
Full-Stack AI Developer
GitHub: [@Immanuelj15](https://github.com/Immanuelj15)

---

## 📄 License

MIT License — feel free to fork and build on top of AegisRx!

---

<div align="center">

**⭐ Star this repo if AegisRx helped you! ⭐**

Built with ❤️ using React, Node.js, Python, Groq LLM, and ChromaDB

</div>

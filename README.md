# AegisRx - RAG-Powered Clinical Assistant & Smart Pharmacy Agent

AegisRx is a production-ready, full-stack AI Medical Prescription Guidance and stock search system. It utilizes a **Retrieval-Augmented Generation (RAG)** pipeline to query local clinical inventory lists, suggest substitutes for out-of-stock items, extract dosage schedules from prescription image scans, and conduct structured consultations.

---

## 🏛️ Project Architecture

```
                 ReactJS Frontend (Vite)
                           │
                           │ Axios REST
                           ▼
                 Express + Node Backend (Port 5000)
                  /        │        \
                 /         │         \
                ▼          ▼          ▼
             MongoDB   Groq LLM    Python Flask RAG (Port 5001)
         (User Data) (Llama 3.3)      /         \
                                     /           \
                                    ▼             ▼
                                ChromaDB    SentenceTransformers
                              (Vector Store)  (all-MiniLM-L6-v2)
```

---

## 📂 Folder Structure

```
root/
  package.json              # Coordinates starting the servers and client
  server.js                 # Express server gateway and starter
  backend/
    config/                 # Database connection with offline failover
    controllers/            # Auth, Medicine, AI chat, and Analytics controllers
    middleware/             # Auth JWT decoders & role check guards
    models/                 # Mongoose schemas (User, Medicine, ChatSession, SearchLog)
    routes/                 # Modular Router mappings
    services/
      groqService.js        # Groq client integration with local offline simulators
      rag_service.py        # Python Flask microservice (ChromaDB + Transformers)
    utils/                  # PDFKit generator, CSV seed parses
    csv/                    # Medicines.csv database source
    uploads/                # Upload folder for prescription images & CSV sheets
  client/
    package.json            # React Client packages configuration
    index.html              # HTML shell template
    tailwind.config.js      # Styling themes configs
    src/
      main.jsx              # Vite entry point
      index.css             # Tailwind base references & Glassmorphic classes
      context/              # Auth & Theme context wrappers
      hooks/                # Speech-to-Text useVoice hook
      layouts/              # Dashboard and Auth card layouts
      pages/                # Landing, Auth screens, Dashboard configurations
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **MongoDB** (Ensure local MongoDB server is active, or use a MongoDB Atlas URI)

### Single-Command Setup
From the root workspace directory, run:
```bash
npm run install:all
```
*This command runs npm installs for the root Express backend, client Vite project, and installs Python pip packages (`flask`, `flask-cors`, `chromadb`, `sentence-transformers`, `pandas`).*

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aegisrx
JWT_SECRET=secure_jwt_token_256bit
GROQ_API_KEY=your_groq_api_key_here
RAG_SERVICE_URL=http://127.0.0.1:5001
NODE_ENV=development
```

> [!NOTE]
> **API Fallback Mode**: If `GROQ_API_KEY` is empty, or `MONGO_URI` is unreachable on startup, the system automatically starts in **Resilient Fallback Mode**, generating smart medical mock dialogue schedules and caching users locally in-memory.

---

## 💻 Running the Application

To start the React frontend, Express server, and Python RAG service concurrently, run:
```bash
npm run dev
```

The services will initialize on:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Express Backend**: [http://localhost:5000](http://localhost:5000)
- **Python RAG Server**: [http://localhost:5001](http://localhost:5001)

---

## 🔌 API Documentation

### Authentication Routing (`/api/auth`)
- `POST /register` - Register a new account. Body: `{ name, email, password, role }`
- `POST /login` - Login. Body: `{ email, password }`
- `GET /profile` - Retrieve profile info. Auth: `Bearer Token`
- `PUT /profile` - Update demographics & history. Auth: `Bearer Token`

### Medicine Catalog Routing (`/api/medicine`)
- `GET /` - List inventory with filters.
- `GET /search?query=name` - Locate medicine details. Syncs with ChromaDB semantic search if not found.
- `POST /upload` - Pharmacist CSV inventory file upload. Ingests data into database and vectors.
- `PUT /update` - Edit medicine properties.
- `DELETE /delete` - Remove item code from catalog.

### Clinical AI Routing (`/api/ai`)
- `POST /chat` - Interactive chatbot with RAG context and memory.
- `POST /prescription` - Post prescription image scan. Simulates OCR scheduling extraction.
- `POST /faq` - Answers medical questions using similarity indexes.
- `POST /alternative` - Suggest alternative medicine for out-of-stock codes.
- `POST /export-pdf` - Streams compiled PDF file logs.

const axios = require('axios');
const groqService = require('../services/groqService');
const ChatSession = require('../models/ChatSession');
const Medicine = require('../models/Medicine');
const mockDb = require('../utils/mockDb');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001';

// @desc    Smart Health Chat Agent with conversation memory
// @route   POST /api/ai/chat
// @access  Private
const chatAgent = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // 1. Get or create chat session
    let session = null;
    if (process.env.MONGO_CONNECTED === 'true') {
      if (sessionId) {
        session = await ChatSession.findById(sessionId);
      }
      if (!session) {
        session = await ChatSession.create({
          userId,
          title: message.substring(0, 30) + '...',
          messages: []
        });
      }
    } else {
      if (sessionId) {
        session = mockDb.getMockChatSessionById(sessionId);
      }
      if (!session) {
        session = {
          _id: `chat_${Date.now()}`,
          id: `chat_${Date.now()}`,
          userId: userId.toString(),
          title: message.substring(0, 30) + '...',
          messages: []
        };
      }
    }

    // 2. Fetch context from RAG service based on the current user message
    let contextStr = 'No specific database records matched. Use general medical knowledge.';
    try {
      const ragRes = await axios.post(`${RAG_SERVICE_URL}/api/rag/query`, {
        query: message,
        top_k: 3
      });
      if (ragRes.data && ragRes.data.success && ragRes.data.results.length > 0) {
        contextStr = ragRes.data.results.map(r => r.document).join('\n---\n');
      }
    } catch (err) {
      console.warn('RAG Query Service failed in Chat Agent, continuing without local vector context:', err.message);
    }

    // 3. Build prompts for Groq
    const systemPrompt = `You are AI MedAssist, a professional full-stack medical chatbot assisting patients, hospital staff, and pharmacists. 
You answer questions accurately, warning-first, and clearly based on local hospital medicine databases.

Available Catalog Context from RAG similarity search:
"""
${contextStr}
"""

Instructions:
1. Always prioritize patient safety. Include clear warnings for high-risk medications.
2. If a medicine is out of stock in the context, suggest the specified generic or alternative.
3. Be professional and concise.
4. Format output in structured markdown tables and sections for ease of reading.
5. If the context does not answer the question, answer using general medical knowledge, but explicitly state that it is a general medical advisory.`;

    // Retrieve last 6 messages to keep conversation memory
    const history = session.messages.slice(-6).map(m => `${m.role === 'user' ? 'Patient' : 'Agent'}: ${m.content}`).join('\n');
    const userPromptWithHistory = history ? `Here is the conversation history:\n${history}\n\nPatient Query: ${message}` : `Patient Query: ${message}`;

    // 4. Send to Groq API
    const aiResponseContent = await groqService.getCompletion(systemPrompt, userPromptWithHistory, 0.4);

    // 5. Save user message and AI response to history
    session.messages.push({ role: 'user', content: message, timestamp: new Date() });
    session.messages.push({ role: 'assistant', content: aiResponseContent, timestamp: new Date() });

    if (process.env.MONGO_CONNECTED === 'true') {
      await session.save();
    } else {
      mockDb.saveMockChatSession(session);
    }

    res.status(200).json({
      success: true,
      sessionId: session._id || session.id,
      response: aiResponseContent,
      session: session
    });

  } catch (error) {
    console.error('Chat Agent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Understand Prescription Image (OCR Simulation / Vision)
// @route   POST /api/ai/prescription
// @access  Private
const understandPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a prescription image' });
    }

    console.log(`Prescription uploaded: ${req.file.filename}`);

    // OCR text extraction simulation
    // In a real environment, we would run Tesseract OCR.
    // We simulate OCR extraction by matching keywords or parsing sample mock prescription text.
    let extractedText = "Rx: Paracetamol 500mg - Take 1 tablet morning, afternoon, night after food. Also Amoxicillin 500mg capsules - Take 1 capsule 3 times daily before food for 7 days. Dr. Robert.";

    const systemPrompt = `You are a professional medical system OCR text interpreter. Your job is to parse messy handwritten text or prescription transcriptions and output a neat, structured medication schedule.
Output columns:
1. Medicine Name
2. Strength
3. Schedule (Morning/Afternoon/Night)
4. Food Relation (Before/After food)
5. Special Instructions & Side Effects`;

    const userPrompt = `Parse and explain this extracted prescription text:
"${extractedText}"`;

    const explanation = await groqService.getCompletion(systemPrompt, userPrompt);

    res.status(200).json({
      success: true,
      extractedText,
      analysis: explanation,
      filePath: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Answer medical FAQs using RAG database
// @route   POST /api/ai/faq
// @access  Public
const answerFaq = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    // Query RAG context
    let contextStr = 'No database context matching query.';
    try {
      const ragRes = await axios.post(`${RAG_SERVICE_URL}/api/rag/query`, {
        query: question,
        top_k: 3
      });
      if (ragRes.data && ragRes.data.success && ragRes.data.results.length > 0) {
        contextStr = ragRes.data.results.map(r => r.document).join('\n---\n');
      }
    } catch (err) {
      console.warn('RAG Query failed in FAQ controller:', err.message);
    }

    const systemPrompt = `You are the Hospital Pharmacy FAQ assistant. Answer the user's query precisely using ONLY the provided catalog context below. If you cannot find the answer in the catalog, answer based on generic medicine guidelines, but state so.`;
    
    const userPrompt = `Context:\n${contextStr}\n\nQuestion: ${question}`;

    const answer = await groqService.getCompletion(systemPrompt, userPrompt);

    res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Suggest alternatives for unavailable medicine
// @route   POST /api/ai/alternative
// @access  Private
const suggestAlternative = async (req, res) => {
  try {
    const { medicineName } = req.body;

    if (!medicineName) {
      return res.status(400).json({ success: false, error: 'Medicine name is required' });
    }

    // Try to find medicine details and alternatives
    let medRecord = null;
    if (process.env.MONGO_CONNECTED === 'true') {
      medRecord = await Medicine.findOne({ Medicine_Name: { $regex: medicineName, $options: 'i' } });
    } else {
      medRecord = mockDb.getMockMedicines().find(m => m.Medicine_Name.toLowerCase().includes(medicineName.toLowerCase()));
    }

    const altName = medRecord ? medRecord.Alternative : 'Generic Alternative';
    
    const systemPrompt = `You are a Clinical Pharmacist AI agent. Suggest a therapeutic alternative for an unavailable medication. Explain the mechanism, dosage adjustment, and warnings clearly.`;
    const userPrompt = `The medication "${medicineName}" is out of stock. Suggested alternative is: "${altName}". Provide a detailed comparison explaining why it is a suitable alternative, common warnings, and correct dosages.`;

    const explanation = await groqService.getCompletion(systemPrompt, userPrompt);

    res.status(200).json({
      success: true,
      medicineName,
      suggestedAlternative: altName,
      explanation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get All Chat Sessions for User
// @route   GET /api/ai/sessions
// @access  Private
const getChatSessions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let list = [];
    if (process.env.MONGO_CONNECTED === 'true') {
      list = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
    } else {
      list = mockDb.getMockChatSessionsByUserId(userId);
    }
    res.status(200).json({ success: true, sessions: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  chatAgent,
  understandPrescription,
  answerFaq,
  suggestAlternative,
  getChatSessions
};

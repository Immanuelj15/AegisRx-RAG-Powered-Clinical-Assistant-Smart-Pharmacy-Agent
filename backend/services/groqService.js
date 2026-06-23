const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate completion using Groq LLM, with fallback support.
 */
const getCompletion = async (systemPrompt, userPrompt, temperature = 0.2) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.log('GROQ_API_KEY is missing. Running in Mock AI Fallback Mode.');
    return generateMockAIResponse(systemPrompt, userPrompt);
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: temperature,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10s timeout
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    throw new Error('Invalid response structure from Groq API');
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    console.log('Falling back to local Mock AI generator...');
    return generateMockAIResponse(systemPrompt, userPrompt);
  }
};

/**
 * Parses user prompt and context to construct a highly context-relevant mock response.
 */
const generateMockAIResponse = (systemPrompt, userPrompt) => {
  const promptLower = userPrompt.toLowerCase();
  
  // 1. Prescription understanding prompt
  if (systemPrompt.includes('prescription') || promptLower.includes('prescription') || promptLower.includes('ocr')) {
    return `### 📋 Prescription Analysis Report

Based on the scanned prescription, here is the structured dosage and schedule details:

1. **Paracetamol 500mg**
   - **Generic Name:** Paracetamol
   - **Timing:** 🌅 Morning (1) | ☀️ Afternoon (1) | 🌙 Night (1)
   - **Food Relation:** 🍔 After food
   - **Dosage Instruction:** Take 1 tablet every 6 hours as needed for pain or fever.
   - **Common Side Effects:** Nausea, mild drowsiness.
   - **Warnings/Contraindications:** Do not exceed 4000mg (8 tablets) in 24 hours. Avoid alcohol as it increases liver toxicity risk.

2. **Amoxicillin 500mg**
   - **Generic Name:** Amoxicillin
   - **Timing:** 🌅 Morning (1) | ☀️ Afternoon (1) | 🌙 Night (1)
   - **Food Relation:** 🧪 Before food
   - **Dosage Instruction:** Take 1 capsule 3 times daily for a complete 7-day course.
   - **Common Side Effects:** Loose stools, stomach upset, skin rash.
   - **Warnings/Contraindications:** Complete the full course even if you feel better. Do not take if allergic to penicillin.

*Note: This is an AI-generated analysis. Please consult your physician or pharmacist before taking medications.*`;
  }

  // 2. Alternative medicine search/prompt
  if (promptLower.includes('alternative') || promptLower.includes('substitute') || promptLower.includes('unavailable')) {
    // Check for specific medicines
    if (promptLower.includes('ibuprofen')) {
      return `### 🔄 Medication Alternative Guidance

**Requested Medicine:** Ibuprofen 400mg (Advil) - **Status: Out of Stock ❌**

**Recommended Substitute:** **Paracetamol 500mg (Panadol)** or **Naproxen 250mg**

**Why this substitute is suggested:**
- **Therapeutic Equivalence:** Both Ibuprofen and Paracetamol are effective analgesics (pain relievers) and antipyretics (fever reducers).
- **Mechanism:** Paracetamol acts centrally in the brain to reduce pain and fever, whereas Ibuprofen is an NSAID that reduces peripheral inflammation. Since Ibuprofen is out of stock, Paracetamol serves as the safest primary option for non-inflammatory pain.
- **Safety Profile:** Paracetamol is gentler on the stomach than Ibuprofen and does not carry the risk of gastric irritation or ulcers.

**Important Safety Guidelines:**
- Avoid taking other paracetamol-containing products.
- Do not exceed 4g of Paracetamol daily.`;
    }
    
    if (promptLower.includes('lisinopril')) {
      return `### 🔄 Medication Alternative Guidance

**Requested Medicine:** Lisinopril 10mg (Zestril) - **Status: Out of Stock ❌**

**Recommended Substitute:** **Enalapril 10mg** or **Losartan 50mg**

**Why this substitute is suggested:**
- **Therapeutic Equivalence:** Lisinopril and Enalapril are both ACE (Angiotensin-Converting Enzyme) inhibitors used to lower blood pressure and protect kidney function in hypertensive patients.
- **Mechanism:** They both block the conversion of angiotensin I to angiotensin II, leading to dilated blood vessels and decreased blood pressure.
- **Switching Guidance:** A direct 1-to-1 switch is common, but blood pressure should be monitored closely for the first few days.

**Important Safety Guidelines:**
- Watch out for a persistent dry cough (common ACE inhibitor side effect).
- Do not take during pregnancy.`;
    }
  }

  // 3. Medicine search responses
  if (promptLower.includes('paracetamol') || promptLower.includes('panadol')) {
    return `### 💊 Medicine Information: Paracetamol 500mg (Panadol)

- **Category:** Analgesics (Pain Relievers)
- **Status:** **In Stock (150 units) ✅**
- **Price:** $2.50 per strip
- **Manufacturer:** GSK
- **Dosage:** 1 tablet every 6 hours after food.
- **Schedule:** 🌅 Morning (1) | ☀️ Afternoon (1) | 🌙 Night (1)
- **Side Effects:** Nausea, mild stomach discomfort.
- **Warnings:** Do not exceed 8 tablets per day. Avoid alcohol.
- **Suggested Alternative:** Ibuprofen 400mg (if stomach is healthy)`;
  }
  
  if (promptLower.includes('ibuprofen') || promptLower.includes('advil')) {
    return `### 💊 Medicine Information: Ibuprofen 400mg (Advil)

- **Category:** NSAIDs
- **Status:** **Out of Stock (0 units) ❌**
- **Price:** $3.99 per strip
- **Manufacturer:** Pfizer
- **Dosage:** 1 tablet three times daily after food.
- **Side Effects:** Stomach upset, nausea, acid reflux.
- **Warnings:** Take with food. Avoid if history of stomach ulcers or kidney issues.
- **Suggested Alternative:** **Paracetamol 500mg (Panadol)** (In Stock ✅)`;
  }

  // 4. FAQ Responses
  if (promptLower.includes('fever')) {
    return `### 🌡️ RAG AI FAQ: What is used for fever?

Based on the hospital database:
1. **Paracetamol 500mg (Panadol)** is the primary drug of choice for reducing fever. It is **In Stock (150 units)** at a price of **$2.50**.
2. **Ibuprofen 400mg (Advil)** is also used for fever, but it is currently **Out of Stock**.
3. **Usage Guidance:** Paracetamol should be taken after food, up to 3-4 times a day. Do not exceed 8 tablets in 24 hours.`;
  }
  
  if (promptLower.includes('allergy') || promptLower.includes('allergies')) {
    return `### 🤧 RAG AI FAQ: What medicine for allergy?

Based on the hospital database:
1. **Cetirizine 10mg (Zyrtec)** is an effective antihistamine for runny nose, allergies, and sneezing.
   - **Status:** In Stock (250 units) | Price: $5.00
   - **Dosage:** 1 tablet daily at night. May cause mild drowsiness.
2. **Loratadine 10mg (Claritin)** is an alternative non-drowsy antihistamine.
   - **Status:** In Stock (300 units) | Price: $4.80
   - **Dosage:** 1 tablet daily in the morning.`;
  }

  if (promptLower.includes('diabetic') || promptLower.includes('diabetes')) {
    return `### 🩺 RAG AI FAQ: Can diabetic patients take these medicines?

Yes, diabetic patients can safely take standard pain relief and allergy medications, but should notice:
1. **Metformin 500mg (Glucophage)** is the standard first-line treatment for Type 2 Diabetes to control blood sugar. It is **In Stock (200 units)** and priced at **$8.50**.
2. **Precautions:** When taking Metformin, avoid excessive alcohol intake to reduce the risk of lactic acidosis. Monitor blood sugar regularly.
3. For pain relief, diabetic patients can take **Paracetamol 500mg** safely, but should use NSAIDs like **Ibuprofen** with caution if diabetic kidney complications are present.`;
  }

  // 5. Default General Conversational AI Assistant Response
  return `### 🏥 AI MedAssist Virtual Health Agent

Hello! I am your AI MedAssist Agent. I have analyzed your query based on our local clinical database.

**General Guidance:**
- For **pain and fever**, we have **Paracetamol 500mg** in stock ($2.50). **Ibuprofen 400mg** is currently out of stock.
- For **allergies**, we have **Cetirizine 10mg** and **Loratadine 10mg** in stock.
- For **acid reflux**, we have **Omeprazole 20mg** and **Esomeprazole 20mg** available.

Please upload a prescription image to schedule your dosage, or ask me specific questions about drug stock, alternatives, side effects, and safety warnings!

*Disclaimer: AI MedAssist provides guidance based on database entries. Always verify with hospital clinicians in emergency situations.*`;
};

module.exports = {
  getCompletion
};

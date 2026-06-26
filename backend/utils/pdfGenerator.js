const PDFDocument = require('pdfkit');

/**
 * Generate a PDF for a Chat Conversation and stream to response
 */
const generateChatPDF = (res, title, messages) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream PDF directly to client response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="chat-consultation-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#2563EB');
  
  // Title
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('AegisRx - Clinical Consultation Report', 50, 40);

  // Subheader
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Consultation Session: ${title || 'General Chat'}`, 50, 68);
     
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 350, 68);

  doc.moveDown(5);

  // Reset text color for body
  doc.fillColor('#1E293B');

  // Messages Loop
  messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const sender = isUser ? 'PATIENT/USER' : 'AEGISRX CLINICAL AI';
    const senderColor = isUser ? '#10B981' : '#2563EB';

    // Divider
    if (idx > 0) {
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#E2E8F0').stroke();
      doc.moveDown(1);
    }

    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor(senderColor)
       .text(sender, 50, doc.y + 10);

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#334155')
       .text(msg.content.replace(/###/g, '').replace(/\*\*/g, ''), 50, doc.y + 5, {
         width: doc.page.width - 100,
         align: 'left',
         lineGap: 4
       });

    doc.moveDown(2);
  });

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor('#94A3B8')
       .text(
         'Disclaimer: AegisRx provides automated medical guidance based on hospital stock catalogs. Verify all medications with a physician.',
         50,
         doc.page.height - 40,
         { align: 'center', width: doc.page.width - 100 }
       );
  }

  doc.end();
};

/**
 * Generate a PDF for Prescription Guidance Schedule and stream to response
 */
const generatePrescriptionPDF = (res, analysisText) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="prescription-schedule-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#14B8A6'); // Teal banner for prescriptions
  
  // Title
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('AegisRx - Smart Prescription Summary', 50, 40);

  doc.fontSize(10)
     .font('Helvetica')
     .text(`Generated on: ${new Date().toLocaleString()}`, 50, 68);

  doc.moveDown(5);

  doc.fillColor('#1E293B')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Extracted Dosage Schedule & Warnings', 50, doc.y);

  doc.moveDown(1);

  // Clean raw analysis markdown headers
  const bodyText = analysisText
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/\*\*/g, '');

  doc.font('Helvetica')
     .fontSize(11)
     .fillColor('#334155')
     .text(bodyText, 50, doc.y, {
       width: doc.page.width - 100,
       align: 'left',
       lineGap: 5
     });

  doc.end();
};

/**
 * Generate a Digitally Signed Doctor Prescription PDF
 */
const generateSignedPrescriptionPDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50 });
  const { patientName, age, gender, doctorName, medicines, signatureBase64 } = data;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="signed-prescription-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#2563EB');
  
  // Title
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('AEGISRX CLINICAL NETWORK', 50, 30);

  doc.fontSize(10)
     .font('Helvetica')
     .text('Official Digital Prescription & Scheduling Sheet', 50, 58);

  doc.text(`Prescription Date: ${new Date().toLocaleDateString()}`, 350, 58);

  doc.moveDown(5);

  // Patient Info Block
  doc.fillColor('#1E293B')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('PATIENT DEMOGRAPHICS', 50, 120);

  doc.moveTo(50, 135).lineTo(doc.page.width - 50, 135).strokeColor('#E2E8F0').stroke();

  doc.fontSize(10)
     .font('Helvetica')
     .text(`Name: ${patientName}`, 50, 145)
     .text(`Age: ${age || 'N/A'}`, 250, 145)
     .text(`Gender: ${gender || 'N/A'}`, 355, 145);

  doc.moveDown(3);

  // Medicines Table
  doc.fillColor('#1E293B')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('PRESCRIBED MEDICATIONS', 50, 180);

  doc.moveTo(50, 195).lineTo(doc.page.width - 50, 195).strokeColor('#E2E8F0').stroke();

  let startY = 210;

  // Table Headers
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#475569')
     .text('Medicine / Strength', 50, startY)
     .text('Schedule (M - A - N)', 200, startY)
     .text('Timing Relation', 350, startY)
     .text('Duration', 450, startY);

  doc.moveTo(50, startY + 15).lineTo(doc.page.width - 50, startY + 15).strokeColor('#F1F5F9').stroke();
  startY += 25;

  doc.font('Helvetica').fillColor('#334155');

  medicines.forEach((med) => {
    // Check if table row overflows page
    if (startY > doc.page.height - 150) {
      doc.addPage();
      startY = 50;
    }

    const freqStr = `${med.frequency.morning ? '1' : '0'} - ${med.frequency.afternoon ? '1' : '0'} - ${med.frequency.night ? '1' : '0'}`;

    doc.font('Helvetica-Bold').text(`${med.medicineName} ${med.strength || ''}`, 50, startY)
       .font('Helvetica')
       .text(freqStr, 200, startY)
       .text(med.foodRelation || 'None', 350, startY)
       .text(`${med.durationDays || 7} Days`, 450, startY);

    startY += 20;
  });

  doc.moveDown(4);

  // Doctor Signature
  const signatureY = Math.max(startY + 40, doc.page.height - 180);
  
  doc.moveTo(50, signatureY).lineTo(doc.page.width - 50, signatureY).strokeColor('#E2E8F0').stroke();

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#1E293B')
     .text('ISSUING CLINICIAN', 50, signatureY + 15);

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#475569')
     .text(`Dr. ${doctorName || 'Robert (Dispensing Pharmacist)'}`, 50, signatureY + 30)
     .text('Licence Ref: #ARX-2026-993A', 50, signatureY + 45);

  if (signatureBase64) {
    try {
      const signatureBuffer = Buffer.from(signatureBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      doc.image(signatureBuffer, 380, signatureY + 15, { width: 140, height: 50 });
      doc.font('Helvetica-Oblique')
         .fontSize(8)
         .fillColor('#94A3B8')
         .text('Digitally Signed & Validated', 380, signatureY + 70, { align: 'center', width: 140 });
    } catch (err) {
      console.error('Failed to embed prescription signature image:', err);
    }
  }

  doc.end();
};

/**
 * Generate Supplier Purchase Order Procurement PDF
 */
const generatePoPDF = (res, lowStockMedicines) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="purchase-order-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#0F172A'); // Dark charcoal banner
  
  // Title
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('AEGISRX - PURCHASE PROCUREMENT ORDER', 50, 30);

  doc.fontSize(10)
     .font('Helvetica')
     .text('Automated Inventory Restocking Sheet', 50, 58);

  doc.text(`PO Number: #PO-${Date.now().toString().slice(-6)}`, 350, 38);
  doc.text(`Order Date: ${new Date().toLocaleDateString()}`, 350, 58);

  doc.moveDown(5);

  doc.fillColor('#1E293B')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('LOW STOCK ITEMS TO PROCURE', 50, 120);

  doc.moveTo(50, 135).lineTo(doc.page.width - 50, 135).strokeColor('#E2E8F0').stroke();

  let startY = 150;

  // Table Headers
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#475569')
     .text('Item / Strength', 50, startY)
     .text('Current Stock', 220, startY)
     .text('Target Restock Qty', 310, startY)
     .text('Unit Price', 420, startY)
     .text('Subtotal', 480, startY);

  doc.moveTo(50, startY + 15).lineTo(doc.page.width - 50, startY + 15).strokeColor('#F1F5F9').stroke();
  startY += 25;

  doc.font('Helvetica').fillColor('#334155');

  let grandTotal = 0;

  lowStockMedicines.forEach((med) => {
    if (startY > doc.page.height - 120) {
      doc.addPage();
      startY = 50;
    }

    const restockQty = 100; // Fixed default restock limit
    const subtotal = restockQty * (med.Price || 2.50);
    grandTotal += subtotal;

    doc.font('Helvetica-Bold').text(`${med.Medicine_Name} ${med.Strength || ''}`, 50, startY)
       .font('Helvetica')
       .text(`${med.Stock} units`, 220, startY)
       .text(`${restockQty} units`, 310, startY)
       .text(`$${(med.Price || 2.50).toFixed(2)}`, 420, startY)
       .text(`$${subtotal.toFixed(2)}`, 480, startY);

    startY += 20;
  });

  doc.moveDown(3);
  doc.moveTo(50, startY).lineTo(doc.page.width - 50, startY).strokeColor('#E2E8F0').stroke();

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#0F172A')
     .text(`Grand Total: $${grandTotal.toFixed(2)}`, 380, startY + 15, { align: 'right', width: 150 });

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#94A3B8')
     .text('Authorized by: AegisRx Automated Procurement System. No signature required.', 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

  doc.end();
};

module.exports = {
  generateChatPDF,
  generatePrescriptionPDF,
  generateSignedPrescriptionPDF,
  generatePoPDF,
  generateHealthReportPDF,
  generateDietPlanPDF
};

/**
 * Generate a Patient Health Summary Report PDF
 */
function generateHealthReportPDF(res, data) {
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  const { patientData, medications, allergies, upcomingDoses, narrative } = data;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="health-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  // ── Header Banner ──────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 105).fill('#0F172A');
  doc.rect(0, 95, doc.page.width, 10).fill('#2563EB');

  doc.fillColor('#FFFFFF')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('AEGISRX — PATIENT HEALTH SUMMARY REPORT', 50, 28);

  doc.fontSize(9)
     .font('Helvetica')
     .text(`Generated: ${new Date().toLocaleString()}`, 50, 58)
     .text(`Report ID: PHR-${Date.now().toString().slice(-8)}`, 50, 72);

  // ── Patient Demographics Block ─────────────────────────────────
  doc.moveDown(4.5);
  const demoY = doc.y;

  doc.rect(50, demoY, doc.page.width - 100, 70).fill('#F8FAFC').stroke('#E2E8F0');

  doc.fillColor('#1E293B')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('PATIENT DEMOGRAPHICS', 62, demoY + 10);

  doc.fontSize(9).font('Helvetica').fillColor('#334155')
     .text(`Name: ${patientData.name || 'N/A'}`, 62, demoY + 27)
     .text(`Age: ${patientData.age || 'N/A'} yrs`, 200, demoY + 27)
     .text(`Gender: ${patientData.gender || 'N/A'}`, 300, demoY + 27)
     .text(`Role: ${patientData.role || 'Patient'}`, 400, demoY + 27)
     .text(`Medical History: ${(patientData.medicalHistory || 'None documented').substring(0, 80)}`, 62, demoY + 44)
     .text(`Documented Allergies: ${allergies || 'None'}`, 62, demoY + 58);

  // ── AI Clinical Narrative ──────────────────────────────────────
  doc.moveDown(5.5);

  doc.fillColor('#2563EB')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('AI CLINICAL SUMMARY', 50, doc.y);

  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor('#BFDBFE').stroke();
  doc.moveDown(0.8);

  doc.fillColor('#1E40AF')
     .fontSize(9.5)
     .font('Helvetica-Oblique')
     .text(narrative || 'No narrative available.', 50, doc.y, {
       width: doc.page.width - 100,
       align: 'justify',
       lineGap: 3
     });

  doc.moveDown(1.5);

  // ── Medications Table ──────────────────────────────────────────
  doc.fillColor('#1E293B')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('CURRENT MEDICATIONS', 50, doc.y);

  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor('#E2E8F0').stroke();
  doc.moveDown(0.8);

  if (medications && medications.length > 0) {
    let tblY = doc.y;
    // Header row
    doc.rect(50, tblY, doc.page.width - 100, 16).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
       .text('Medicine', 56, tblY + 4)
       .text('Strength', 190, tblY + 4)
       .text('Schedule', 270, tblY + 4)
       .text('Food', 370, tblY + 4)
       .text('Duration', 435, tblY + 4);

    tblY += 18;
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155');

    medications.forEach((med, idx) => {
      if (tblY > doc.page.height - 120) { doc.addPage(); tblY = 60; }
      const rowBg = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(50, tblY, doc.page.width - 100, 15).fill(rowBg);

      const schedArr = [];
      if (med.frequency?.morning) schedArr.push('Morning');
      if (med.frequency?.afternoon) schedArr.push('Afternoon');
      if (med.frequency?.night) schedArr.push('Night');

      doc.fillColor('#334155')
         .text(med.medicineName || med.Medicine_Name || 'N/A', 56, tblY + 3)
         .text(med.strength || med.Strength || '-', 190, tblY + 3)
         .text(schedArr.join(' / ') || '-', 270, tblY + 3)
         .text(med.foodRelation || '-', 370, tblY + 3)
         .text(med.durationDays ? `${med.durationDays}d` : '-', 435, tblY + 3);

      tblY += 15;
    });

    doc.y = tblY + 10;
  } else {
    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica-Oblique')
       .text('No active medications on record.', 56, doc.y);
    doc.moveDown(1);
  }

  // ── Upcoming Doses ─────────────────────────────────────────────
  if (upcomingDoses && upcomingDoses.length > 0) {
    doc.moveDown(1);
    doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold')
       .text('UPCOMING DOSES (NEXT 24 HRS)', 50, doc.y);
    doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor('#E2E8F0').stroke();
    doc.moveDown(0.6);

    upcomingDoses.slice(0, 6).forEach(dose => {
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
         .text(`• ${dose.time || 'N/A'} — ${dose.medicine || 'N/A'} ${dose.strength || ''}`, 58, doc.y, {
           lineGap: 2
         });
      doc.moveDown(0.3);
    });
  }

  // ── Footer on all pages ────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.rect(0, doc.page.height - 44, doc.page.width, 44).fill('#0F172A');
    doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
       .text(
         '⚕  DISCLAIMER: This report is AI-assisted and generated by AegisRx for informational purposes only. It does NOT replace professional medical advice, diagnosis, or treatment. Always consult a licensed physician.',
         50, doc.page.height - 34,
         { align: 'center', width: doc.page.width - 100 }
       );
  }

  doc.end();
}


/**
 * Generate a Clinical Diet Plan PDF
 */
function generateDietPlanPDF(res, conditions, medications, dietPlan) {
  const doc = new PDFDocument({ margin: 50, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="diet-plan-${Date.now()}.pdf"`);
  doc.pipe(res);

  // ── Header Banner ───────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 110).fill('#059669');
  doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold')
     .text('AegisRx Clinical Diet Plan', 50, 32);
  doc.font('Helvetica').fontSize(10)
     .text(`Personalized Nutrition Report  |  Generated: ${new Date().toLocaleDateString('en-GB')}`, 50, 60);
  doc.fontSize(9).text(`Conditions: ${conditions?.join(', ') || 'N/A'}  |  Active Medications: ${medications?.join(', ') || 'None'}`, 50, 76);

  doc.moveDown(5);
  doc.fillColor('#0F172A');

  // ── Drug-Food Warnings ──────────────────────────────────────────
  if (dietPlan.drugFoodWarnings && dietPlan.drugFoodWarnings.length > 0) {
    doc.rect(50, doc.y, doc.page.width - 100, 24).fill('#FEE2E2');
    doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(11)
       .text('⚠  CRITICAL FOOD AVOIDANCES', 60, doc.y - 18);
    doc.moveDown(0.5);
    dietPlan.drugFoodWarnings.forEach(warning => {
      doc.fillColor('#7F1D1D').font('Helvetica').fontSize(9)
         .text(`• ${warning}`, 60, doc.y, { width: doc.page.width - 120 });
      doc.moveDown(0.4);
    });
    doc.moveDown(1);
  }

  // ── Recommended Foods ───────────────────────────────────────────
  if (dietPlan.recommendedFoods && dietPlan.recommendedFoods.length > 0) {
    doc.rect(50, doc.y, doc.page.width - 100, 24).fill('#D1FAE5');
    doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(11)
       .text('✓  RECOMMENDED FOODS', 60, doc.y - 18);
    doc.moveDown(0.5);
    dietPlan.recommendedFoods.forEach(food => {
      doc.fillColor('#064E3B').font('Helvetica').fontSize(9)
         .text(`✓ ${food}`, 60, doc.y, { width: doc.page.width - 120 });
      doc.moveDown(0.4);
    });
    doc.moveDown(1.5);
  }

  // ── Weekly Meal Plan ────────────────────────────────────────────
  if (dietPlan.weeklyPlan && dietPlan.weeklyPlan.length > 0) {
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13)
       .text('7-Day Clinical Meal Plan', 50, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.moveDown(0.8);

    dietPlan.weeklyPlan.forEach((dayPlan, idx) => {
      if (doc.y > doc.page.height - 160) { doc.addPage(); }

      // Day header bar
      doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#F0FDF4');
      doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(10)
         .text(dayPlan.day?.toUpperCase() || `DAY ${idx + 1}`, 60, doc.y - 14);
      doc.moveDown(1.2);

      // Meal columns
      const colW = (doc.page.width - 120) / 4;
      const labels = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
      const values = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner, dayPlan.snack];
      const startY = doc.y;

      labels.forEach((label, i) => {
        const x = 50 + i * colW;
        doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(7)
           .text(label.toUpperCase(), x, startY, { width: colW - 8 });
        doc.fillColor('#334155').font('Helvetica').fontSize(8)
           .text(values[i] || '—', x, startY + 12, { width: colW - 8 });
      });

      doc.moveDown(4);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
      doc.moveDown(0.8);
    });
  }

  // ── Footer on all pages ─────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#0F172A');
    doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
       .text(
         '⚕  DISCLAIMER: This diet plan is generated by AegisRx AI for informational use only. Consult a licensed dietitian or physician before making dietary changes.',
         50, doc.page.height - 28, { align: 'center', width: doc.page.width - 100 }
       );
  }

  doc.end();
}

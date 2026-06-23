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
  generatePoPDF
};


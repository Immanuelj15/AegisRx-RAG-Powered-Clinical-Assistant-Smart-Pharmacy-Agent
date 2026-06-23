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

module.exports = {
  generateChatPDF,
  generatePrescriptionPDF
};

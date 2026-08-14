import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a medical PDF prescription document.
 * @param {Object} prescription
 * @param {boolean} returnBlobUri - If true, returns a Blob URI for inline preview instead of saving file.
 */
export function generatePrescriptionPdf(prescription, returnBlobUri = false) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [13, 148, 136]; // #0d9488 Teal
  const darkColor = [15, 23, 42];     // #0f172a
  const grayColor = [100, 116, 139];  // #64748b

  const rxNumber = `RX-${String(prescription.id).padStart(6, '0')}`;
  const rxDate = prescription.created_at
    ? new Date(prescription.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('QURELIO HEALTH CLINIC', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('OPD Consultation & Medical Records', 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(rxNumber, 196, 15, { align: 'right' });

  // ── Clinic Sub-Header ──────────────────────────────────────────────────────
  let y = 32;
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('123 Healthcare Blvd, Suite 400 | Phone: +91 98400 00000 | Email: care@qurelio.com', 14, y);

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);

  // ── Patient & Doctor Details Grid ──────────────────────────────────────────
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 30, 2, 2, 'F');
  doc.roundedRect(108, y, 88, 30, 2, 2, 'F');

  // Patient Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('PATIENT INFORMATION', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(prescription.patient?.name || 'Unknown Patient', 18, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  const ageGender = [];
  if (prescription.patient?.age) ageGender.push(`${prescription.patient.age} Yrs`);
  if (prescription.patient?.gender) ageGender.push(prescription.patient.gender.toUpperCase());
  doc.text(`Age/Gender: ${ageGender.join(' / ') || '—'}`, 18, y + 19);
  doc.text(`Phone: ${prescription.patient?.phone || '—'}  |  MRN: PT-${prescription.patient_id}`, 18, y + 25);

  // Doctor Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('PRESCRIBING DOCTOR', 112, y + 6);

  const docName = prescription.doctor?.name
    ? (prescription.doctor.name.startsWith('Dr') ? prescription.doctor.name : `Dr. ${prescription.doctor.name}`)
    : 'Dr. Physician';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(docName, 112, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('MBBS, MD — Consultant Physician', 112, y + 19);
  doc.text(`Date: ${rxDate}`, 112, y + 25);

  y += 36;

  // ── Rx Symbol Header ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('Rx', 14, y);
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text('Prescribed Medicines', 25, y);

  y += 4;

  // ── Medicines Table ────────────────────────────────────────────────────────
  const medicines = prescription.medicines || [];
  const tableData = medicines.map((med, idx) => [
    idx + 1,
    med.name || '—',
    med.dosage || '—',
    med.frequency || '—',
    med.duration || '—',
    med.instructions || '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: darkColor,
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25 },
      5: { cellWidth: 42 },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // ── Clinical Notes ─────────────────────────────────────────────────────────
  if (prescription.notes) {
    doc.setFillColor(254, 249, 195); // Light yellow #fef9c3
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(14, finalY, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(161, 98, 7);
    doc.text('DOCTOR ADVICE / NOTES:', 18, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(prescription.notes, 18, finalY + 13, { maxWidth: 174 });

    finalY += 28;
  } else {
    finalY += 10;
  }

  // ── Footer & Signature Line ────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.height;
  const signatureY = Math.max(finalY + 20, pageHeight - 35);

  doc.setDrawColor(203, 213, 225);
  doc.line(140, signatureY, 196, signatureY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text(docName, 168, signatureY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Authorized Medical Practitioner', 168, signatureY + 9, { align: 'center' });

  // Page Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Computer-generated medical prescription document | Qurelio Health SaaS System', 105, pageHeight - 10, { align: 'center' });

  if (returnBlobUri) {
    return doc.output('bloburl');
  } else {
    doc.save(`Prescription_${rxNumber}.pdf`);
  }
}

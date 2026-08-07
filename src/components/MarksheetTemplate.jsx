import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export default function MarksheetTemplate({ student, course, termName }) {
  const qrRef = useRef(null);
  const barcodeRef = useRef(null);
  
  const marksheet = student.marksheets[termName] || { dmcNo: '', issueDate: '', marks: {} };
  
  // Find subjects for this course and term
  const subjects = (course && course.terms && course.terms[termName]) ? course.terms[termName] : [];

  // Calculate totals
  let totalMax = 0;
  let totalMin = 0;
  let totalObtained = 0;
  let hasFailedSubject = false;
  let allSubjectsEntered = true;

  subjects.forEach(sub => {
    const ob = marksheet.marks[sub.code];
    totalMax += sub.maxMarks;
    totalMin += sub.minMarks;
    if (ob !== undefined && ob !== '') {
      const marksNum = parseInt(ob) || 0;
      totalObtained += marksNum;
      if (marksNum < sub.minMarks) {
        hasFailedSubject = true;
      }
    } else {
      allSubjectsEntered = false;
    }
  });

  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
  
  let division = '—';
  let overallResult = 'PENDING';

  if (allSubjectsEntered && subjects.length > 0) {
    if (hasFailedSubject) {
      overallResult = 'FAIL';
    } else {
      overallResult = 'PASS';
      const pct = parseFloat(percentage);
      if (pct >= 60) division = 'FIRST DIVISION';
      else if (pct >= 45) division = 'SECOND DIVISION';
      else if (pct >= 33) division = 'THIRD DIVISION';
      else {
        overallResult = 'FAIL';
      }
    }
  }

  // Convert number to words helper
  const numberToWords = (num) => {
    const a = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    if (num === 0) return 'ZERO';
    if (num < 0) return 'MINUS ' + numberToWords(Math.abs(num));
    
    let words = '';
    
    if (Math.floor(num / 100) > 0) {
      words += numberToWords(Math.floor(num / 100)) + ' HUNDRED ';
      num %= 100;
    }
    
    if (num > 0) {
      if (words !== '') words += 'AND ';
      if (num < 20) {
        words += a[num];
      } else {
        words += b[Math.floor(num / 10)];
        if (num % 10 > 0) {
          words += '-' + a[num % 10];
        }
      }
    }
    
    return words.trim();
  };

  useEffect(() => {
    // Generate QR Code
    if (qrRef.current) {
      const qrData = `Name: ${student.name}\nFather: ${student.fatherName}\nMother: ${student.motherName}\nDOB: ${student.dob}\nEnrollment: ${student.enrollmentNo}\nCourse: ${student.course}\nSession: ${student.session}\nTerm: ${termName}\nResult: ${overallResult}\nPercentage: ${percentage}%`;
      QRCode.toCanvas(qrRef.current, qrData, {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error(err);
      });
    }

    // Generate Barcode
    if (barcodeRef.current && student.enrollmentNo) {
      try {
        JsBarcode(barcodeRef.current, student.enrollmentNo, {
          format: 'CODE128',
          width: 1.2,
          height: 35,
          displayValue: false, // human cant read it (per request)
          margin: 0
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [student, termName, overallResult, percentage]);

  return (
    <div className="print-container marksheet-layout">
      {/* Background Image Container */}
      <img src="/Marksheet Background.jpg" alt="Border" className="marksheet-bg" />

      {/* Content overlay */}
      <div className="marksheet-overlay">
        {/* Header Block */}
        <div className="marksheet-header">
          <div className="dmc-top-line">DMC : {marksheet.dmcNo}</div>
          <img src="/brand-logo.png" alt="University Logo" className="marksheet-logo" />
          <h1 className="univ-title">GURUKUL VIDHYAPEETH UNIVERSITY</h1>
          <p className="univ-loc">NAMCHI, SIKKIM</p>
          <div className="marksheet-badge">STATEMENT OF MARKS</div>
        </div>

        {/* Student Details Section */}
        <table className="student-info-table">
          <tbody>
            <tr>
              <td className="info-label">STUDENT NAME:</td>
              <td className="info-val" colSpan={3}>{student.name.toUpperCase()}</td>
              <td className="student-photo-cell" rowSpan={4}>
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="student-photo" />
                ) : (
                  <div className="no-photo-box">PHOTO</div>
                )}
              </td>
            </tr>
            <tr>
              <td className="info-label">FATHER NAME:</td>
              <td className="info-val" colSpan={3}>{student.fatherName.toUpperCase()}</td>
            </tr>
            <tr>
              <td className="info-label">MOTHER NAME:</td>
              <td className="info-val" colSpan={3}>{student.motherName.toUpperCase()}</td>
            </tr>
            <tr>
              <td className="info-label">ROLL NO:</td>
              <td className="info-val"><strong>{student.rollNo}</strong></td>
              <td className="info-label">ENROLLMENT NO:</td>
              <td className="info-val"><strong>{student.enrollmentNo}</strong></td>
            </tr>
            <tr>
              <td className="info-label">COURSE:</td>
              <td className="info-val" colSpan={2}>{student.course.toUpperCase()}</td>
              <td className="info-label">SEMESTER/YEAR:</td>
              <td className="info-val">{termName.toUpperCase()}</td>
            </tr>
            <tr>
              <td className="info-label">SESSION:</td>
              <td className="info-val" colSpan={2}>{student.session.toUpperCase()}</td>
              <td className="info-label">DATE OF BIRTH:</td>
              <td className="info-val">{student.dob}</td>
            </tr>
          </tbody>
        </table>

        {/* Marks Table */}
        <table className="marks-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>SUB CODE</th>
              <th style={{ width: '53%', textAlign: 'left' }}>SUBJECT TITLE</th>
              <th style={{ width: '11%' }}>MAX MARKS</th>
              <th style={{ width: '11%' }}>MIN MARKS</th>
              <th style={{ width: '13%' }}>OBTAINED</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length > 0 ? (
              subjects.map((sub, index) => {
                const mark = marksheet.marks[sub.code];
                const isFail = mark !== undefined && mark !== '' && parseInt(mark) < sub.minMarks;
                return (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{sub.code}</td>
                    <td style={{ textAlign: 'left' }}>{sub.name.toUpperCase()}</td>
                    <td style={{ textAlign: 'center' }}>{sub.maxMarks}</td>
                    <td style={{ textAlign: 'center' }}>{sub.minMarks}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: isFail ? '#d32f2f' : 'inherit' }}>
                      {mark !== undefined && mark !== '' ? mark : '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>NO SUBJECTS FOUND FOR THIS COURSE</td>
              </tr>
            )}
            
            {/* Fill empty rows to make the table look standard and full */}
            {subjects.length > 0 && subjects.length < 8 && (
              Array.from({ length: 8 - subjects.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals Summary Table */}
        <table className="summary-table">
          <tbody>
            <tr>
              <td className="summary-label" style={{ width: '25%' }}>GRAND TOTAL:</td>
              <td className="summary-val" style={{ width: '25%' }}>
                {totalObtained} / {totalMax}
              </td>
              <td className="summary-label" style={{ width: '25%' }}>PERCENTAGE:</td>
              <td className="summary-val" style={{ width: '25%' }}>{percentage}%</td>
            </tr>
            <tr>
              <td className="summary-label">RESULT:</td>
              <td className="summary-val" style={{ fontWeight: '700', color: overallResult === 'FAIL' ? '#d32f2f' : '#2e7d32' }}>
                {overallResult}
              </td>
              <td className="summary-label">DIVISION:</td>
              <td className="summary-val" style={{ fontWeight: '600' }}>{division}</td>
            </tr>
            <tr>
              <td className="summary-label">TOTAL IN WORDS:</td>
              <td className="summary-val" colSpan={3} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                {totalObtained > 0 ? `${numberToWords(totalObtained)} ONLY` : '—'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Area with Barcode, Date of Issue, QR, Monogram & Signature */}
        <div className="marksheet-footer">
          <div className="footer-left-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2mm' }}>
            <div className="barcode-container">
              <svg ref={barcodeRef} style={{ width: '42mm', height: '10mm' }}></svg>
            </div>
            <div className="date-issue-text" style={{ fontSize: '8.5pt', fontWeight: 'bold' }}>
              DATE OF ISSUE: {marksheet.issueDate}
            </div>
          </div>
          
          <div className="footer-center-col" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1mm' }}>
            <canvas ref={qrRef} className="qr-code-canvas-new" style={{ width: '18mm', height: '18mm' }}></canvas>
          </div>
          
          <div className="footer-right-col" style={{ display: 'flex', alignItems: 'flex-end', gap: '4mm' }}>
            <div className="signature-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45mm' }}>
              <img src="/Signature.png" alt="Controller Signature" className="signature-img" style={{ height: '10mm', objectFit: 'contain', marginBottom: '-2mm', zIndex: 2 }} />
              <div className="signature-line" style={{ width: '100%', borderTop: '1px solid #000', marginTop: '1mm' }}></div>
              <div className="signature-title" style={{ fontSize: '7.5pt', fontWeight: 'bold', marginTop: '1.5mm', textAlign: 'center', whiteSpace: 'nowrap' }}>CONTROLLER OF EXAMINATIONS</div>
            </div>
            <div className="monogram-box" style={{ paddingBottom: '1mm' }}>
              <img src="/Monogram.png" alt="Monogram Logo" style={{ width: '16mm', height: '16mm', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Style block specifically for Print scaling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .marksheet-layout {
          width: 210mm;
          height: 297mm;
          position: relative;
          background: #fff;
          color: #000;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .marksheet-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        
        .marksheet-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          padding: 24mm 18mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .marksheet-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 5mm;
          border-bottom: 2px solid #000;
          padding-bottom: 3mm;
          position: relative;
          width: 100%;
        }

        .dmc-top-line {
          position: absolute;
          top: -4mm;
          right: 6mm;
          font-size: 9.5pt;
          font-weight: bold;
          color: #000;
          font-family: monospace;
        }

        .marksheet-logo {
          height: 14mm;
          object-fit: contain;
          margin-bottom: 2mm;
          max-width: 120mm;
        }

        .univ-title {
          font-family: Arial, sans-serif;
          font-size: 19pt;
          font-weight: 800;
          color: #0d2149;
          margin: 0;
          line-height: 1.1;
          letter-spacing: 0.5px;
          text-align: center;
        }

        .univ-loc {
          font-family: Arial, sans-serif;
          font-size: 9.5pt;
          font-weight: bold;
          color: #333;
          margin: 1mm 0 2mm 0;
          letter-spacing: 1.5px;
          text-align: center;
        }

        .marksheet-badge {
          display: inline-block;
          background: #0d2149;
          color: #fff;
          font-family: Arial, sans-serif;
          font-size: 9pt;
          font-weight: bold;
          padding: 1mm 4mm;
          letter-spacing: 2px;
          border-radius: 2px;
          text-align: center;
        }

        .dmc-label {
          font-size: 7.5pt;
          font-weight: bold;
          color: #555;
          margin-bottom: 0.5mm;
        }

        .dmc-val {
          font-size: 11pt;
          font-weight: bold;
          color: #c62828;
          font-family: monospace;
        }

        .student-info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4mm;
          font-size: 8.5pt;
        }

        .student-info-table td {
          padding: 1.2mm 2mm;
          vertical-align: middle;
          border: 1px solid #ddd;
        }

        .info-label {
          font-weight: bold;
          color: #333;
          background-color: #f5f5f5;
          width: 18%;
        }

        .info-val {
          color: #000;
          font-weight: 500;
        }

        .student-photo-cell {
          width: 24mm;
          text-align: center;
          padding: 1mm !important;
          background-color: #fff !important;
          vertical-align: middle;
        }

        .student-photo {
          width: 22mm;
          height: 26mm;
          object-fit: cover;
          border: 1px solid #333;
          display: block;
          margin: 0 auto;
        }

        .no-photo-box {
          width: 22mm;
          height: 26mm;
          border: 1px dashed #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7pt;
          color: #666;
          margin: 0 auto;
        }

        .marks-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4mm;
          font-size: 8.5pt;
        }

        .marks-table th {
          background-color: #0d2149;
          color: #fff;
          font-weight: bold;
          padding: 1.8mm 2mm;
          border: 1px solid #000;
          font-size: 8pt;
        }

        .marks-table td {
          padding: 1.6mm 2.2mm;
          border: 1px solid #000;
          text-align: center;
        }

        .empty-row td {
          padding: 2.2mm !important;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6mm;
          font-size: 8.5pt;
        }

        .summary-table td {
          padding: 1.8mm 2.2mm;
          border: 1px solid #000;
        }

        .summary-label {
          font-weight: bold;
          background-color: #f5f5f5;
          color: #333;
        }

        .summary-val {
          font-weight: 500;
        }

        .marksheet-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 2mm;
          border-top: 1px dashed #000;
          margin-bottom: 8mm; /* Shifts barcode, QR, and signature elements upwards */
        }

        .footer-left {
          display: flex;
          align-items: flex-end;
          width: 45%;
        }

        .barcode-box {
          display: flex;
          align-items: flex-end;
        }

        .marksheet-qr-date-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: 2mm;
          margin-bottom: 2mm;
          gap: 1mm;
        }

        .qr-code-canvas-new {
          width: 19mm !important;
          height: 19mm !important;
          border: 1px solid #ddd;
        }

        .date-issue-box-new {
          font-size: 8pt;
          font-weight: bold;
          color: #000;
          letter-spacing: 0.5px;
        }

        .footer-right {
          width: 45%;
          display: flex;
          justify-content: flex-end;
        }

        .signature-area {
          text-align: center;
          width: 48mm;
        }

        .signature-img {
          height: 10mm;
          object-fit: contain;
          margin-bottom: 1mm;
        }

        .signature-line {
          width: 100%;
          border-top: 1.5px solid #000;
          margin-bottom: 1.5mm;
        }

        .signature-title {
          font-size: 7pt;
          font-weight: bold;
          color: #333;
          letter-spacing: 0.5px;
        }
      ` }} />
    </div>
  );
}

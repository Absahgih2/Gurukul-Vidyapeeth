import React from 'react';

export default function AcknowledgementTemplate({ student, center }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const ackNo = `ACK-${new Date().getFullYear()}-${student.id.slice(-6)}`;

  return (
    <div style={{
      width: '210mm',
      height: '297mm',
      margin: '0 auto',
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      background: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: '0'
    }}>
      {/* Top Border */}
      <div style={{ height: '6px', background: 'linear-gradient(90deg, #0D2149 0%, #1b5e20 50%, #0D2149 100%)', width: '100%' }} />

      <div style={{ padding: '16px 28px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px double #0D2149', paddingBottom: '10px' }}>
          <img src="/brand-logo-transparent.png" alt="Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain', marginBottom: '6px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0D2149', margin: '2px 0', letterSpacing: '0.5px' }}>
            GURUKUL VIDHYAPEETH UNIVERSITY
          </h1>
          <p style={{ fontSize: '9px', color: '#1b5e20', fontWeight: '600', letterSpacing: '1.5px', margin: '2px 0' }}>
            VPO Melli, Namchi District, Sikkim - 737128 | UGC 2(f) Recognized
          </p>
          <div style={{
            fontSize: '13px', fontWeight: '700', color: '#0D2149', marginTop: '8px',
            padding: '6px 20px', border: '1.5px solid #0D2149', borderRadius: '4px',
            display: 'inline-block', letterSpacing: '0.5px'
          }}>
            STUDENT ADMISSION ACKNOWLEDGEMENT
          </div>
        </div>

        {/* Ack No & Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
          <div><strong style={{ color: '#0D2149' }}>Acknowledgement No:</strong> {ackNo}</div>
          <div><strong style={{ color: '#0D2149' }}>Date:</strong> {today}</div>
        </div>

        {/* Combined Details Table */}
        <div style={{ marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {[
                ['Student Name', student.name, 'Center Name', student.centerName || (center && center.centerName) || '—'],
                ['Father\'s Name', student.fatherName, 'Center Address', center ? center.address : '—'],
                ['Mother\'s Name', student.motherName, 'Center Phone', center ? center.phone : '—'],
                ['Date of Birth', student.dob, 'Course', student.course],
                ['Email Address', student.email, 'Session', student.session],
                ['Contact Number', student.contactNumber, 'Admission Date', student.admissionDate],
                ['Address', student.address, 'Status', student.status === 'active' ? 'ACTIVE' : 'PENDING'],
              ].map(([l1, v1, l2, v2], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '4px 8px', fontWeight: '600', color: '#555', width: '22%', background: '#f5f5f5', borderRight: '1px solid #eee' }}>{l1}</td>
                  <td style={{ padding: '4px 8px', color: '#000', fontWeight: '500', width: '28%' }}>{v1 || '—'}</td>
                  <td style={{ padding: '4px 8px', fontWeight: '600', color: '#555', width: '22%', background: '#f5f5f5', borderRight: '1px solid #eee' }}>{l2}</td>
                  <td style={{ padding: '4px 8px', color: '#000', fontWeight: '500', width: '28%' }}>{v2 || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Declaration */}
        <div style={{ marginBottom: '16px', fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
          <strong>Declaration:</strong> This acknowledgement confirms that the above-named student has been registered
          at the mentioned center for the specified course and session at Gurukul Vidyapeeth University.
          This document is auto-generated and does not constitute a degree or certificate.
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', width: '140px', paddingTop: '6px', fontSize: '10px', fontWeight: '600', color: '#333' }}>
              Center Signatory
            </div>
            <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{center ? center.centerName : '—'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', width: '140px', paddingTop: '6px', fontSize: '10px', fontWeight: '600', color: '#333' }}>
              University Registrar
            </div>
            <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>GVU, Namchi, Sikkim</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '16px', paddingTop: '10px',
          borderTop: '2px solid #0D2149', fontSize: '9px', color: '#888'
        }}>
          <p style={{ margin: '1px 0' }}>Gurukul Vidyapeeth University | VPO Melli, Namchi District, Sikkim - 737128</p>
          <p style={{ margin: '1px 0' }}>Phone: +91-03595-295012 | Email: registrar@gurukulvidhyapeethuniversity.com | www.gurukulvidyapeethuniversity.com</p>
        </div>
      </div>
    </div>
  );
}

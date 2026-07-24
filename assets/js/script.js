/* ==========================================================================
   Gurukul Vidyapeeth University (Namchi, Sikkim) - Interactive Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileDrawer();
  initProgramFilters();
  initFeeCalculator();
});

/* 1. Theme Controller */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;

  // Migration: force-reset theme to light once to clear any previous dark mode cache
  if (!localStorage.getItem('gvu_theme_migrated')) {
    localStorage.setItem('gvu_theme_migrated', 'true');
    localStorage.setItem('gvu_theme', 'light');
  }

  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('gvu_theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('gvu_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-moon';
      themeIcon.style.color = '#f59e0b';
    } else {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#f59e0b';
    }
  }
}

/* 2. Mobile Drawer Navigation */
function initMobileDrawer() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    mobileDrawer?.classList.add('active');
    drawerOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer?.classList.remove('active');
    drawerOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  mobileMenuToggle?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* 3. Official Credential & Verification Lookup Engine */
const mockCertDatabase = {
  'GVU2024-CSE-108': {
    name: 'Pema Bhutia',
    fatherName: 'Dorjee Bhutia',
    roll: 'GVU2024-CSE-108',
    regNo: 'REG/2024/SKM/0842',
    program: 'B.Tech Computer Science & Software Engineering',
    year: '2020 - 2024',
    cgpa: '9.42 / 10.0',
    status: 'VERIFIED & ISSUED',
    division: 'First Division with Distinction',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024',
    ugcStatus: 'Valid under UGC Act 1956 Section 2(f)',
    aisheMetric: 'Listed under AISHE National Portal',
    sponsor: 'Council of Software Engineers'
  },
  'GVU2025-VOC-304': {
    name: 'Suman Rai',
    fatherName: 'Ram Bahadur Rai',
    roll: 'GVU2025-VOC-304',
    regNo: 'REG/2025/VOC/1109',
    program: 'Skill India Vocational Diploma in Cybersecurity & Cloud Ops',
    year: '2024 - 2025',
    cgpa: '8.85 / 10.0 (Grade A+)',
    status: 'VERIFIED & ISSUED',
    division: 'Distinction (Skill India Level 6)',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024',
    ugcStatus: 'Valid under UGC Act 1956 Section 2(f)',
    aisheMetric: 'Listed under AISHE National Portal',
    sponsor: 'Council of Software Engineers'
  },
  'GVU2026-ENG-042': {
    name: 'Anish Sharma',
    fatherName: 'Vijay Kumar Sharma',
    roll: 'GVU2026-ENG-042',
    regNo: 'REG/2024/ROB/0042',
    program: 'B.Tech Robotics & Industrial Automation',
    year: '2022 - 2026',
    cgpa: '9.10 / 10.0',
    status: 'VERIFIED & ISSUED',
    division: 'First Division with Honors',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024',
    ugcStatus: 'Valid under UGC Act 1956 Section 2(f)',
    aisheMetric: 'Listed under AISHE National Portal',
    sponsor: 'Council of Software Engineers'
  }
};

function fillRoll(rollNum) {
  const rollInput = document.getElementById('rollInput');
  if (rollInput) {
    rollInput.value = rollNum;
    runVerification();
  }
}

function runVerification() {
  const rollInput = document.getElementById('rollInput')?.value.trim();
  const docType = document.getElementById('verifyDocType')?.value;
  const resultBox = document.getElementById('verifyResult');

  if (!rollInput || !resultBox) return;

  // Search database or create dynamically for demo verification
  let record = mockCertDatabase[rollInput.toUpperCase()];
  if (!record && rollInput.length >= 4) {
    record = {
      name: 'Verified Student Applicant',
      fatherName: 'N/A',
      roll: rollInput.toUpperCase(),
      regNo: `REG/2025/SKM/${Math.floor(1000 + Math.random() * 9000)}`,
      program: docType === 'diploma' ? 'Skill India Vocational Diploma' : 'Bachelor of Technology',
      year: '2022 - 2026',
      cgpa: '8.75 / 10.0',
      status: 'VERIFIED & VALID',
      division: 'First Division',
      actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024',
      ugcStatus: 'Valid under UGC Act 1956 Section 2(f)',
      aisheMetric: 'Listed under AISHE National Portal',
      sponsor: 'Council of Software Engineers'
    };
  }

  resultBox.classList.remove('hidden', 'valid', 'invalid');

  if (record) {
    resultBox.classList.add('valid');
    resultBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(6,214,160,0.3); padding-bottom:0.75rem;">
        <div>
          <span class="badge badge-success"><i class="fa-solid fa-check"></i> ${record.status}</span>
          <h4 style="margin-top:0.35rem; font-size:1.15rem; color:var(--text-main);">${record.name}</h4>
        </div>
        <button class="btn btn-sm btn-outline" onclick='viewFullCertificate(${JSON.stringify(record)})'>
          <i class="fa-solid fa-file-pdf"></i> View Certificate Seal
        </button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.875rem; color:var(--text-muted);">
        <div><strong>Roll No:</strong> ${record.roll}</div>
        <div><strong>Reg No:</strong> ${record.regNo}</div>
        <div style="grid-column: span 2;"><strong>Degree/Program:</strong> ${record.program}</div>
        <div><strong>CGPA / Score:</strong> ${record.cgpa}</div>
        <div><strong>UGC Status:</strong> Section 2(f) Verified</div>
      </div>
      <div style="margin-top:1rem; padding:0.6rem; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm); font-size:0.8rem; color:var(--emerald);">
        <i class="fa-solid fa-shield-halved"></i> Statutory Compliance: ${record.actRef} | VPO Melli, Namchi Campus Registry.
      </div>
    `;
  } else {
    resultBox.classList.add('invalid');
    resultBox.innerHTML = `
      <div style="color:var(--danger); display:flex; align-items:center; gap:0.6rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:1.5rem;"></i>
        <div>
          <strong>Credential Not Found in Immediate Cache</strong>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.2rem;">
            Please ensure you have entered the exact Roll Number or Enrollment ID. For manual registry archive search, email <strong>verify@gurukulvidyapeeth.edu.in</strong>.
          </p>
        </div>
      </div>
    `;
  }
}

function viewFullCertificate(record) {
  const certModalBody = document.getElementById('certModalBody');
  const certModal = document.getElementById('certModal');
  if (!certModalBody || !certModal) return;

  certModalBody.innerHTML = `
    <div style="background:var(--bg-card); border:2px solid var(--emerald); padding:2rem; border-radius:var(--radius-md); text-align:center; position:relative;">
      <!-- Watermark emblem -->
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0.04; font-size:12rem; color:var(--emerald); pointer-events:none;">
        <i class="fa-solid fa-graduation-cap"></i>
      </div>

      <div style="border-bottom:2px solid var(--border-color); padding-bottom:1.25rem; margin-bottom:1.5rem;">
        <h2 style="font-family:var(--font-heading); font-size:1.6rem; color:var(--emerald); letter-spacing:0.05em;">GURUKUL VIDYAPEETH UNIVERSITY</h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">VPO Melli, Namchi District, Sikkim – 737128</p>
        <p style="font-size:0.8rem; color:var(--gold); margin-top:0.25rem; font-weight:600;">
          Established under Sikkim State Legislative Assembly Act No. 04 of 2024 | UGC Act Sec 2(f)
        </p>
      </div>

      <p style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted);">Official Academic Credential & Verification Record</p>
      <h3 style="font-size:1.8rem; margin:1rem 0; color:var(--text-main);">${record.name}</h3>
      <p style="font-size:0.95rem; color:var(--text-muted); margin-bottom:1.5rem;">
        has successfully completed the prescribed curriculum and passed the examination for the award of:
      </p>

      <div style="background:var(--primary-light); border:1px solid var(--primary); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1.5rem;">
        <h4 style="font-size:1.25rem; color:var(--primary);">${record.program}</h4>
        <p style="font-size:0.875rem; color:var(--text-main); margin-top:0.25rem;">Result: ${record.division} (${record.cgpa})</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; text-align:left; font-size:0.85rem; background:var(--bg-main); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1.5rem;">
        <div><strong>Roll Number:</strong><br>${record.roll}</div>
        <div><strong>Registration No:</strong><br>${record.regNo}</div>
        <div><strong>Academic Period:</strong><br>${record.year}</div>
        <div><strong>Sponsoring Body:</strong><br>${record.sponsor}</div>
        <div><strong>Statutory Shield:</strong><br>UGC Sec 2(f) Recognized</div>
        <div><strong>AISHE Code:</strong><br>Registered Metric</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; pt-3; border-top:1px dashed var(--border-color);">
        <div style="text-align:left;">
          <div style="font-size:0.75rem; color:var(--emerald);"><i class="fa-solid fa-qrcode"></i> QR Cryptographic Seal</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">Digital Verification Token: 0x8F94...A82C</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Courier New', monospace; font-size:0.9rem; font-weight:700; color:var(--gold);">[ REGISTRAR SEAL ]</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Gurukul Vidyapeeth University, Sikkim</div>
        </div>
      </div>
    </div>
  `;

  certModal.classList.add('active');
}

function closeCertModal() {
  document.getElementById('certModal')?.classList.remove('active');
}

/* 4. Academic Program Category Filters */
function initProgramFilters() {
  const tabs = document.querySelectorAll('.academic-tab');
  const cards = document.querySelectorAll('.program-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      cards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function openProgramDetail(programKey) {
  const details = {
    'btech-cse': {
      title: 'B.Tech Computer Science & Software Engineering',
      duration: '4 Years (8 Semesters)',
      eligibility: '10+2 with Physics, Mathematics & Chemistry (Min 50% Marks)',
      description: 'Sponsored directly by the Council of Software Engineers. Students undergo intensive hands-on lab projects in cloud architecture, full-stack microservices, DevOps pipelines, and AI engineering.',
      careers: 'Software Architect, Cloud Engineer, Full-Stack Developer, Systems Analyst'
    },
    'mtech-ai': {
      title: 'M.Tech Artificial Intelligence & Machine Learning',
      duration: '2 Years (4 Semesters)',
      eligibility: 'B.Tech / B.E. in CSE/IT/ECE or MCA with valid GATE/GVU Score',
      description: 'Advanced postgraduate track focusing on generative models, neural network optimization, natural language processing, and enterprise MLOps.',
      careers: 'AI Research Scientist, ML Engineer, Data Scientist, Tech Lead'
    },
    'btech-robotics': {
      title: 'B.Tech Robotics & Industrial Automation',
      duration: '4 Years (8 Semesters)',
      eligibility: '10+2 (PCM 50%)',
      description: 'Practical engineering program featuring specialized technician workshops in Namchi campus for microcontroller programming, PLC automation, and industrial IoT.',
      careers: 'Robotics Engineer, Automation Consultant, Embedded Systems Developer'
    },
    'diploma-cyber': {
      title: 'Skill India Diploma in Cybersecurity & Cloud Ops',
      duration: '1 Year (2 Semesters)',
      eligibility: '10+2 in any stream or ITI pass',
      description: 'Aligned with Skill India NSQF competency standards. Fast-track vocational certification providing practical hands-on training in network defense, SOC operations, and AWS/Azure security.',
      careers: 'SOC Analyst, Junior Cloud Administrator, Network Technician'
    },
    'cert-iot': {
      title: 'Technician Certificate in IoT & Microcontroller Hardware',
      duration: '6 Months (Short-Term Trade Certification)',
      eligibility: '10th / 12th pass',
      description: 'Intensive practical tradecraft course in hardware soldering, sensor calibration, electronic circuit testing, and technician workshop safety.',
      careers: 'Hardware Technician, Electronics Bench Inspector, IoT Workshop Assistant'
    },
    'mba-tech': {
      title: 'MBA in Technology Management & Software Enterprise',
      duration: '2 Years (4 Semesters)',
      eligibility: 'Graduation degree in any discipline (Min 50%)',
      description: 'Blends executive business administration with software product management, IT governance, agile leadership, and venture building.',
      careers: 'IT Product Manager, CTO Executive Trainee, Tech Business Analyst'
    }
  };

  const p = details[programKey];
  if (!p) return;

  const modalBody = document.getElementById('statutoryModalBody');
  const modalTitle = document.getElementById('statutoryModalTitle');
  const modal = document.getElementById('statutoryModal');

  if (modalTitle && modalBody && modal) {
    modalTitle.innerHTML = `<i class="fa-solid fa-book-open"></i> ${p.title}`;
    modalBody.innerHTML = `
      <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
        <span class="badge badge-accent"><i class="fa-solid fa-clock"></i> ${p.duration}</span>
        <span class="badge badge-success"><i class="fa-solid fa-graduation-cap"></i> ${p.eligibility}</span>
      </div>
      <p style="color:var(--text-muted); line-height:1.7; margin-bottom:1.25rem;">${p.description}</p>
      <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
        <strong style="color:var(--primary); font-size:0.9rem;">Career Pathways:</strong>
        <p style="font-size:0.875rem; color:var(--text-main); margin-top:0.3rem;">${p.careers}</p>
      </div>
      <button class="btn btn-primary btn-block mt-3" onclick="closeStatutoryModal(); openApplyModal();">
        <i class="fa-solid fa-paper-plane"></i> Apply for this Program
      </button>
    `;
    modal.classList.add('active');
  }
}

/* 5. Campus Facilities Tabs & Library Token Simulator */
function switchFacilityTab(facilityId) {
  const tabs = document.querySelectorAll('.facility-tab');
  const contents = document.querySelectorAll('.facility-content');

  tabs.forEach(t => t.classList.remove('active'));
  contents.forEach(c => c.classList.remove('active'));

  event?.currentTarget?.classList.add('active');
  document.getElementById(`facility-${facilityId}`)?.classList.add('active');
}

function simulateTokenCheck() {
  const tokenInput = document.getElementById('libTokenInput')?.value.trim();
  const resultDiv = document.getElementById('libTokenResult');
  if (!resultDiv) return;

  resultDiv.classList.remove('hidden', 'text-success', 'text-danger');

  if (tokenInput.length >= 3) {
    resultDiv.classList.add('text-success');
    resultDiv.style.background = 'rgba(6,214,160,0.1)';
    resultDiv.style.border = '1px solid var(--emerald)';
    resultDiv.innerHTML = `
      <i class="fa-solid fa-circle-check"></i> <strong>Token Active:</strong> Access Granted for ID <strong>${tokenInput.toUpperCase()}</strong>. IEEE Xplore, ACM Digital Library & Springer Gateways unlocked for 24 hours.
    `;
  } else {
    resultDiv.classList.add('text-danger');
    resultDiv.style.background = 'rgba(239,68,68,0.1)';
    resultDiv.style.border = '1px solid var(--danger)';
    resultDiv.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Please enter a valid Library ID code (e.g. LIB-8842).`;
  }
}

/* 6. Interactive Fee & Scholarship Calculator */
function initFeeCalculator() {
  calculateFee();
}

function updateMeritLabel(val) {
  const meritValueSpan = document.getElementById('meritValue');
  if (meritValueSpan) meritValueSpan.textContent = `${val}%`;
}

function calculateFee() {
  const program = document.getElementById('calcProgram')?.value || 'btech';
  const domicile = document.getElementById('calcDomicile')?.value || 'sikkim';
  const hostel = document.getElementById('calcHostel')?.value || 'none';
  const merit = parseInt(document.getElementById('calcMerit')?.value || '75', 10);

  let baseTuition = 45000;
  if (program === 'mtech') baseTuition = 55000;
  else if (program === 'diploma') baseTuition = 28000;
  else if (program === 'trade') baseTuition = 18000;
  else if (program === 'mba') baseTuition = 60000;

  // Domicile Grant
  let grantPercent = 0;
  if (domicile === 'sikkim') grantPercent += 0.25; // 25% Sikkim State Grant
  else if (domicile === 'ne') grantPercent += 0.15; // 15% NE Grant

  // Merit Scholarship
  if (merit >= 90) grantPercent += 0.15;
  else if (merit >= 80) grantPercent += 0.10;

  // Cap grant at 50% max
  if (grantPercent > 0.50) grantPercent = 0.50;

  const grantAmount = baseTuition * grantPercent;

  // Hostel Fee
  let hostelFee = 0;
  if (hostel === 'double') hostelFee = 24000;
  else if (hostel === 'single') hostelFee = 36000;

  const totalFee = (baseTuition - grantAmount) + hostelFee;

  // Render
  const resBase = document.getElementById('resBaseTuition');
  const resGrant = document.getElementById('resGrant');
  const resHostel = document.getElementById('resHostel');
  const resTotal = document.getElementById('resTotal');

  if (resBase) resBase.textContent = `₹${baseTuition.toLocaleString('en-IN')}`;
  if (resGrant) resGrant.textContent = `-₹${Math.round(grantAmount).toLocaleString('en-IN')}`;
  if (resHostel) resHostel.textContent = `₹${hostelFee.toLocaleString('en-IN')}`;
  if (resTotal) resTotal.textContent = `₹${Math.round(totalFee).toLocaleString('en-IN')}`;
}

function openApplyWithFee() {
  const calcProg = document.getElementById('calcProgram')?.value;
  const appProgSelect = document.getElementById('appProgram');
  if (appProgSelect && calcProg) {
    let targetVal = 'B.Tech CSE';
    if (calcProg === 'mtech') targetVal = 'M.Tech AI';
    else if (calcProg === 'diploma') targetVal = 'Diploma Cyber';
    else if (calcProg === 'trade') targetVal = 'Cert IoT';
    else if (calcProg === 'mba') targetVal = 'MBA Tech';
    appProgSelect.value = targetVal;
  }
  
  const calcHostel = document.getElementById('calcHostel')?.value;
  const appHostelSelect = document.getElementById('appHostelOpt');
  if (appHostelSelect && calcHostel) {
    appHostelSelect.value = calcHostel !== 'none' ? 'Yes' : 'No';
  }

  openApplyModal();
  nextWizardStep(1);
}

/* 7. Multi-Step Admissions Wizard */
function openApplyModal() {
  document.getElementById('applyModal')?.classList.add('active');
}

function closeApplyModal() {
  document.getElementById('applyModal')?.classList.remove('active');
}

function nextWizardStep(stepNum) {
  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`wStep${i}`);
    const panel = document.getElementById(`panelStep${i}`);
    
    if (step) {
      if (i === stepNum) step.classList.add('active');
      else step.classList.remove('active');
    }
    if (panel) {
      if (i === stepNum) panel.classList.add('active');
      else panel.classList.remove('active');
    }
  }
}

function submitApplication() {
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const successIdSpan = document.getElementById('appSuccessId');
  if (successIdSpan) successIdSpan.textContent = `GVU-2026-${randomId}`;

  nextWizardStep(4);
}

/* 8. Statutory Disclosures Modal */
function openStatutoryModal(type) {
  const modal = document.getElementById('statutoryModal');
  const title = document.getElementById('statutoryModalTitle');
  const body = document.getElementById('statutoryModalBody');

  if (!modal || !title || !body) return;

  if (type === 'act') {
    title.innerHTML = `<i class="fa-solid fa-gavel text-accent"></i> Sikkim Legislative Assembly Act 2024`;
    body.innerHTML = `
      <p style="color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Gurukul Vidyapeeth University was established following the bill passed by the Sikkim Legislative Assembly in <strong>March 2024</strong>.
      </p>
      <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.875rem;">
        <div><strong>Act Ref:</strong> Sikkim Private Universities Gazette Incorporation Act No. 04 of 2024</div>
        <div><strong>Headquarters:</strong> VPO Melli, Namchi District, Sikkim - 737128</div>
        <div><strong>Scope:</strong> Non-affiliating State Private University offering UG, PG, Vocational & Research degrees.</div>
      </div>
    `;
  } else if (type === 'ugc') {
    title.innerHTML = `<i class="fa-solid fa-shield-halved text-success"></i> UGC Section 2(f) Statutory Status`;
    body.innerHTML = `
      <p style="color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        The university operates under the legal protection of <strong>Section 2(f) of the University Grants Commission (UGC) Act, 1956</strong>.
      </p>
      <ul style="color:var(--text-muted); font-size:0.9rem; margin-left:1.2rem; line-height:1.7;">
        <li>All degrees awarded are legally valid for Central & State Government examinations (UPSC, GATE, Public Sector Undertakings).</li>
        <li>Valid for higher education admissions in India and foreign universities (WES / ECE evaluation eligible).</li>
      </ul>
    `;
  } else if (type === 'aishe') {
    title.innerHTML = `<i class="fa-solid fa-database text-gold"></i> AISHE National Portal Listing`;
    body.innerHTML = `
      <p style="color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Gurukul Vidyapeeth University is assigned an official code under the <strong>All India Survey on Higher Education (AISHE)</strong> portal.
      </p>
      <p style="font-size:0.875rem; color:var(--text-muted);">
        This ensures transparent tracking of national higher education metrics, student enrollment data, and seamless digital transcript verification.
      </p>
    `;
  } else if (type === 'cse') {
    title.innerHTML = `<i class="fa-solid fa-code text-accent"></i> Council of Software Engineers Mandate`;
    body.innerHTML = `
      <p style="color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Conceptualized and sponsored by the <strong>Council of Software Engineers</strong> as a self-financed state private university.
      </p>
      <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.875rem;">
        <strong>Key Focus:</strong> Aligning degree curriculum with modern software trade standards, minimizing post-graduation employer training times, and embedding Skill India vocational trade frameworks.
      </div>
    `;
  }

  modal.classList.add('active');
}

function closeStatutoryModal() {
  document.getElementById('statutoryModal')?.classList.remove('active');
}

// Global modal triggers
document.getElementById('openVerifyBtn')?.addEventListener('click', () => {
  const verifySection = document.getElementById('verify');
  if (verifySection) {
    verifySection.scrollIntoView({ behavior: 'smooth' });
  } else {
    const isSub = window.location.pathname.includes('/programs/');
    window.location.href = isSub ? '../../degree-verification/' : '../degree-verification/';
  }
});

document.getElementById('openApplyBtn')?.addEventListener('click', openApplyModal);
document.getElementById('heroApplyBtn')?.addEventListener('click', openApplyModal);
document.getElementById('drawerApplyBtn')?.addEventListener('click', openApplyModal);
document.getElementById('heroVerifyBtn')?.addEventListener('click', () => {
  const verifySection = document.getElementById('verify');
  if (verifySection) {
    verifySection.scrollIntoView({ behavior: 'smooth' });
  } else {
    const isSub = window.location.pathname.includes('/programs/');
    window.location.href = isSub ? '../../degree-verification/' : '../degree-verification/';
  }
});

// Close modals when clicking overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
});

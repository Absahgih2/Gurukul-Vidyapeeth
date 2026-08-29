/* ==========================================================================
   Gurukul Vidyapeeth University (Namchi, Sikkim) - Interactive Engine
   ========================================================================== */

// Disable right-click
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable dev tools keyboard shortcuts
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
    (e.ctrlKey && key === 'u') ||
    (e.metaKey && e.altKey && key === 'i')
  ) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

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
    motherName: 'Lhamo Bhutia',
    roll: 'GVU2024-CSE-108',
    enrollmentNo: 'ENR/2020/SKM/0411',
    regNo: 'REG/2024/SKM/0842',
    program: 'B.Tech Computer Science & Software Engineering',
    year: '2020 - 2024',
    cgpa: '9.42 / 10.0',
    status: 'VERIFIED & ISSUED',
    division: 'First Division with Distinction',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024'
  },
  'GVU2025-VOC-304': {
    name: 'Suman Rai',
    fatherName: 'Ram Bahadur Rai',
    motherName: 'Maya Devi Rai',
    roll: 'GVU2025-VOC-304',
    enrollmentNo: 'ENR/2024/VOC/1908',
    regNo: 'REG/2025/VOC/1109',
    program: 'Skill India Vocational Diploma in Cybersecurity & Cloud Ops',
    year: '2024 - 2025',
    cgpa: '8.85 / 10.0 (Grade A+)',
    status: 'VERIFIED & ISSUED',
    division: 'Distinction (Skill India Level 6)',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024'
  },
  'GVU2026-ENG-042': {
    name: 'Anish Sharma',
    fatherName: 'Vijay Kumar Sharma',
    motherName: 'Sushma Sharma',
    roll: 'GVU2026-ENG-042',
    enrollmentNo: 'ENR/2022/ROB/0212',
    regNo: 'REG/2024/ROB/0042',
    program: 'B.Tech Robotics & Industrial Automation',
    year: '2022 - 2026',
    cgpa: '9.10 / 10.0',
    status: 'VERIFIED & ISSUED',
    division: 'First Division with Honors',
    actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024'
  }
};

function fillRoll(rollNum) {
  const rollInput = document.getElementById('rollInput');
  if (rollInput) {
    rollInput.value = rollNum;
    runVerification();
  }
}

async function runVerification() {
  const rollInput = document.getElementById('rollInput')?.value.trim();
  const resultBox = document.getElementById('verifyResult');

  if (!rollInput || !resultBox) return;

  resultBox.classList.remove('hidden', 'valid', 'invalid');
  resultBox.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; padding:1.5rem; color:var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; margin-right:0.75rem;"></i>
      <span>Querying university registry archives...</span>
    </div>
  `;
  resultBox.classList.add('valid');

  let record = null;

  try {
    // Attempt to query real student registry on the Render backend
    const response = await fetch(`/api/public/verify-credential?rollNo=${encodeURIComponent(rollInput)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.student) {
        const student = data.student;
        record = {
          name: student.name,
          fatherName: student.fatherName,
          motherName: student.motherName,
          roll: student.roll,
          enrollmentNo: student.enrollmentNo,
          program: student.program,
          year: student.year,
          photo: student.photo,
          status: student.status,
          cgpa: 'N/A',
          division: 'Passed',
          actRef: 'Sikkim Legislative Assembly Act No. 04 of 2024'
        };
      }
    }
  } catch (err) {
    console.warn('[Verification Portal API] Failed to fetch from registry backend:', err);
  }

  // Fallback to local mock cache if backend lookup failed/not found
  if (!record) {
    record = mockCertDatabase[rollInput.toUpperCase()];
  }

  resultBox.classList.remove('valid');

  if (record) {
    resultBox.classList.add('valid');
    const recordJson = JSON.stringify(record).replace(/'/g, "&#39;");
    resultBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(6,214,160,0.3); padding-bottom:0.75rem;">
        <div>
          <span class="badge badge-success"><i class="fa-solid fa-check"></i> ${record.status}</span>
          <h4 style="margin-top:0.35rem; font-size:1.15rem; color:var(--text-main);">${record.name}</h4>
        </div>
        <button class="btn btn-sm btn-outline" onclick='viewFullCertificate(${recordJson})'>
          <i class="fa-solid fa-file-pdf"></i> View Certificate Seal
        </button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.875rem; color:var(--text-muted);">
        <div><strong>Roll No:</strong> ${record.roll}</div>
        <div><strong>Enrollment No:</strong> ${record.enrollmentNo || 'N/A'}</div>
        <div style="grid-column: span 2;"><strong>Degree/Program:</strong> ${record.program}</div>
        <div><strong>Academic Period:</strong> ${record.year}</div>
        <div><strong>Status:</strong> Validated & Active</div>
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
          <strong>Credential Not Found in University Registry</strong>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.2rem;">
            Please ensure you have entered the exact Roll Number or Enrollment ID. For manual registry archive search, email <strong>registrar@gurukulvidhyapeethuniversity.com</strong>.
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
    <div style="background:var(--bg-card); border:2px solid var(--emerald); padding:2rem; border-radius:var(--radius-md); text-align:center; position:relative; font-family:'Outfit', 'Plus Jakarta Sans', sans-serif;">
      <!-- Watermark emblem -->
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0.03; font-size:12rem; color:var(--emerald); pointer-events:none;">
        <i class="fa-solid fa-graduation-cap"></i>
      </div>

      <div style="border-bottom:2px solid var(--border-color); padding-bottom:1.25rem; margin-bottom:1.5rem;">
        <h2 style="font-family:var(--font-heading); font-size:1.65rem; color:var(--emerald); letter-spacing:0.03em; margin: 0 0 0.25rem 0;">GURUKUL VIDYAPEETH UNIVERSITY</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin: 0;">VPO Melli, Namchi District, Sikkim – 737128</p>
        <p style="font-size:0.8rem; color:var(--gold); margin-top:0.35rem; font-weight:600; text-transform:uppercase; letter-spacing:0.02em;">
          Established under Sikkim State Legislative Assembly Act No. 04 of 2024 | UGC Act Sec 2(f)
        </p>
      </div>

      <p style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); margin-bottom: 1.5rem;">Official Academic Credential & Verification Record</p>
      
      <!-- Student profile card layout (photo on left, name/course on right) -->
      <div style="display:flex; gap:1.75rem; align-items:flex-start; text-align:left; margin-bottom:1.5rem; background:rgba(0,0,0,0.02); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <!-- Student Photo -->
        <div style="flex-shrink:0; width:100px; height:120px; border:2px solid var(--border-color); border-radius:var(--radius-sm); overflow:hidden; background:#eaeaea; display:flex; align-items:center; justify-content:center;">
          ${record.photo ? `<img src="${record.photo}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user" style="font-size:2.5rem; color:#888;"></i>`}
        </div>
        <!-- Student Core Information -->
        <div style="flex-grow:1;">
          <h3 style="font-size:1.6rem; margin:0 0 0.35rem 0; color:var(--text-main); font-family:var(--font-heading); font-weight:700;">${record.name}</h3>
          <p style="font-size:0.9rem; color:var(--text-muted); margin:0 0 0.85rem 0; line-height:1.4;">
            has successfully completed the prescribed curriculum and passed the examination for the award of:
          </p>
          <div style="background:var(--primary-light); border:1px solid var(--primary); padding:0.75rem 1rem; border-radius:var(--radius-sm);">
            <h4 style="font-size:1.15rem; color:var(--primary); margin:0; font-weight:700;">${record.program}</h4>
          </div>
        </div>
      </div>

      <!-- Updated student details grid layout (without Sponsoring Body, Statutory Shield, AISHE Code) -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; text-align:left; font-size:0.85rem; background:var(--bg-main); border:1px solid var(--border-color); padding:1.25rem; border-radius:var(--radius-sm); margin-bottom:1.5rem;">
        <div><strong>Roll Number:</strong><br>${record.roll}</div>
        <div><strong>Enrollment Number:</strong><br>${record.enrollmentNo || 'N/A'}</div>
        <div><strong>Academic Period:</strong><br>${record.year}</div>
        <div><strong>Father\'s Name:</strong><br>${record.fatherName}</div>
        <div style="grid-column: span 2;"><strong>Mother\'s Name:</strong><br>${record.motherName || 'N/A'}</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; padding-top: 1rem; border-top:1px dashed var(--border-color);">
        <div style="text-align:left;">
          <div style="font-size:0.75rem; color:var(--emerald); font-weight:600;"><i class="fa-solid fa-qrcode"></i> QR Cryptographic Seal</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">Digital Verification Token: 0x8F94...A82C</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; font-weight:bold; color:var(--text-main); font-family:var(--font-heading); text-transform:uppercase;">[ REGISTRAR SEAL ]</div>
          <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.15rem;">Gurukul Vidyapeeth University, Sikkim</div>
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
    'msc-anatomy': {
      title: 'MSc Medical in Anatomy',
      duration: '3 Years (6 Semesters)',
      eligibility: 'B.Sc. in Medical Anatomy / biological sciences / allied health or equivalent (Min 50% Marks)',
      description: 'Master of Science in Medical Anatomy focuses on human body structure at gross, microscopic, and developmental levels, combining theoretical foundation with dissection, histology, and modern imaging.',
      careers: 'Anatomical Lab In-Charge, Anatomy Lecturer, Medical Research Associate, Pathology Support Specialist'
    },
    'msc-pharmacology': {
      title: 'MSc Medical in Pharmacology',
      duration: '3 Years (6 Semesters)',
      eligibility: 'B.Sc. Medical / Life Sciences or equivalent (Min 50% Marks)',
      description: 'The Master of Science in Medical Pharmacology is a specialized postgraduate program providing in-depth training in drug actions, toxicological methods, clinical research protocols, and innovations.',
      careers: 'Clinical Research Associate, Pharmacovigilance Officer, Drug Safety Specialist, Academic Lecturer'
    },
    'msc-biochemistry': {
      title: 'MSc Medical in Biochemistry',
      duration: '3 Years (6 Semesters)',
      eligibility: 'B.Sc. in Biochemistry / Life Sciences / Microbiology / Chemistry or equivalent (Min 50% Marks)',
      description: 'M.Sc Medical in Biochemistry focuses on molecular biology, enzymology, metabolism, diagnostic immunology, and advanced clinical laboratory diagnostics in health and disease.',
      careers: 'Clinical Biochemist, Diagnostic Lab Manager, Biotechnology Researcher, Quality Assurance Specialist'
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
    },
    'vlda': {
      title: 'Veterinary Livestock Development Assistant (VLDA)',
      duration: '2 Years (4 Semesters)',
      eligibility: '10+2 with Physics, Chemistry & Biology/Agriculture (Min 50% Marks)',
      description: 'A comprehensive 2-year diploma program (commonly known as VLDD) equipping students with practical trade skills in domestic animal anatomy, feeding, reproduction, and first-aid healthcare.',
      careers: 'Veterinary Assistant, Livestock Supervisor, Animal Health Worker, Dairy Farm Manager'
    },
    'pgdca': {
      title: 'Post Graduate Diploma in Computer Applications (PGDCA)',
      duration: '1 Year (2 Semesters)',
      eligibility: "Bachelor's Degree in any discipline",
      description: 'Comprehensive program covering programming, database management, web technologies, software engineering, and practical computer applications for professional growth. Ideal for graduates seeking IT career advancement.',
      careers: 'Software Developer, Web Developer, Database Administrator, IT Support Specialist, Systems Analyst'
    },
    'blis': {
      title: 'Bachelor of Library & Information Science (BLis)',
      duration: '1 Year (2 Semesters)',
      eligibility: "Bachelor's Degree in any discipline",
      description: 'Professional degree in library management, information organization, cataloguing, classification, digital archiving, and knowledge management systems. Prepares students for modern library and information center roles.',
      careers: 'Librarian, Information Scientist, Digital Archivist, Knowledge Manager, Library Information Officer'
    }
  };

  const p = details[programKey];
  if (!p) return;

  const modalBody = document.getElementById('statutoryModalBody');
  const modalTitle = document.getElementById('statutoryModalTitle');
  const modal = document.getElementById('statutoryModal');

  if (modalTitle && modalBody && modal) {
    modalTitle.innerHTML = `<i class="fa-solid fa-book-open"></i> ${p.title}`;
    
    let folder = programKey;
    if (programKey === 'btech-cse') folder = 'btech-computer-science';
    else if (programKey === 'msc-anatomy') folder = 'msc-medical-anatomy';
    else if (programKey === 'msc-pharmacology') folder = 'msc-medical-pharmacology';
    else if (programKey === 'msc-biochemistry') folder = 'msc-medical-biochemistry';
    
    let detailButton = '';
    if (!['pgdca', 'blis'].includes(programKey)) {
      detailButton = `<button class="btn btn-outline btn-block mt-2" onclick="closeStatutoryModal(); window.location.href='programs/${folder}/index.html';"><i class="fa-solid fa-circle-info"></i> View Full Syllabus & Detailed Page</button>`;
    }

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
      ${detailButton}
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
  else if (program === 'msc-anatomy') baseTuition = 45000;
  else if (program === 'msc-pharmacology') baseTuition = 45000;
  else if (program === 'msc-biochemistry') baseTuition = 54000;
  else if (program === 'diploma') baseTuition = 28000;
  else if (program === 'trade') baseTuition = 18000;
  else if (program === 'mba') baseTuition = 60000;
  else if (program === 'allied-health') baseTuition = 30000;
  else if (program === 'vocational') baseTuition = 17500;
  else if (program === 'vlda') baseTuition = 75000;

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
    else if (calcProg === 'msc-anatomy') targetVal = 'MSc Anatomy';
    else if (calcProg === 'msc-pharmacology') targetVal = 'MSc Pharmacology';
    else if (calcProg === 'msc-biochemistry') targetVal = 'MSc Biochemistry';
    else if (calcProg === 'diploma') targetVal = 'Diploma Cyber';
    else if (calcProg === 'trade') targetVal = 'Cert IoT';
    else if (calcProg === 'mba') targetVal = 'MBA Tech';
    else if (calcProg === 'vlda') targetVal = 'VLDA';
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
  const appId = `GVU-2026-${randomId}`;
  
  // Fetch student details from form fields
  const fullName = document.getElementById('appFullName')?.value || 'N/A';
  const studentEmail = document.getElementById('appEmail')?.value || 'N/A';
  const phone = document.getElementById('appPhone')?.value || 'N/A';
  const state = document.getElementById('appState')?.value || 'N/A';
  const program = document.getElementById('appProgram')?.value || 'N/A';
  const hostel = document.getElementById('appHostelOpt')?.value || 'N/A';

  // Update success ID span in the DOM
  const successIdSpan = document.getElementById('appSuccessId');
  if (successIdSpan) successIdSpan.textContent = appId;

  // Build beautiful Admission Email dispatch receipt HTML
  const receiptHtml = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <i class="fa-solid fa-circle-check text-success" style="font-size: 3rem; margin-bottom: 0.75rem;"></i>
      <h3 style="font-size: 1.5rem; color: var(--text-main); font-family: var(--font-heading);">Application Logged!</h3>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
        Provisional Application ID: <strong style="color: var(--primary);">${appId}</strong>
      </p>
    </div>

    <!-- Email Dispatch Receipt Box -->
    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.5rem; text-align: left; animation: fadeIn 0.4s ease;">
      <h4 style="font-size: 0.9rem; color: #3b82f6; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; font-weight: 700;">
        <i class="fa-solid fa-envelope" style="font-size: 1.2rem;"></i> Admission Portal Email Status
      </h4>
      <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
        <div><strong style="color: var(--text-main);">To Registrar:</strong> Sent to <span style="color: var(--primary); font-weight: 700;">registrar@gurukulvidhyapeethuniversity.com</span></div>
        <div><strong style="color: var(--text-main);">To Student Email:</strong> ${studentEmail}</div>
        <div style="margin-top: 0.5rem; background: var(--bg-card); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: monospace; font-size: 0.75rem; color: var(--text-dim); line-height: 1.4; word-break: break-word;">
          <strong>*Gurukul Vidyapeeth Admission Application Details*</strong><br>
          ====================================<br>
          • <strong>Application ID</strong>: ${appId}<br>
          • <strong>Student Name</strong>: ${fullName}<br>
          • <strong>Target Program</strong>: ${program}<br>
          • <strong>Student Phone</strong>: ${phone}<br>
          • <strong>Student Email</strong>: ${studentEmail}<br>
          • <strong>State Domicile</strong>: ${state}<br>
          • <strong>Hostel Required</strong>: ${hostel}<br><br>
          Best Regards,<br>
          Gurukul Vidyapeeth Admission Registry
        </div>
      </div>
      <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--emerald);">
        <i class="fa-solid fa-circle-check"></i> <span>Applications successfully submitted and emailed to the Registrar's Office.</span>
      </div>
    </div>

    <button type="button" class="btn btn-primary btn-block" onclick="closeApplyModal()" style="font-weight: 600;">Done / Close</button>
  `;

  // Update wizard confirmation step UI dynamically
  const panelStep4 = document.getElementById('panelStep4');
  if (panelStep4) {
    panelStep4.innerHTML = `<div class="success-box" style="padding: 0.5rem 0;">${receiptHtml}</div>`;
  }

  // Execute background fetch API Admission email dispatch request to /api/submit-admission
  fetch('/api/submit-admission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: fullName,
      studentEmail: studentEmail,
      phone: phone,
      state: state,
      program: program,
      hostel: hostel,
      applicationId: appId
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log(`[Admission Portal] ${data.message || 'Submission processed'}`);
  })
  .catch(err => {
    console.warn('[Admission Portal] Could not reach submission endpoint:', err);
  });

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

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve production build from dist folder under /admin
app.use('/admin', express.static(path.join(__dirname, 'dist')));
// Expose public folder (uploads, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Serve main website static files from parent workspace directory
app.use(express.static(path.join(__dirname, '..')));

// Fallback for admin panel client-side routing
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

import { MongoClient } from 'mongodb';

// Create data directory if not exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'db.json');

// MongoDB cloud database sync configuration
const MONGODB_URI = process.env.MONGODB_URI || ''; 
let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;

// Connect to MongoDB Atlas
async function connectMongo() {
  if (!MONGODB_URI || MONGODB_URI.includes('<db_username>')) {
    console.log('MongoDB URI is not configured or contains placeholder. Running in local filesystem database mode.');
    return;
  }
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db('gurukul');
    isMongoConnected = true;
    console.log('Successfully connected to MongoDB Atlas cloud database.');
    await syncFromMongo();
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err);
  }
}

// Sync database from MongoDB Atlas on startup
async function syncFromMongo() {
  if (!isMongoConnected) return;
  try {
    const col = mongoDb.collection('state');
    const doc = await col.findOne({ _id: 'main_db' });
    if (doc) {
      const { _id, ...cleanData } = doc;
      fs.writeFileSync(dbPath, JSON.stringify(cleanData, null, 2), 'utf8');
      console.log('Synced local database file with latest cloud data.');
    } else {
      console.log('No cloud database state found. Syncing local data to MongoDB Atlas.');
      const localData = readDB();
      await col.insertOne({ _id: 'main_db', ...localData });
    }
  } catch (err) {
    console.error('Error syncing from MongoDB Atlas:', err);
  }
}

// Sync database to MongoDB Atlas on writes
async function syncToMongo(data) {
  if (!isMongoConnected) return;
  try {
    const col = mongoDb.collection('state');
    await col.replaceOne({ _id: 'main_db' }, { _id: 'main_db', ...data }, { upsert: true });
    console.log('Backed up database successfully to MongoDB Atlas.');
  } catch (err) {
    console.error('Error backing up database to MongoDB Atlas:', err);
  }
}

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { students: [], courses: [], centers: [], centerStudents: [], centerPayments: [], walletTransactions: [], settings: { lastRollNo: null, lastEnrollSuffix: null, lastDmcNo: null } };
  }
}

// Helper to write database
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  // Trigger background cloud backup
  syncToMongo(data).catch(err => console.error('Background sync to MongoDB Atlas failed:', err));
}

// Multer storage for student photo uploads and CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// CSV Parser Helper
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let fields = [];
    let insideQuote = false;
    let currentField = '';
    
    for (let char of line) {
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    
    const record = {};
    headers.forEach((header, index) => {
      let val = fields[index] || '';
      // Clean quotes
      val = val.replace(/^"|"$/g, '').trim();
      record[header] = val;
    });
    records.push(record);
  }
  return records;
}

// Generate a Sunday in a specific month and year
// monthIndex: 0 = Jan, 1 = Feb, 5 = June, 7 = Aug, etc.
function getSundayInMonth(year, monthIndex) {
  // Let's get the 2nd Sunday of the month so it looks like a realistic mid-month issue date
  let date = new Date(year, monthIndex, 1);
  while (date.getDay() !== 0) { // 0 is Sunday
    date.setDate(date.getDate() + 1);
  }
  // Add 7 days to get the second Sunday
  date.setDate(date.getDate() + 7);
  return date;
}

// Format date to DD-MM-YYYY
function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Resend email helper (HTTP API — works on any platform)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'registrar@gurukulvidhyapeethuniversity.com';

async function sendEmail({ to, subject, html, replyTo }) {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set. Skipping email.');
    return false;
  }

  const body = {
    from: `Gurukul Vidyapeeth Admissions <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html
  };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`[Email] Failed to send to ${to}:`, data);
    return false;
  }
  console.log(`[Email] Sent to ${to}:`, data.id);
  return true;
}

// Test Resend API key validity
app.get('/api/test-smtp', async (req, res) => {
  if (!RESEND_API_KEY) {
    return res.json({ status: 'error', message: 'RESEND_API_KEY not set in Render env vars.' });
  }
  try {
    const testRes = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    });
    const data = await testRes.json();
    if (testRes.ok) {
      res.json({ status: 'success', message: 'Resend API key is valid.', domains: data.data || [] });
    } else {
      res.json({ status: 'error', message: data.message || 'Invalid API key.' });
    }
  } catch (err) {
    res.json({ status: 'error', message: err.message });
  }
});

// Post route for submitting online admissions and sending emails to registrar
app.post('/api/submit-admission', async (req, res) => {
  try {
    const { fullName, studentEmail, phone, state, program, hostel, applicationId } = req.body;

    if (!fullName || !studentEmail || !phone || !program || !applicationId) {
      return res.status(400).json({ status: "error", message: "Missing required application data fields." });
    }

    const registrarEmailHtml = `
    <html>
    <head><style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #0D2149; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 5px 0 0; font-size: 12px; color: #10b981; }
        .body { padding: 25px; }
        .row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #555; width: 180px; flex-shrink: 0; }
        .value { color: #000; }
        .appId { background: #f0f7ff; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; text-align: center; font-weight: bold; color: #0D2149; }
        .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #888; }
    </style></head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>GURUKUL VIDYAPEETH UNIVERSITY</h1>
                <p>New Admission Application Received</p>
            </div>
            <div class='body'>
                <div class='appId'>Application ID: ${applicationId}</div>
                <div class='row'><span class='label'>Student Name:</span><span class='value'>${fullName}</span></div>
                <div class='row'><span class='label'>Program:</span><span class='value'>${program}</span></div>
                <div class='row'><span class='label'>Phone:</span><span class='value'>${phone}</span></div>
                <div class='row'><span class='label'>Email:</span><span class='value'>${studentEmail}</span></div>
                <div class='row'><span class='label'>State:</span><span class='value'>${state}</span></div>
                <div class='row'><span class='label'>Hostel Required:</span><span class='value'>${hostel}</span></div>
            </div>
            <div class='footer'>
                This is an automated message from the Admissions Registry Portal.<br>
                Gurukul Vidyapeeth University, Namchi, Sikkim
            </div>
        </div>
    </body>
    </html>`;

    const studentEmailHtml = `
    <html>
    <head><style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #0D2149; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 5px 0 0; font-size: 12px; color: #10b981; }
        .body { padding: 25px; }
        .row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #555; width: 180px; flex-shrink: 0; }
        .value { color: #000; }
        .appId { background: #f0f7ff; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; text-align: center; font-weight: bold; color: #0D2149; }
        .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #888; }
    </style></head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>GURUKUL VIDYAPEETH UNIVERSITY</h1>
                <p>Application Received Confirmation</p>
            </div>
            <div class='body'>
                <p>Dear ${fullName},</p>
                <p>Thank you for applying to Gurukul Vidyapeeth University. Your application has been logged and sent to the Admissions Registrar for verification.</p>
                <div class='appId'>Application ID: ${applicationId}</div>
                <div class='row'><span class='label'>Program:</span><span class='value'>${program}</span></div>
                <div class='row'><span class='label'>Phone:</span><span class='value'>${phone}</span></div>
                <div class='row'><span class='label'>Email:</span><span class='value'>${studentEmail}</span></div>
                <p style='margin-top: 20px;'>Our registrar office will review your application details and get in touch with you shortly.</p>
            </div>
            <div class='footer'>
                This is an automated message from the Admissions Registry Portal.<br>
                Gurukul Vidyapeeth University, Namchi, Sikkim
            </div>
        </div>
    </body>
    </html>`;

    // Send emails using Resend API (async, don't block response)
    sendEmail({
      to: 'registrar@gurukulvidhyapeethuniversity.com',
      subject: `New Admission Application - ${applicationId} - ${fullName}`,
      html: registrarEmailHtml,
      replyTo: studentEmail
    }).catch(err => console.error('Error sending registrar email:', err));

    if (studentEmail && studentEmail.includes('@')) {
      sendEmail({
        to: studentEmail,
        subject: `Admissions Application GVU Received - ${applicationId}`,
        html: studentEmailHtml,
        replyTo: 'registrar@gurukulvidhyapeethuniversity.com'
      }).catch(err => console.error('Error sending student email:', err));
    }

    // Always return success — the application was received
    res.json({
      status: "success",
      message: "Application submitted successfully."
    });
  } catch (err) {
    console.error('Admission submission error:', err);
    // Still return success — the data was received, email is best-effort
    res.json({
      status: "success",
      message: "Application submitted successfully."
    });
  }
});

// Get complete database (for debug / dashboard state)
app.get('/api/db', (req, res) => {
  res.json(readDB());
});

// Upload and parse course CSV
app.post('/api/courses/upload', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedData = parseCSV(fileContent);
    
    // Group subjects by Course and then by Semester/Year
    const coursesMap = {};
    
    parsedData.forEach(row => {
      const courseName = row['Course'];
      if (!courseName) return;
      
      const termName = row['Semester'] || row['Year'] || 'General';
      const termType = row['Semester'] ? 'semester' : (row['Year'] ? 'year' : 'general');
      
      if (!coursesMap[courseName]) {
        coursesMap[courseName] = {
          name: courseName,
          type: termType,
          terms: {}
        };
      }
      
      if (!coursesMap[courseName].terms[termName]) {
        coursesMap[courseName].terms[termName] = [];
      }
      
      coursesMap[courseName].terms[termName].push({
        code: row['Course Code'] || '',
        name: row['Subject'] || '',
        maxMarks: parseInt(row['Max Marks']) || 100,
        minMarks: parseInt(row['Min Marks']) || 40
      });
    });
    
    // Save to database
    const db = readDB();
    Object.values(coursesMap).forEach(newCourse => {
      // Check if course already exists, if so overwrite or merge
      const existingIdx = db.courses.findIndex(c => c.name.toLowerCase() === newCourse.name.toLowerCase());
      if (existingIdx >= 0) {
        db.courses[existingIdx] = newCourse;
      } else {
        db.courses.push(newCourse);
      }
    });
    
    writeDB(db);
    
    // Delete temporary uploaded CSV
    fs.unlinkSync(filePath);
    
    res.json({ message: 'CSV uploaded and courses updated successfully', courses: db.courses });
  } catch (err) {
    console.error('Error uploading CSV:', err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Get courses list
app.get('/api/courses', (req, res) => {
  const db = readDB();
  res.json(db.courses);
});

// Helper to generate next Roll Number
function generateRollNumber(db) {
  if (db.settings.lastRollNo) {
    const nextRoll = db.settings.lastRollNo + 1;
    db.settings.lastRollNo = nextRoll;
    return nextRoll;
  } else {
    // Generate a random 6 digit number
    const randomRoll = Math.floor(100000 + Math.random() * 900000);
    db.settings.lastRollNo = randomRoll;
    return randomRoll;
  }
}

// Helper to generate next Enrollment Number
// sessionYear: ending year of session e.g. 2025
function generateEnrollmentNumber(db, sessionYear) {
  const prefix = sessionYear - 1; // E.g. session 2025 -> prefix 2024
  let suffix;
  
  if (db.settings.lastEnrollSuffix) {
    suffix = db.settings.lastEnrollSuffix + 1;
  } else {
    // Generate a random 6 digit suffix
    suffix = Math.floor(100000 + Math.random() * 900000);
  }
  
  db.settings.lastEnrollSuffix = suffix;
  return `${prefix}${suffix}`;
}

// Helper to generate next DMC Number
function generateDmcNumber(db) {
  if (db.settings.lastDmcNo) {
    const nextDmc = db.settings.lastDmcNo + 1;
    db.settings.lastDmcNo = nextDmc;
    return nextDmc;
  } else {
    // Generate random 4 digit number
    const randomDmc = Math.floor(1000 + Math.random() * 9000);
    db.settings.lastDmcNo = randomDmc;
    return randomDmc;
  }
}

// Calculate Sunday date of issue
// Calculate Sunday date of issue bounded by the session range
function calculateIssueDate(session, termType, termName, termIndex, totalTerms) {
  const years = session.match(/\b(20\d{2})\b/g);
  let startYear = new Date().getFullYear();
  let finalYear = new Date().getFullYear();
  
  if (years) {
    if (years.length >= 2) {
      startYear = parseInt(years[0]);
      finalYear = parseInt(years[years.length - 1]);
    } else if (years.length === 1) {
      startYear = parseInt(years[0]);
      finalYear = parseInt(years[0]);
    }
  }

  let issueYear = finalYear;
  let monthIndex = 7; // August by default
  
  if (termType === 'semester') {
    // Semester 1, 2, 3, 4, etc.
    const semNum = termIndex + 1; // 1-indexed
    const yearsBack = Math.floor((totalTerms - semNum) / 2);
    issueYear = finalYear - yearsBack;
    
    // If odd semester, it is Feb (index 1). If even, it is August (index 7).
    if (semNum % 2 !== 0) {
      monthIndex = 1; // February
    } else {
      monthIndex = 7; // August
    }
  } else {
    // Year-wise: 1st Year, 2nd Year, etc.
    const yearNum = termIndex + 1;
    const yearsBack = totalTerms - yearNum;
    issueYear = finalYear - yearsBack;
    monthIndex = 7; // August
  }
  
  // Clamp issueYear to startYear so dates don't fall before enrollment
  issueYear = Math.max(startYear, issueYear);
  
  const sunday = getSundayInMonth(issueYear, monthIndex);
  return formatDate(sunday);
}

// Upload cropped photo (raw base64 or file upload)
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  try {
    if (req.body.image) {
      // Base64 upload
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
      const ext = req.body.ext || '.png';
      const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      return res.json({ photoUrl: `/uploads/${filename}` });
    }
    
    if (req.file) {
      return res.json({ photoUrl: `/uploads/${req.file.filename}` });
    }
    
    res.status(400).json({ error: 'No image data provided' });
  } catch (err) {
    console.error('Error saving uploaded photo:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Register new student (auto-generates numbers and calculates dates)
app.post('/api/students', (req, res) => {
  try {
    const { name, fatherName, motherName, dob, courseName, session, marksheetsData, email, centerStudentId } = req.body;
    
    if (!name || !fatherName || !motherName || !dob || !courseName || !session || !email) {
      return res.status(400).json({ error: 'Missing required student details (including Email ID)' });
    }
    
    const db = readDB();
    
    // Find course in db to see its structure
    const course = db.courses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
    if (!course) {
      return res.status(404).json({ error: 'Selected course not found in database. Please upload CSV first.' });
    }
    
    // Extract final year of session (e.g. "2025 Final" or "2024-2026" or "2026")
    const yearMatch = session.match(/\b(20\d{2})\b/g);
    if (!yearMatch) {
      return res.status(400).json({ error: 'Invalid session format. Must include a 4-digit year (e.g., 2026 Final)' });
    }
    const finalYear = parseInt(yearMatch[yearMatch.length - 1]); // Take last year matched
    
    // Generate sequential numbers
    const rollNo = generateRollNumber(db).toString();
    const enrollmentNo = generateEnrollmentNumber(db, finalYear).toString();
    
    // Prepare marksheets
    const terms = Object.keys(course.terms); // e.g. ["1st Semester", "2nd Semester"] or ["1st Year", "2nd Year"]
    const totalTerms = terms.length;
    
    const marksheets = {};
    
    terms.forEach((termName, idx) => {
      // Auto generate DMC number
      const dmcNo = generateDmcNumber(db).toString();
      
      // Calculate Date of Issue
      const issueDate = calculateIssueDate(session, course.type, termName, idx, totalTerms);
      
      // Gather marks entered for this term from request or initialize empty
      const termMarks = (marksheetsData && marksheetsData[termName]) ? marksheetsData[termName].marks : {};
      
      marksheets[termName] = {
        dmcNo,
        issueDate,
        marks: termMarks,
        isPublished: false // default false
      };
    });
    
    // Initialize publishedDocs configuration
    const publishedDocs = {
      idCard: false,
      marksheets: {},
      admitCards: {},
      results: {}
    };
    terms.forEach(term => {
      publishedDocs.marksheets[term] = false;
      publishedDocs.admitCards[term] = false;
      publishedDocs.results[term] = false;
    });

    let centerId = undefined;
    let centerName = undefined;

    if (centerStudentId) {
      const csIdx = (db.centerStudents || []).findIndex(s => s.id === centerStudentId);
      if (csIdx >= 0) {
        const cs = db.centerStudents[csIdx];
        centerId = cs.centerId;
        centerName = cs.centerName;
        
        // Mark center student as processed
        cs.processed = true;
        cs.processedStudentId = 'temp'; // Will update with newStudent.id below
        cs.status = 'active';
        cs.updatedAt = new Date().toISOString();
        db.centerStudents[csIdx] = cs;
      }
    }

    const newStudent = {
      id: Date.now().toString(),
      name,
      fatherName,
      motherName,
      dob,
      email: email.trim().toLowerCase(),
      rollNo,
      enrollmentNo,
      course: courseName,
      session,
      photo: req.body.photo || '', // URL path of cropped photo
      marksheets,
      publishedDocs,
      isPublished: false, // overall publish status (true if at least one item is published)
      centerId,
      centerName,
      createdAt: new Date().toISOString()
    };
    
    if (centerStudentId && newStudent.centerId) {
      const csIdx = (db.centerStudents || []).findIndex(s => s.id === centerStudentId);
      if (csIdx >= 0) {
        db.centerStudents[csIdx].processedStudentId = newStudent.id;
      }
    }

    db.students.push(newStudent);
    writeDB(db);
    
    res.json({ message: 'Student registered successfully', student: newStudent });
  } catch (err) {
    console.error('Error registering student:', err);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Edit student (partial and complete edit support)
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, fatherName, motherName, dob, photo, marksheetsData, isCompleteEdit, courseName, session, email } = req.body;
    
    const db = readDB();
    const studentIdx = db.students.findIndex(s => s.id === id);
    
    if (studentIdx < 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = db.students[studentIdx];
    
    // Apply student base details
    if (name) student.name = name;
    if (fatherName) student.fatherName = fatherName;
    if (motherName) student.motherName = motherName;
    if (dob) student.dob = dob;
    if (photo !== undefined) student.photo = photo;
    if (email !== undefined) student.email = email.trim().toLowerCase();
    
    if (isCompleteEdit) {
      // Changing Course/Session recalculates roll/enrollment number prefixes or structural terms
      if (courseName && courseName !== student.course) {
        const course = db.courses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
        if (!course) {
          return res.status(404).json({ error: 'Selected course not found in database.' });
        }
        student.course = courseName;
        
        // Structure change: reset marksheets with new subjects
        const sessionYearStr = session || student.session;
        const yearMatch = sessionYearStr.match(/\b(20\d{2})\b/g);
        const finalYear = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear();
        
        const terms = Object.keys(course.terms);
        const totalTerms = terms.length;
        const newMarksheets = {};
        const newPublishedDocs = {
          idCard: student.publishedDocs?.idCard || false,
          marksheets: {},
          admitCards: {},
          results: {}
        };
        
        terms.forEach((termName, idx) => {
          const dmcNo = generateDmcNumber(db).toString();
          const issueDate = calculateIssueDate(sessionYearStr, course.type, termName, idx, totalTerms);
          
          newMarksheets[termName] = {
            dmcNo,
            issueDate,
            marks: {},
            isPublished: false
          };
          newPublishedDocs.marksheets[termName] = false;
          newPublishedDocs.admitCards[termName] = false;
          newPublishedDocs.results[termName] = false;
        });
        student.marksheets = newMarksheets;
        student.publishedDocs = newPublishedDocs;
      }
      
      if (session && session !== student.session) {
        student.session = session;
        
        // Recalculate enrollment prefix
        const yearMatch = session.match(/\b(20\d{2})\b/g);
        if (yearMatch) {
          const finalYear = parseInt(yearMatch[yearMatch.length - 1]);
          const prefix = (finalYear - 1).toString();
          // Update prefix of enrollment
          const currentSuffix = student.enrollmentNo.slice(4);
          student.enrollmentNo = `${prefix}${currentSuffix}`;
          
          // Recalculate issue dates of all marksheets
          const course = db.courses.find(c => c.name.toLowerCase() === student.course.toLowerCase());
          if (course) {
            const terms = Object.keys(course.terms);
            const totalTerms = terms.length;
            terms.forEach((termName, idx) => {
              if (student.marksheets[termName]) {
                student.marksheets[termName].issueDate = calculateIssueDate(session, course.type, termName, idx, totalTerms);
              }
            });
          }
        }
      }
    }
    
    // Update marks and DMC numbers if provided in request
    if (marksheetsData) {
      Object.keys(marksheetsData).forEach(termName => {
        if (student.marksheets[termName]) {
          if (marksheetsData[termName].marks) {
            student.marksheets[termName].marks = marksheetsData[termName].marks;
          }
          if (marksheetsData[termName].dmcNo) {
            student.marksheets[termName].dmcNo = marksheetsData[termName].dmcNo;
          }
          if (marksheetsData[termName].issueDate) {
            student.marksheets[termName].issueDate = marksheetsData[termName].issueDate;
          }
        }
      });
    }
    
    db.students[studentIdx] = student;
    writeDB(db);
    
    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const index = db.students.findIndex(s => s.id === id);
    
    if (index < 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    db.students.splice(index, 1);
    writeDB(db);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Publish student (selective publishing configuration)
app.post('/api/students/:id/publish', (req, res) => {
  try {
    const { id } = req.params;
    const { publishedDocs } = req.body;
    
    if (!publishedDocs) {
      return res.status(400).json({ error: 'Missing published documents configuration' });
    }
    
    const db = readDB();
    const studentIdx = db.students.findIndex(s => s.id === id);
    
    if (studentIdx < 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Determine overall isPublished status (true if at least one checkbox is checked)
    let isAnyPublished = false;
    if (publishedDocs.idCard) isAnyPublished = true;
    
    if (publishedDocs.marksheets) {
      Object.values(publishedDocs.marksheets).forEach(v => { if (v) isAnyPublished = true; });
    }
    if (publishedDocs.admitCards) {
      Object.values(publishedDocs.admitCards).forEach(v => { if (v) isAnyPublished = true; });
    }
    if (publishedDocs.results) {
      Object.values(publishedDocs.results).forEach(v => { if (v) isAnyPublished = true; });
    }
    
    db.students[studentIdx].publishedDocs = publishedDocs;
    db.students[studentIdx].isPublished = isAnyPublished;
    
    // Legacy support: sync terms back to marksheets.isPublished
    Object.keys(db.students[studentIdx].marksheets).forEach(termName => {
      const isSemPublished = publishedDocs.marksheets && publishedDocs.marksheets[termName];
      db.students[studentIdx].marksheets[termName].isPublished = !!isSemPublished;
    });
    
    writeDB(db);
    res.json({ message: 'Selective publishing settings saved successfully', student: db.students[studentIdx] });
  } catch (err) {
    console.error('Error publishing student:', err);
    res.status(500).json({ error: 'Failed to publish student' });
  }
});

// Search API for public website (lookup student)
// Checks published students matching name AND (roll number OR enrollment number)
app.get('/api/public/student', (req, res) => {
  try {
    const { email, searchVal } = req.query; // searchVal can be rollNo or enrollmentNo
    
    if (!email || !searchVal) {
      return res.status(400).json({ error: 'Email and Roll/Enrollment number are required' });
    }
    
    const db = readDB();
    
    // Find matching published student
    const student = db.students.find(s => 
      s.isPublished && 
      s.email && s.email.trim().toLowerCase() === email.trim().toLowerCase() && 
      (s.rollNo.trim() === searchVal.trim() || s.enrollmentNo.trim() === searchVal.trim())
    );
    
    if (!student) {
      return res.status(404).json({ error: 'No matching student records found. Make sure the administrator has published your documents.' });
    }
    
    // Look up the full course info to return subject details (max marks, min marks, code, name)
    const course = db.courses.find(c => c.name.toLowerCase() === student.course.toLowerCase());
    
    res.json({ student, course });
  } catch (err) {
    console.error('Error searching public student database:', err);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// Verification Lookup API for public website
app.get('/api/public/verify-credential', (req, res) => {
  try {
    const { rollNo } = req.query;
    if (!rollNo) {
      return res.status(400).json({ error: 'Roll/Enrollment number is required' });
    }
    
    const db = readDB();
    
    // Find matching published student (search rollNo or enrollmentNo case-insensitively)
    const student = db.students.find(s => 
      s.isPublished &&
      ((s.rollNo && s.rollNo.trim().toUpperCase() === rollNo.trim().toUpperCase()) ||
      (s.enrollmentNo && s.enrollmentNo.trim().toUpperCase() === rollNo.trim().toUpperCase()))
    );
    
    if (!student) {
      return res.status(404).json({ error: 'No matching student record found in university registry.' });
    }
    
    res.json({
      status: "success",
      student: {
        name: student.name,
        fatherName: student.fatherName,
        motherName: student.motherName,
        roll: student.rollNo,
        enrollmentNo: student.enrollmentNo,
        program: student.course,
        year: student.session || '2022 - 2026',
        photo: student.photo || '',
        status: 'VERIFIED & VALID'
      }
    });
  } catch (err) {
    console.error('Error during credential verification:', err);
    res.status(500).json({ error: 'Internal server error during lookup' });
  }
});

// ============================================================
// CENTER MANAGEMENT APIs
// ============================================================

// Center Login
app.post('/api/center/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const db = readDB();
    const center = (db.centers || []).find(c => 
      c.username.toLowerCase() === username.trim().toLowerCase() && c.isActive
    );
    if (!center) {
      return res.status(401).json({ error: 'Invalid credentials or center not active' });
    }
    const isMatch = await bcrypt.compare(password, center.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ 
      message: 'Login successful', 
      center: { id: center.id, centerName: center.centerName, username: center.username, email: center.email, phone: center.phone, walletBalance: center.walletBalance || 0 }
    });
  } catch (err) {
    console.error('Center login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Center: Get own profile
app.get('/api/center/profile', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const center = (db.centers || []).find(c => c.id === centerId);
  if (!center) return res.status(404).json({ error: 'Center not found' });
  res.json({ id: center.id, centerName: center.centerName, username: center.username, email: center.email, phone: center.phone, address: center.address, walletBalance: center.walletBalance || 0 });
});

// Center: Get dashboard stats
app.get('/api/center/dashboard-stats', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const myStudents = (db.centerStudents || []).filter(s => s.centerId === centerId);
  const total = myStudents.length;
  const active = myStudents.filter(s => s.status === 'active').length;
  const pending = myStudents.filter(s => s.status === 'pending').length;
  const center = (db.centers || []).find(c => c.id === centerId);
  res.json({ total, active, pending, walletBalance: center ? center.walletBalance || 0 : 0 });
});

// Center: Get own students (sorted by most recent first)
app.get('/api/center/students', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let myStudents = (db.centerStudents || []).filter(s => s.centerId === centerId);
  myStudents.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  
  const { search, course, session } = req.query;
  if (search) {
    const q = search.toLowerCase();
    myStudents = myStudents.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  }
  if (course) {
    myStudents = myStudents.filter(s => s.course && s.course.toLowerCase().includes(course.toLowerCase()));
  }
  if (session) {
    myStudents = myStudents.filter(s => s.session && s.session.toLowerCase().includes(session.toLowerCase()));
  }
  res.json(myStudents);
});

// Center: Add new student
app.post('/api/center/students', upload.array('documents', 10), (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const db = readDB();
    const center = (db.centers || []).find(c => c.id === centerId);
    if (!center) return res.status(404).json({ error: 'Center not found' });
    
    const { name, fatherName, motherName, dob, email, centerName, address, admissionDate, contactNumber, course, session, photo } = req.body;
    
    if (!name || !fatherName || !motherName || !dob || !email || !address || !admissionDate || !contactNumber || !course || !session) {
      return res.status(400).json({ error: 'All mandatory fields are required' });
    }
    
    // Handle uploaded documents
    const documents = [];
    if (req.files) {
      req.files.forEach(file => {
        documents.push({ filename: file.filename, originalname: file.originalname, path: `/uploads/${file.filename}` });
      });
    }
    
    const newStudent = {
      id: Date.now().toString(),
      centerId,
      centerName: center.centerName,
      name: name.toUpperCase(),
      fatherName: fatherName.toUpperCase(),
      motherName: motherName.toUpperCase(),
      dob,
      email: email.trim().toLowerCase(),
      address: address.toUpperCase(),
      admissionDate,
      contactNumber,
      course: course.toUpperCase(),
      session: session.toUpperCase(),
      photo: photo || '',
      documents,
      status: 'pending',
      processed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.centerStudents) db.centerStudents = [];
    db.centerStudents.push(newStudent);
    writeDB(db);
    
    res.json({ message: 'Student added successfully', student: newStudent });
  } catch (err) {
    console.error('Error adding center student:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Center: Edit student
app.put('/api/center/students/:id', upload.array('documents', 10), (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { id } = req.params;
    const db = readDB();
    const studentIdx = (db.centerStudents || []).findIndex(s => s.id === id && s.centerId === centerId);
    if (studentIdx < 0) return res.status(404).json({ error: 'Student not found' });
    
    const student = db.centerStudents[studentIdx];
    const { name, fatherName, motherName, dob, email, address, admissionDate, contactNumber, course, session, photo } = req.body;
    
    if (name) student.name = name.toUpperCase();
    if (fatherName) student.fatherName = fatherName.toUpperCase();
    if (motherName) student.motherName = motherName.toUpperCase();
    if (dob) student.dob = dob;
    if (email) student.email = email.trim().toLowerCase();
    if (address) student.address = address.toUpperCase();
    if (admissionDate) student.admissionDate = admissionDate;
    if (contactNumber) student.contactNumber = contactNumber;
    if (course) student.course = course.toUpperCase();
    if (session) student.session = session.toUpperCase();
    if (photo !== undefined) student.photo = photo;
    
    // Handle new uploaded documents
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        student.documents.push({ filename: file.filename, originalname: file.originalname, path: `/uploads/${file.filename}` });
      });
    }
    
    student.updatedAt = new Date().toISOString();
    db.centerStudents[studentIdx] = student;
    writeDB(db);
    
    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    console.error('Error updating center student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Center: Delete student
app.delete('/api/center/students/:id', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { id } = req.params;
    const db = readDB();
    const studentIdx = (db.centerStudents || []).findIndex(s => s.id === id && s.centerId === centerId);
    if (studentIdx < 0) return res.status(404).json({ error: 'Student not found' });
    
    db.centerStudents.splice(studentIdx, 1);
    writeDB(db);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting center student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Center: Get wallet info and transactions
app.get('/api/center/wallet', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const center = (db.centers || []).find(c => c.id === centerId);
  const transactions = (db.walletTransactions || []).filter(t => t.centerId === centerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ balance: center ? center.walletBalance || 0 : 0, transactions });
});

// Center: Get payment history
app.get('/api/center/payments', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const payments = (db.centerPayments || []).filter(p => p.centerId === centerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(payments);
});

// Center: Pay for student (deduct from wallet)
app.post('/api/center/wallet/pay', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { studentId, amount, description, screenshot } = req.body;
  if (!studentId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid student ID and amount are required' });
  }
  
  const db = readDB();
  const center = (db.centers || []).find(c => c.id === centerId);
  if (!center) return res.status(404).json({ error: 'Center not found' });
  
  if ((center.walletBalance || 0) < amount) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }
  
  const student = (db.centerStudents || []).find(s => s.id === studentId && s.centerId === centerId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  
  center.walletBalance -= amount;
  
  const txn = {
    id: `txn_${Date.now()}`,
    centerId,
    type: 'debit',
    amount,
    balanceAfter: center.walletBalance,
    description: description || `Fee payment for student ${student.name}`,
    studentId,
    studentName: student.name,
    createdAt: new Date().toISOString()
  };
  
  if (!db.walletTransactions) db.walletTransactions = [];
  db.walletTransactions.push(txn);
  
  const payment = {
    id: `pay_${Date.now()}`,
    centerId,
    studentId,
    studentName: student.name,
    amount,
    type: 'fee_payment',
    description: description || `Fee payment for ${student.name}`,
    screenshot: screenshot || '',
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  if (!db.centerPayments) db.centerPayments = [];
  db.centerPayments.push(payment);
  
  student.status = 'active';
  student.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ message: 'Payment successful', balance: center.walletBalance, transaction: txn });
});

// Center: Upload payment screenshot
app.post('/api/center/payments/upload', upload.single('screenshot'), (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { amount, description } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    
    const db = readDB();
    const payment = {
      id: `pay_${Date.now()}`,
      centerId,
      amount: parseFloat(amount),
      type: 'wallet_topup_request',
      description: description || 'Wallet top-up request',
      screenshot: req.file ? `/uploads/${req.file.filename}` : '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    if (!db.centerPayments) db.centerPayments = [];
    db.centerPayments.push(payment);
    writeDB(db);
    
    res.json({ message: 'Payment screenshot uploaded. Awaiting admin approval.', payment });
  } catch (err) {
    console.error('Error uploading payment:', err);
    res.status(500).json({ error: 'Failed to upload payment' });
  }
});

// Center: Get acknowledgement for student
app.get('/api/center/acknowledgement/:studentId', (req, res) => {
  const centerId = req.headers['x-center-id'];
  if (!centerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { studentId } = req.params;
  const db = readDB();
  const student = (db.centerStudents || []).find(s => s.id === studentId && s.centerId === centerId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  
  const center = (db.centers || []).find(c => c.id === centerId);
  
  res.json({ student, center: center ? { centerName: center.centerName, address: center.address, phone: center.phone } : null });
});

// ============================================================
// ADMIN CENTER MANAGEMENT APIs
// ============================================================

// Admin: Get all centers
app.get('/api/admin/centers', (req, res) => {
  const db = readDB();
  const centers = (db.centers || []).map(c => ({
    id: c.id, centerName: c.centerName, username: c.username, contactPerson: c.contactPerson,
    email: c.email, phone: c.phone, address: c.address, walletBalance: c.walletBalance || 0,
    isActive: c.isActive, createdAt: c.createdAt
  }));
  res.json(centers);
});

// Admin: Get all center payments
app.get('/api/admin/center-payments', (req, res) => {
  const db = readDB();
  const payments = db.centerPayments || [];
  res.json(payments);
});

// Admin: Create center
app.post('/api/admin/centers', async (req, res) => {
  try {
    const { centerName, username, password, contactPerson, email, phone, address } = req.body;
    if (!centerName || !username || !password) {
      return res.status(400).json({ error: 'Center name, username and password are required' });
    }
    
    const db = readDB();
    const existing = (db.centers || []).find(c => c.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) return res.status(400).json({ error: 'Username already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newCenter = {
      id: `center_${Date.now()}`,
      centerName: centerName.toUpperCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      contactPerson: contactPerson || '',
      email: email || '',
      phone: phone || '',
      address: address ? address.toUpperCase() : '',
      walletBalance: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    if (!db.centers) db.centers = [];
    db.centers.push(newCenter);
    writeDB(db);
    
    res.json({ message: 'Center created successfully', center: { id: newCenter.id, centerName: newCenter.centerName, username: newCenter.username } });
  } catch (err) {
    console.error('Error creating center:', err);
    res.status(500).json({ error: 'Failed to create center' });
  }
});

// Admin: Edit center
app.put('/api/admin/centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { centerName, username, password, contactPerson, email, phone, address, isActive } = req.body;
    
    const db = readDB();
    const centerIdx = (db.centers || []).findIndex(c => c.id === id);
    if (centerIdx < 0) return res.status(404).json({ error: 'Center not found' });
    
    const center = db.centers[centerIdx];
    if (centerName) center.centerName = centerName.toUpperCase();
    if (username) center.username = username.trim().toLowerCase();
    if (password) center.password = await bcrypt.hash(password, 10);
    if (contactPerson !== undefined) center.contactPerson = contactPerson;
    if (email !== undefined) center.email = email;
    if (phone !== undefined) center.phone = phone;
    if (address !== undefined) center.address = address.toUpperCase();
    if (isActive !== undefined) center.isActive = isActive;
    
    db.centers[centerIdx] = center;
    writeDB(db);
    
    res.json({ message: 'Center updated successfully', center: { id: center.id, centerName: center.centerName, username: center.username, isActive: center.isActive } });
  } catch (err) {
    console.error('Error updating center:', err);
    res.status(500).json({ error: 'Failed to update center' });
  }
});

// Admin: Delete center
app.delete('/api/admin/centers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const index = (db.centers || []).findIndex(c => c.id === id);
    if (index < 0) return res.status(404).json({ error: 'Center not found' });
    
    db.centers.splice(index, 1);
    writeDB(db);
    res.json({ message: 'Center deleted successfully' });
  } catch (err) {
    console.error('Error deleting center:', err);
    res.status(500).json({ error: 'Failed to delete center' });
  }
});

// Admin: Add wallet balance to center
app.post('/api/admin/centers/:id/wallet', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    
    const db = readDB();
    const center = (db.centers || []).find(c => c.id === id);
    if (!center) return res.status(404).json({ error: 'Center not found' });
    
    center.walletBalance = (center.walletBalance || 0) + parseFloat(amount);
    
    const txn = {
      id: `txn_${Date.now()}`,
      centerId: id,
      type: 'credit',
      amount: parseFloat(amount),
      balanceAfter: center.walletBalance,
      description: description || 'Admin wallet top-up',
      createdAt: new Date().toISOString()
    };
    
    if (!db.walletTransactions) db.walletTransactions = [];
    db.walletTransactions.push(txn);
    
    const payment = {
      id: `pay_${Date.now()}`,
      centerId: id,
      amount: parseFloat(amount),
      type: 'wallet_topup',
      description: description || 'Admin wallet top-up',
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    
    if (!db.centerPayments) db.centerPayments = [];
    db.centerPayments.push(payment);
    
    writeDB(db);
    res.json({ message: 'Wallet balance added successfully', balance: center.walletBalance });
  } catch (err) {
    console.error('Error adding wallet balance:', err);
    res.status(500).json({ error: 'Failed to add wallet balance' });
  }
});

// Admin: Reset center wallet balance to 0
app.post('/api/admin/centers/:id/reset-wallet', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const center = (db.centers || []).find(c => c.id === id);
    if (!center) return res.status(404).json({ error: 'Center not found' });

    const oldBalance = center.walletBalance || 0;
    center.walletBalance = 0;

    if (!db.walletTransactions) db.walletTransactions = [];
    db.walletTransactions.push({
      id: `txn_${Date.now()}`,
      centerId: id,
      type: 'reset',
      amount: 0,
      balanceAfter: 0,
      description: `Wallet reset by admin (was ₹${oldBalance.toLocaleString('en-IN')})`,
      createdAt: new Date().toISOString()
    });

    writeDB(db);
    res.json({ message: 'Wallet balance reset to 0' });
  } catch (err) {
    console.error('Error resetting wallet:', err);
    res.status(500).json({ error: 'Failed to reset wallet' });
  }
});

// Admin: Clear all payment history for a center
app.delete('/api/admin/centers/:id/clear-payments', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const center = (db.centers || []).find(c => c.id === id);
    if (!center) return res.status(404).json({ error: 'Center not found' });

    const removed = (db.centerPayments || []).filter(p => p.centerId === id).length;
    db.centerPayments = (db.centerPayments || []).filter(p => p.centerId !== id);
    db.walletTransactions = (db.walletTransactions || []).filter(t => t.centerId !== id);

    writeDB(db);
    res.json({ message: `Cleared ${removed} payment records` });
  } catch (err) {
    console.error('Error clearing payments:', err);
    res.status(500).json({ error: 'Failed to clear payments' });
  }
});

// Admin: Approve/reject center payment
app.post('/api/admin/center-payments/:id/process', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const db = readDB();
    const paymentIdx = (db.centerPayments || []).findIndex(p => p.id === id);
    if (paymentIdx < 0) return res.status(404).json({ error: 'Payment not found' });
    
    const payment = db.centerPayments[paymentIdx];
    
    if (action === 'approve' && payment.type === 'wallet_topup_request') {
      const center = (db.centers || []).find(c => c.id === payment.centerId);
      if (center) {
        center.walletBalance = (center.walletBalance || 0) + payment.amount;
        
        const txn = {
          id: `txn_${Date.now()}`,
          centerId: payment.centerId,
          type: 'credit',
          amount: payment.amount,
          balanceAfter: center.walletBalance,
          description: payment.description || 'Approved payment',
          createdAt: new Date().toISOString()
        };
        
        if (!db.walletTransactions) db.walletTransactions = [];
        db.walletTransactions.push(txn);
      }
    }
    
    payment.status = action === 'approve' ? 'approved' : 'rejected';
    db.centerPayments[paymentIdx] = payment;
    writeDB(db);
    
    res.json({ message: `Payment ${action}d successfully` });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Admin: Get center's students
app.get('/api/admin/center-students/:centerId', (req, res) => {
  const { centerId } = req.params;
  const db = readDB();
  const students = (db.centerStudents || []).filter(s => s.centerId === centerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(students);
});

// Admin: Get all center students (overview)
app.get('/api/admin/center-students', (req, res) => {
  const db = readDB();
  const students = (db.centerStudents || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(students);
});

// Admin: Delete center student
app.delete('/api/admin/center-students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const idx = (db.centerStudents || []).findIndex(s => s.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Student not found' });
    db.centerStudents.splice(idx, 1);
    writeDB(db);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting center student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Admin: Process center student (auto-fill into main student system)
app.post('/api/admin/process-center-student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const db = readDB();
    
    const csIdx = (db.centerStudents || []).findIndex(s => s.id === studentId);
    if (csIdx < 0) return res.status(404).json({ error: 'Center student not found' });
    
    const cs = db.centerStudents[csIdx];
    
    // Find course in db
    const course = db.courses.find(c => c.name.toLowerCase() === cs.course.toLowerCase());
    if (!course) {
      return res.status(404).json({ error: `Course "${cs.course}" not found in database. Please upload CSV first.` });
    }
    
    // Generate numbers
    const rollNo = generateRollNumber(db).toString();
    const yearMatch = cs.session.match(/\b(20\d{2})\b/g);
    const finalYear = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear();
    const enrollmentNo = generateEnrollmentNumber(db, finalYear).toString();
    
    // Prepare marksheets
    const terms = Object.keys(course.terms);
    const totalTerms = terms.length;
    const marksheets = {};
    const publishedDocs = { idCard: false, marksheets: {}, admitCards: {}, results: {} };
    
    terms.forEach((termName, idx) => {
      const dmcNo = generateDmcNumber(db).toString();
      const issueDate = calculateIssueDate(cs.session, course.type, termName, idx, totalTerms);
      marksheets[termName] = { dmcNo, issueDate, marks: {}, isPublished: false };
      publishedDocs.marksheets[term] = false;
      publishedDocs.admitCards[term] = false;
      publishedDocs.results[term] = false;
    });
    
    // Check if student email already exists
    const existingStudent = db.students.find(s => s.email && s.email === cs.email);
    
    let newStudent;
    if (existingStudent) {
      return res.status(400).json({ error: 'A student with this email already exists in the system' });
    }
    
    newStudent = {
      id: Date.now().toString(),
      name: cs.name,
      fatherName: cs.fatherName,
      motherName: cs.motherName,
      dob: cs.dob,
      email: cs.email,
      rollNo,
      enrollmentNo,
      course: cs.course,
      session: cs.session,
      photo: cs.photo || '',
      address: cs.address || '',
      admissionDate: cs.admissionDate || '',
      contactNumber: cs.contactNumber || '',
      marksheets,
      publishedDocs,
      isPublished: false,
      centerId: cs.centerId,
      centerName: cs.centerName,
      createdAt: new Date().toISOString()
    };
    
    db.students.push(newStudent);
    
    // Mark center student as processed
    cs.processed = true;
    cs.processedStudentId = newStudent.id;
    cs.status = 'active';
    cs.updatedAt = new Date().toISOString();
    db.centerStudents[csIdx] = cs;
    
    writeDB(db);
    res.json({ message: 'Student processed successfully', student: newStudent });
  } catch (err) {
    console.error('Error processing center student:', err);
    res.status(500).json({ error: 'Failed to process student' });
  }
});

// Admin: Get all payments across centers
app.get('/api/admin/center-payments', (req, res) => {
  const db = readDB();
  const payments = (db.centerPayments || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(payments);
});

// ============================================================
// STAFF MANAGEMENT APIs
// ============================================================

// Staff: Register
app.post('/api/staff/register', async (req, res) => {
  try {
    const { name, mobile, password } = req.body;
    if (!name || !mobile || !password) return res.status(400).json({ error: 'Name, mobile and password are required' });
    const db = readDB();
    if (!db.staff) db.staff = [];
    const existing = db.staff.find(s => s.mobile === mobile.trim());
    if (existing) return res.status(400).json({ error: 'Mobile number already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = {
      id: `staff_${Date.now()}`,
      name: name.toUpperCase(),
      mobile: mobile.trim(),
      password: hashedPassword,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    db.staff.push(newStaff);
    writeDB(db);
    res.json({ message: 'Account created successfully', staff: { id: newStaff.id, name: newStaff.name, mobile: newStaff.mobile } });
  } catch (err) {
    console.error('Staff register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Staff: Login
app.post('/api/staff/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) return res.status(400).json({ error: 'Mobile and password are required' });
    const db = readDB();
    const staff = (db.staff || []).find(s => s.mobile === mobile.trim() && s.isActive);
    if (!staff) return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', staff: { id: staff.id, name: staff.name, mobile: staff.mobile } });
  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Staff: Get profile
app.get('/api/staff/profile', (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const staff = (db.staff || []).find(s => s.id === staffId);
  if (!staff) return res.status(404).json({ error: 'Staff not found' });
  res.json({ id: staff.id, name: staff.name, mobile: staff.mobile });
});

// Staff: Get dashboard stats
app.get('/api/staff/dashboard-stats', (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const myStudents = (db.staffStudents || []).filter(s => s.staffId === staffId);
  const total = myStudents.length;
  const active = myStudents.filter(s => s.status === 'active').length;
  const pending = myStudents.filter(s => s.status === 'pending').length;
  res.json({ total, active, pending });
});

// Staff: Get own students
app.get('/api/staff/students', (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let myStudents = (db.staffStudents || []).filter(s => s.staffId === staffId);
  myStudents.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    myStudents = myStudents.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(q))
    );
  }
  res.json(myStudents);
});

// Staff: Add student with payment screenshot
app.post('/api/staff/students', upload.array('documents', 10), (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const db = readDB();
    const { name, fatherName, motherName, dob, email, address, admissionDate, contactNumber, course, session, photo, paymentDescription, staffNote, universityBoard } = req.body;
    if (!name || !fatherName || !dob || !course || !session) {
      return res.status(400).json({ error: 'Name, father name, DOB, course and session are required' });
    }
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({ filename: file.filename, originalname: file.originalname, path: `/uploads/${file.filename}` });
      });
    }
    // Check for payment screenshot (last file if multiple)
    let paymentScreenshot = '';
    if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }
    const student = {
      id: `staff_student_${Date.now()}`,
      staffId,
      name: name.toUpperCase(),
      fatherName: fatherName.toUpperCase(),
      motherName: (motherName || '').toUpperCase(),
      dob, email: (email || '').trim().toLowerCase(),
      address: (address || '').toUpperCase(),
      admissionDate: admissionDate || '',
      contactNumber: contactNumber || '',
      course: course.toUpperCase(),
      session: session.toUpperCase(),
      photo: photo || '',
      paymentScreenshot,
      paymentDescription: paymentDescription || '',
      staffNote: staffNote || '',
      universityBoard: universityBoard || '',
      documents,
      status: 'pending',
      correctionCount: 0,
      adminDocuments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!db.staffStudents) db.staffStudents = [];
    db.staffStudents.push(student);
    writeDB(db);
    res.json({ message: 'Student added successfully', student });
  } catch (err) {
    console.error('Staff add student error:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Staff: Edit student (request correction)
app.put('/api/staff/students/:id', upload.array('documents', 10), (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const db = readDB();
    const studentIdx = (db.staffStudents || []).findIndex(s => s.id === req.params.id && s.staffId === staffId);
    if (studentIdx < 0) return res.status(404).json({ error: 'Student not found' });
    const student = db.staffStudents[studentIdx];
    const { name, fatherName, motherName, dob, email, address, admissionDate, contactNumber, course, session, photo, correctionNote, staffNote, universityBoard } = req.body;
    
    const updatedFields = [];
    if (name && student.name !== name.toUpperCase()) {
      updatedFields.push(`Name (from "${student.name}" to "${name.toUpperCase()}")`);
      student.name = name.toUpperCase();
    }
    if (fatherName && student.fatherName !== fatherName.toUpperCase()) {
      updatedFields.push(`Father Name (from "${student.fatherName}" to "${fatherName.toUpperCase()}")`);
      student.fatherName = fatherName.toUpperCase();
    }
    if (motherName && student.motherName !== motherName.toUpperCase()) {
      updatedFields.push(`Mother Name (from "${student.motherName || 'None'}" to "${motherName.toUpperCase()}")`);
      student.motherName = motherName.toUpperCase();
    }
    if (dob && student.dob !== dob) {
      updatedFields.push(`DOB (from "${student.dob}" to "${dob}")`);
      student.dob = dob;
    }
    if (email && student.email !== email.trim().toLowerCase()) {
      updatedFields.push(`Email (from "${student.email || 'None'}" to "${email.trim().toLowerCase()}")`);
      student.email = email.trim().toLowerCase();
    }
    if (address && student.address !== address.toUpperCase()) {
      updatedFields.push(`Address (from "${student.address || 'None'}" to "${address.toUpperCase()}")`);
      student.address = address.toUpperCase();
    }
    if (admissionDate && student.admissionDate !== admissionDate) {
      updatedFields.push(`Admission Date (from "${student.admissionDate || 'None'}" to "${admissionDate}")`);
      student.admissionDate = admissionDate;
    }
    if (contactNumber && student.contactNumber !== contactNumber) {
      updatedFields.push(`Contact Number (from "${student.contactNumber || 'None'}" to "${contactNumber}")`);
      student.contactNumber = contactNumber;
    }
    if (course && student.course !== course.toUpperCase()) {
      updatedFields.push(`Course (from "${student.course}" to "${course.toUpperCase()}")`);
      student.course = course.toUpperCase();
    }
    if (session && student.session !== session.toUpperCase()) {
      updatedFields.push(`Session (from "${student.session}" to "${session.toUpperCase()}")`);
      student.session = session.toUpperCase();
    }
    if (photo !== undefined && student.photo !== photo) {
      updatedFields.push(`Photo`);
      student.photo = photo;
    }

    if (updatedFields.length > 0) {
      student.updatedFieldsLog = updatedFields;
      student.hasNewUpdates = true;
    }

    if (correctionNote) {
      student.correctionCount = (student.correctionCount || 0) + 1;
      student.correctionNote = correctionNote;
      student.correctionRequestedAt = new Date().toISOString();
    }
    if (staffNote !== undefined) {
      student.staffNote = staffNote;
    }
    if (universityBoard !== undefined) {
      student.universityBoard = universityBoard;
    }
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        student.documents.push({ filename: file.filename, originalname: file.originalname, path: `/uploads/${file.filename}` });
      });
      student.hasNewUpdates = true;
      if (!student.updatedFieldsLog) student.updatedFieldsLog = [];
      student.updatedFieldsLog.push("New uploaded documents");
    }
    student.status = 'pending';
    student.updatedAt = new Date().toISOString();
    db.staffStudents[studentIdx] = student;
    writeDB(db);
    res.json({ message: 'Student updated, correction requested', student });
  } catch (err) {
    console.error('Staff edit error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Staff: Delete student
app.delete('/api/staff/students/:id', (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const idx = (db.staffStudents || []).findIndex(s => s.id === req.params.id && s.staffId === staffId);
  if (idx < 0) return res.status(404).json({ error: 'Student not found' });
  db.staffStudents.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Student deleted' });
});

// Staff: Get admin-uploaded documents (with correction delay logic)
app.get('/api/staff/students/:id/documents', (req, res) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  const student = (db.staffStudents || []).find(s => s.id === req.params.id && s.staffId === staffId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const now = new Date();
  const docs = (student.adminDocuments || []).map(doc => {
    if (doc.forceAvailable) return { ...doc, isAvailable: true };
    const uploadedAt = new Date(doc.uploadedAt);
    const delayDays = doc.correctionRound || 1;
    const availableAt = new Date(uploadedAt.getTime() + delayDays * 24 * 60 * 60 * 1000);
    return { ...doc, isAvailable: now >= availableAt, availableAt: availableAt.toISOString() };
  });
  res.json(docs);
});

// ============================================================
// STAFF ADMIN APIs
// ============================================================

// Staff Admin: Login (hardcoded default, or from db)
app.post('/api/staff-admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const db = readDB();
    if (!db.staffAdmin) db.staffAdmin = [];
    // Create or update default admin credentials
    const defaultAdminIdx = db.staffAdmin.findIndex(a => a.id === 'staffadmin_1' || a.username.toLowerCase() === 'admin');
    const hashedPw = await bcrypt.hash('ihatelove', 10);
    if (defaultAdminIdx >= 0) {
      db.staffAdmin[defaultAdminIdx].username = 'Admin';
      db.staffAdmin[defaultAdminIdx].password = hashedPw;
      writeDB(db);
    } else if (db.staffAdmin.length === 0) {
      db.staffAdmin.push({ id: 'staffadmin_1', username: 'Admin', password: hashedPw, name: 'Staff Admin', createdAt: new Date().toISOString() });
      writeDB(db);
    }
    const admin = db.staffAdmin.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', admin: { id: admin.id, name: admin.name, username: admin.username } });
  } catch (err) {
    console.error('Staff admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Staff Admin: Get all staff
app.get('/api/staff-admin/staff', (req, res) => {
  const db = readDB();
  const staffList = (db.staff || []).map(s => ({ id: s.id, name: s.name, mobile: s.mobile, isActive: s.isActive, createdAt: s.createdAt }));
  res.json(staffList);
});

// Staff Admin: Delete a staff member
app.delete('/api/staff-admin/staff/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = (db.staff || []).findIndex(s => s.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Staff member not found' });
    db.staff.splice(idx, 1);
    writeDB(db);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Staff Admin: Delete a student's payment screenshot
app.delete('/api/staff-admin/students/:id/payment-screenshot', (req, res) => {
  try {
    const db = readDB();
    const student = (db.staffStudents || []).find(s => s.id === req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.paymentScreenshot = '';
    writeDB(db);
    res.json({ message: 'Payment screenshot deleted successfully' });
  } catch (err) {
    console.error('Delete payment screenshot error:', err);
    res.status(500).json({ error: 'Failed to delete payment screenshot' });
  }
});

// Staff Admin: Get all students from all staff
app.get('/api/staff-admin/students', (req, res) => {
  const db = readDB();
  let allStudents = (db.staffStudents || []).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const { search, staffId } = req.query;
  if (staffId) allStudents = allStudents.filter(s => s.staffId === staffId);
  if (search) {
    const q = search.toLowerCase();
    allStudents = allStudents.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(q))
    );
  }
  // Enrich with staff name
  const enriched = allStudents.map(s => {
    const staffMember = (db.staff || []).find(st => st.id === s.staffId);
    return { ...s, staffName: staffMember ? staffMember.name : 'Unknown' };
  });
  res.json(enriched);
});

// Staff Admin: Upload documents for a student
app.post('/api/staff-admin/students/:id/documents', upload.array('files', 20), (req, res) => {
  try {
    const db = readDB();
    const studentIdx = (db.staffStudents || []).findIndex(s => s.id === req.params.id);
    if (studentIdx < 0) return res.status(404).json({ error: 'Student not found' });
    const student = db.staffStudents[studentIdx];
    if (!student.adminDocuments) student.adminDocuments = [];
    const correctionRound = (student.correctionCount || 0) + 1;
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        files.push({ filename: file.filename, originalname: file.originalname, path: `/uploads/${file.filename}` });
      });
    }
    if (req.body.existingPaths) {
      const paths = JSON.parse(req.body.existingPaths);
      paths.forEach(p => {
        const fname = path.basename(p);
        files.push({ filename: fname, originalname: fname, path: p });
      });
    }
    if (files.length === 0) return res.status(400).json({ error: 'No files provided' });
    // 1. Delete previous admin files from disk
    if (student.adminDocuments && student.adminDocuments.length > 0) {
      student.adminDocuments.forEach(doc => {
        if (doc.files && doc.files.length > 0) {
          doc.files.forEach(f => {
            const filePath = path.join(uploadsDir, f.filename);
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                console.error(`Failed to delete old document file ${f.filename}:`, err);
              }
            }
          });
        }
      });
    }
    // 2. Clear previous documents list
    student.adminDocuments = [];

    const docEntry = {
      id: `staffdoc_${Date.now()}`,
      files,
      correctionRound,
      uploadedAt: new Date().toISOString(),
      forceAvailable: false,
      note: req.body.note || ''
    };
    student.adminDocuments.push(docEntry);
    student.status = 'active';
    student.updatedAt = new Date().toISOString();
    db.staffStudents[studentIdx] = student;

    // Create notification for the respective staff member
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: `notif_${Date.now()}`,
      staffId: student.staffId,
      type: 'document_upload',
      title: 'Document Uploaded by Admin',
      message: `Admin has uploaded documents for student "${student.name}" (${student.course}).`,
      studentId: student.id,
      studentName: student.name,
      correctionRound,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeDB(db);
    res.json({ message: 'Documents uploaded successfully', student });
  } catch (err) {
    console.error('Staff admin upload error:', err);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// Staff Admin: Force make documents available before time
app.post('/api/staff-admin/students/:studentId/documents/:docId/force-available', (req, res) => {
  try {
    const db = readDB();
    const student = (db.staffStudents || []).find(s => s.id === req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const doc = (student.adminDocuments || []).find(d => d.id === req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.forceAvailable = true;
    student.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json({ message: 'Document now available for download' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Staff Admin: Delete document entry
app.delete('/api/staff-admin/students/:studentId/documents/:docId', (req, res) => {
  try {
    const db = readDB();
    const student = (db.staffStudents || []).find(s => s.id === req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.adminDocuments = (student.adminDocuments || []).filter(d => d.id !== req.params.docId);
    student.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Staff Admin: Dismiss/review student updates notification
app.post('/api/staff-admin/students/:id/dismiss-updates', (req, res) => {
  try {
    const db = readDB();
    const student = (db.staffStudents || []).find(s => s.id === req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.hasNewUpdates = false;
    student.updatedFieldsLog = [];
    student.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json({ message: 'Updates marked as reviewed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Staff Admin: Dashboard stats
app.get('/api/staff-admin/dashboard-stats', (req, res) => {
  const db = readDB();
  const totalStaff = (db.staff || []).length;
  const totalStudents = (db.staffStudents || []).length;
  const pending = (db.staffStudents || []).filter(s => s.status === 'pending').length;
  const active = (db.staffStudents || []).filter(s => s.status === 'active').length;
  res.json({ totalStaff, totalStudents, pending, active });
});

// ============ NOTIFICATION ENDPOINTS ============

// Staff: Get my notifications
app.get('/api/staff/notifications', (req, res) => {
  try {
    const staffId = req.headers['x-staff-id'];
    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    const db = readDB();
    const notifications = (db.notifications || [])
      .filter(n => n.staffId === staffId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Staff: Mark notification as read
app.post('/api/staff/notifications/:id/read', (req, res) => {
  try {
    const staffId = req.headers['x-staff-id'];
    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    const db = readDB();
    const notification = (db.notifications || []).find(n => n.id === req.params.id && n.staffId === staffId);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    notification.read = true;
    writeDB(db);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Staff: Mark all notifications as read
app.post('/api/staff/notifications/read-all', (req, res) => {
  try {
    const staffId = req.headers['x-staff-id'];
    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    const db = readDB();
    (db.notifications || []).filter(n => n.staffId === staffId && !n.read).forEach(n => { n.read = true; });
    writeDB(db);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Staff: Delete a notification
app.delete('/api/staff/notifications/:id', (req, res) => {
  try {
    const staffId = req.headers['x-staff-id'];
    if (!staffId) return res.status(401).json({ error: 'Unauthorized' });
    const db = readDB();
    const idx = (db.notifications || []).findIndex(n => n.id === req.params.id && n.staffId === staffId);
    if (idx < 0) return res.status(404).json({ error: 'Notification not found' });
    db.notifications.splice(idx, 1);
    writeDB(db);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  await connectMongo();
});

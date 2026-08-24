import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, UploadCloud, FileText, Calendar, 
  Edit3, Trash2, Globe, Sliders, CheckCircle, Eye, 
  Printer, ArrowLeft, User, Image, BookOpen, 
  RefreshCw, X, AlertCircle, Wallet, CreditCard, 
  FileDown, Building2, Download, Lock, EyeOff, Bell, Key, MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Import Templates
import MarksheetTemplate from './components/MarksheetTemplate';
import AdmitCardTemplate from './components/AdmitCardTemplate';
import IdCardTemplate from './components/IdCardTemplate';
import OnlineResultTemplate from './components/OnlineResultTemplate';
import ImageCropper from './components/ImageCropper';
import AcknowledgementTemplate from './components/AcknowledgementTemplate';

export default function App() {
  // Navigation View: 'admin' or 'portal'
  const [currentView, setCurrentView] = useState('admin');
  
  // Database States
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Authentication States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdminAuthenticated') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminShowPass, setAdminShowPass] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin Tab: 'dashboard', 'add-student', 'courses'
  const [adminTab, setAdminTab] = useState('dashboard');
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  
  // Dashboard Search & Filters
  const [searchCourse, setSearchCourse] = useState('');
  const [searchSession, setSearchSession] = useState('');

  // Form States (New/Edit Student)
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    courseName: '',
    session: '',
    photo: '',
    email: '',
    centerStudentId: '',
  });
  const [selectedTerm, setSelectedTerm] = useState(''); // e.g. "1st Semester"
  const [formMarksheets, setFormMarksheets] = useState({}); // { termName: { subjectCode: obtainedMarks } }
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [isCompleteEdit, setIsCompleteEdit] = useState(false);

  // Photo cropping states
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);

  // Course Upload CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvMessage, setCsvMessage] = useState('');

  // Document Modal View State
  const [activeDocStudent, setActiveDocStudent] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState('marksheet'); // 'marksheet', 'admit', 'id', 'result'
  const [activeDocTerm, setActiveDocTerm] = useState('');

  // Portal Public Search States
  const [portalEmail, setPortalEmail] = useState('');
  const [portalSearchVal, setPortalSearchVal] = useState('');
  const [portalStudent, setPortalStudent] = useState(null);
  const [portalCourse, setPortalCourse] = useState(null);
  const [portalError, setPortalError] = useState('');
  const [portalActiveTab, setPortalActiveTab] = useState('marksheet');
  const [portalActiveTerm, setPortalActiveTerm] = useState('');
  
  // Selective Publishing States
  const [publishingStudent, setPublishingStudent] = useState(null);
  const [localPublishDocs, setLocalPublishDocs] = useState({
    idCard: false,
    marksheets: {},
    admitCards: {},
    results: {}
  });

  // ---- CENTER STATES ----
  const [centerView, setCenterView] = useState('dashboard'); // 'dashboard', 'add-student', 'edit-student', 'payment-history', 'wallet', 'acknowledgement'
  const [centerAuthenticated, setCenterAuthenticated] = useState(() => sessionStorage.getItem('centerAuthenticated') === 'true');
  const [centerData, setCenterData] = useState(() => {
    const stored = sessionStorage.getItem('centerData');
    return stored ? JSON.parse(stored) : null;
  });
  const [centerLoginUser, setCenterLoginUser] = useState('');
  const [centerLoginPass, setCenterLoginPass] = useState('');
  const [centerLoginShowPass, setCenterLoginShowPass] = useState(false);
  const [centerLoginError, setCenterLoginError] = useState('');
  const [centerStudents, setCenterStudents] = useState([]);
  const [centerStats, setCenterStats] = useState({ total: 0, active: 0, pending: 0, walletBalance: 0 });
  const [centerStudentForm, setCenterStudentForm] = useState({
    name: '', fatherName: '', motherName: '', dob: '', email: '',
    address: '', admissionDate: '', contactNumber: '', course: '', session: ''
  });
  const [centerStudentPhoto, setCenterStudentPhoto] = useState('');
  const [centerCropSrc, setCenterCropSrc] = useState(null);
  const [centerDocuments, setCenterDocuments] = useState([]);
  const [centerExistingStudent, setCenterExistingStudent] = useState(null);
  const [centerSearch, setCenterSearch] = useState('');
  const [centerPayments, setCenterPayments] = useState([]);
  const [centerWallet, setCenterWallet] = useState({ balance: 0, transactions: [] });
  const [centerAckStudent, setCenterAckStudent] = useState(null);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerPayModal, setCenterPayModal] = useState({ open: false, studentId: '', studentName: '', amount: '', description: '', screenshot: null, screenshotPreview: '' });
  const [adminCenterPayments, setAdminCenterPayments] = useState([]);
  const [adminCenterPaymentsView, setAdminCenterPaymentsView] = useState(null);

  // ---- STAFF STATES ----
  const [staffView, setStaffView] = useState('login'); // 'login', 'register', 'dashboard', 'add-student', 'edit-student', 'view-documents'
  const [staffAuthenticated, setStaffAuthenticated] = useState(() => sessionStorage.getItem('staffAuthenticated') === 'true');
  const [staffData, setStaffData] = useState(() => {
    const stored = sessionStorage.getItem('staffData');
    return stored ? JSON.parse(stored) : null;
  });
  const [staffLoginMobile, setStaffLoginMobile] = useState('');
  const [staffLoginPass, setStaffLoginPass] = useState('');
  const [staffLoginShowPass, setStaffLoginShowPass] = useState(false);
  const [staffLoginError, setStaffLoginError] = useState('');
  const [staffRegName, setStaffRegName] = useState('');
  const [staffRegMobile, setStaffRegMobile] = useState('');
  const [staffRegPass, setStaffRegPass] = useState('');
  const [staffRegShowPass, setStaffRegShowPass] = useState(false);
  const [staffStudents, setStaffStudents] = useState([]);
  const [staffStats, setStaffStats] = useState({ total: 0, active: 0, pending: 0 });
  const [staffStudentForm, setStaffStudentForm] = useState({
    name: '', fatherName: '', motherName: '', dob: '', email: '',
    address: '', admissionDate: '', contactNumber: '', course: '', session: '', paymentDescription: '', staffNote: '', universityBoard: ''
  });
  const [staffStudentPhoto, setStaffStudentPhoto] = useState('');
  const [staffCropSrc, setStaffCropSrc] = useState(null);
  const [staffDocuments, setStaffDocuments] = useState([]);
  const [staffExistingStudent, setStaffExistingStudent] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSelectedStudentDocs, setStaffSelectedStudentDocs] = useState(null);
  const [staffNotifications, setStaffNotifications] = useState([]);
  const [staffNotifOpen, setStaffNotifOpen] = useState(false);
  const [staffPaymentScreenshot, setStaffPaymentScreenshot] = useState('');
  const [staffChatMessages, setStaffChatMessages] = useState([]);
  const [staffChatInput, setStaffChatInput] = useState('');
  const [staffChatShowEmoji, setStaffChatShowEmoji] = useState(false);
  const staffChatEndRef = React.useRef(null);
  const [customModal, setCustomModal] = useState({
    open: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  const showAlert = (message, title = 'Notification') => {
    setCustomModal({
      open: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => setCustomModal(prev => ({ ...prev, open: false }))
    });
  };

  const showConfirm = (message, onConfirm, title = 'Confirmation Required') => {
    setCustomModal({
      open: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setCustomModal(prev => ({ ...prev, open: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => setCustomModal(prev => ({ ...prev, open: false }))
    });
  };

  // ---- STAFF ADMIN STATES ----
  const [staffAdminView, setStaffAdminView] = useState('login'); // 'login', 'dashboard', 'students', 'manage-student', 'view-documents'
  const [staffAdminAuthenticated, setStaffAdminAuthenticated] = useState(() => sessionStorage.getItem('staffAdminAuthenticated') === 'true');
  const [staffAdminData, setStaffAdminData] = useState(() => {
    const stored = sessionStorage.getItem('staffAdminData');
    return stored ? JSON.parse(stored) : null;
  });
  const [staffAdminUsername, setStaffAdminUsername] = useState('');
  const [staffAdminPass, setStaffAdminPass] = useState('');
  const [staffAdminShowPass, setStaffAdminShowPass] = useState(false);
  const [staffAdminLoginError, setStaffAdminLoginError] = useState('');
  const [staffAdminStats, setStaffAdminStats] = useState({ totalStaff: 0, totalStudents: 0, pending: 0, active: 0 });
  const [staffAdminStaffList, setStaffAdminStaffList] = useState([]);
  const [staffAdminStudents, setStaffAdminStudents] = useState([]);
  const [staffAdminSelectedStudent, setStaffAdminSelectedStudent] = useState(null);
  const [staffAdminUploadFiles, setStaffAdminUploadFiles] = useState([]);
  const [staffAdminUploadNote, setStaffAdminUploadNote] = useState('');
  const [staffAdminUploadProgress, setStaffAdminUploadProgress] = useState(null);
  const [staffAdminSearch, setStaffAdminSearch] = useState('');
  const [staffAdminFilterStaff, setStaffAdminFilterStaff] = useState('');
  const [staffAdminPaymentSearch, setStaffAdminPaymentSearch] = useState('');
  const [staffAdminPaymentFilterUniv, setStaffAdminPaymentFilterUniv] = useState('');
  const [staffAdminSelectedStaffId, setStaffAdminSelectedStaffId] = useState(null);
  const [staffDetailData, setStaffDetailData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatPollRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  // ---- ADMIN CENTER MANAGEMENT STATES ----
  const [adminCenters, setAdminCenters] = useState([]);
  const [adminCenterForm, setAdminCenterForm] = useState({ centerName: '', username: '', password: '', contactPerson: '', email: '', phone: '', address: '' });
  const [adminEditingCenter, setAdminEditingCenter] = useState(null);
  const [adminCenterStudents, setAdminCenterStudents] = useState([]);
  const [adminSelectedCenter, setAdminSelectedCenter] = useState(null);
  const [adminAllCenterPayments, setAdminAllCenterPayments] = useState([]);
  const [walletTopupModal, setWalletTopupModal] = useState({ open: false, centerId: '', centerName: '', amount: '', description: '' });

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const cleanUsername = adminUsername.trim().toUpperCase();
    if ((cleanUsername === 'GURUKUL VIDHYAPEETH UNIVERSITY' || cleanUsername === 'GURUKUL VIDYAPEETH UNIVERSITY') && adminPassword === 'ihatelove') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setAdminUsername('');
      setAdminPassword('');
      fetchData();
      checkGoogleDriveStatus();
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('isAdminAuthenticated');
  };

  const checkGoogleDriveStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setGoogleDriveConnected(data.authenticated);
    } catch (err) { console.error(err); }
  };

  const handleGoogleDriveConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/login');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { alert('Failed to start Google Drive authentication'); }
  };

  const handleGoogleDriveDisconnect = async () => {
    if (!confirm('Disconnect Google Drive? Files already uploaded will remain in your Drive.')) return;
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      setGoogleDriveConnected(false);
    } catch (err) { alert('Failed to disconnect'); }
  };

  // Keep Render free instance awake by pinging every 10 minutes
  useEffect(() => {
    const ping = () => fetch('/health').catch(() => {});
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Chat polling + staff detail fetch
  useEffect(() => {
    if (staffAdminView === 'staff-detail' && staffAdminSelectedStaffId) {
      fetchStaffDetail(staffAdminSelectedStaffId);
      fetchChatMessages(staffAdminSelectedStaffId);
      chatPollRef.current = setInterval(() => fetchChatMessages(staffAdminSelectedStaffId), 5000);
      return () => clearInterval(chatPollRef.current);
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    }
  }, [staffAdminView, staffAdminSelectedStaffId]);

  // Load database on mount and check URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const docParam = params.get('doc');
    
    if (viewParam === 'portal') {
      setCurrentView('portal');
      if (docParam) {
        setPortalActiveTab(docParam);
      }
    } else if (viewParam === 'center-login' || viewParam === 'center-dashboard') {
      setCurrentView('center');
      if (sessionStorage.getItem('centerAuthenticated') === 'true') {
        fetchCenterData();
      }
    } else if (viewParam === 'staff-login') {
      setCurrentView('staff');
      if (sessionStorage.getItem('staffAuthenticated') === 'true') {
        setStaffView('dashboard');
        fetchStaffData();
        fetchStaffNotifications();
      } else {
        setStaffView('login');
      }
    } else if (viewParam === 'staff-admin') {
      setCurrentView('staff-admin');
      if (sessionStorage.getItem('staffAdminAuthenticated') === 'true') {
        setStaffAdminView('dashboard');
        fetchStaffAdminData();
      } else {
        setStaffAdminView('login');
      }
    } else {
      if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        fetchData();
        checkGoogleDriveStatus();
      }
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/db');
      if (!res.ok) throw new Error('Failed to load database.');
      const data = await res.json();
      setCourses(data.courses || []);
      setStudents(data.students || []);
    } catch (e) {
      console.error(e);
      setErrorMsg('Could not connect to backend server. Make sure node server.js is running.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to register view or edit view
  const startRegisterStudent = () => {
    setEditingStudentId(null);
    setIsCompleteEdit(false);
    setFormData({
      name: '',
      fatherName: '',
      motherName: '',
      dob: '',
      courseName: courses.length > 0 ? courses[0].name : '',
      session: '',
      photo: '',
      email: '',
      centerStudentId: '',
    });
    setSelectedTerm('');
    setFormMarksheets({});
    setAdminTab('add-student');
  };

  const startEditStudent = (student, complete) => {
    skipNextCourseReset.current = true;
    setEditingStudentId(student.id);
    setIsCompleteEdit(complete);
    setFormData({
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dob: student.dob,
      courseName: student.course,
      session: student.session,
      photo: student.photo,
      email: student.email || '',
      centerStudentId: '',
    });
    
    // Choose the first marksheet term as selected
    const terms = Object.keys(student.marksheets);
    const initialTerm = terms.includes(selectedTerm) ? selectedTerm : (terms[0] || '');
    setSelectedTerm(initialTerm);
    
    // Gather all existing term marks into formMarksheets
    const initialMarks = {};
    Object.keys(student.marksheets).forEach(t => {
      initialMarks[t] = student.marksheets[t].marks || {};
    });
    setFormMarksheets(initialMarks);
    
    setAdminTab('add-student');
  };

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Store cropped photo as base64 data URL directly in the database
  // This avoids ephemeral filesystem issues on Render.com
  const handleCropComplete = (croppedBase64) => {
    setCropSrc(null);
    setFormData(prev => ({ ...prev, photo: croppedBase64 }));
  };

  // Flag to skip course-change auto-reset during edit
  const skipNextCourseReset = React.useRef(false);

  // Form Course Change => reset Term and Marks table only when user manually picks a different course
  useEffect(() => {
    if (!formData.courseName || courses.length === 0) return;
    if (skipNextCourseReset.current) {
      skipNextCourseReset.current = false;
      return;
    }
    const selectedCourse = courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase());
    if (selectedCourse) {
      const terms = Object.keys(selectedCourse.terms);
      if (terms.length > 0) {
        setSelectedTerm(terms[0]);
        setFormMarksheets({});
      }
    }
  }, [formData.courseName, courses]);

  // Close staff notification dropdown on outside click
  useEffect(() => {
    if (!staffNotifOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.staff-notif-dropdown') && !e.target.closest('[data-notif-toggle]')) {
        setStaffNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [staffNotifOpen]);

  // Handle Marks input change targeting specific active selectedTerm
  const handleMarkChange = (subCode, val, maxMarks) => {
    const numericVal = val === '' ? '' : Math.min(maxMarks, Math.max(0, parseInt(val) || 0));
    setFormMarksheets(prev => ({
      ...prev,
      [selectedTerm]: {
        ...(prev[selectedTerm] || {}),
        [subCode]: numericVal
      }
    }));
  };

  // Submit Student Registration/Update
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.fatherName || !formData.motherName || !formData.dob || !formData.courseName || !formData.session) {
      alert('Please fill in all student credentials.');
      return;
    }

    try {
      // Assemble marksheet data structure for all terms in formMarksheets
      const marksheetsData = {};
      Object.keys(formMarksheets).forEach(termName => {
        marksheetsData[termName] = {
          marks: formMarksheets[termName] || {}
        };
      });

      let url = '/api/students';
      let method = 'POST';
      let bodyData = {
        ...formData,
        marksheetsData
      };

      if (editingStudentId) {
        url = `/api/students/${editingStudentId}`;
        method = 'PUT';
        bodyData = {
          ...formData,
          marksheetsData,
          isCompleteEdit,
          id: editingStudentId
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const resJson = await response.json();
      if (!response.ok) {
        alert(resJson.error || 'Failed to save student record');
        return;
      }

      // Success
      await fetchData();
      setAdminTab('dashboard');
      
      // Fire confetti for new student creation!
      if (!editingStudentId) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    }
  };

  // Delete student
  const handleDeleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student record? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to delete student');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open publish config dialog
  const startPublishDocs = (student) => {
    setPublishingStudent(student);
    setLocalPublishDocs(student.publishedDocs || {
      idCard: false,
      marksheets: {},
      admitCards: {},
      results: {}
    });
  };

  // Submit selective publishing settings to server
  const submitPublishSettings = async () => {
    try {
      const res = await fetch(`/api/students/${publishingStudent.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedDocs: localPublishDocs })
      });
      if (res.ok) {
        await fetchData();
        setPublishingStudent(null);
        // Celebration!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
      } else {
        alert('Failed to update publishing settings.');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    }
  };

  // CSV Course upload
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvMessage('Please select a CSV file first.');
      return;
    }

    const form = new FormData();
    form.append('csvFile', csvFile);

    setCsvMessage('Uploading and parsing CSV...');
    try {
      const res = await fetch('/api/courses/upload', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        setCsvMessage('CSV uploaded successfully!');
        setCourses(data.courses || []);
        setCsvFile(null);
        await fetchData();
      } else {
        setCsvMessage(data.error || 'Failed to parse CSV');
      }
    } catch (err) {
      console.error(err);
      setCsvMessage('Error uploading file.');
    }
  };

  // Document modal viewer triggers
  const openDocsModal = (student) => {
    setActiveDocStudent(student);
    setActiveDocTab('marksheet');
    const terms = Object.keys(student.marksheets);
    setActiveDocTerm(terms[0] || '');
  };

  // Public portal search lookup
  const handlePortalSearch = async (e) => {
    e.preventDefault();
    setPortalError('');
    setPortalStudent(null);
    setPortalCourse(null);

    if (!portalEmail || !portalSearchVal) {
      setPortalError('Both student email and roll/enrollment number are required.');
      return;
    }

    try {
      const res = await fetch(`/api/public/student?email=${encodeURIComponent(portalEmail)}&searchVal=${encodeURIComponent(portalSearchVal)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setPortalError(data.error || 'Student not found.');
        return;
      }
      
      setPortalStudent(data.student);
      setPortalCourse(data.course);
      
      const terms = Object.keys(data.student.marksheets);
      const docs = data.student.publishedDocs || {};
      
      // Find the first term that has at least one document published
      const firstPublishedTerm = terms.find(t => {
        const showM = docs.marksheets && docs.marksheets[t];
        const showA = docs.admitCards && docs.admitCards[t];
        const showR = docs.results && docs.results[t];
        return showM || showA || showR;
      }) || '';
      
      // Check query parameter 'doc' to pre-select target doc/term
      const params = new URLSearchParams(window.location.search);
      const urlDoc = params.get('doc');
      
      let activeTerm = firstPublishedTerm;
      if (urlDoc && urlDoc !== 'id') {
        const matchingTerm = terms.find(t => {
          if (urlDoc === 'marksheet') return docs.marksheets?.[t];
          if (urlDoc === 'admit') return docs.admitCards?.[t];
          if (urlDoc === 'result') return docs.results?.[t];
          return false;
        });
        if (matchingTerm) {
          activeTerm = matchingTerm;
        }
      }
      setPortalActiveTerm(activeTerm);
      
      // Determine default active tab based on what's actually published and URL parameter
      let defaultTab = 'marksheet';
      if (urlDoc && (
        (urlDoc === 'id' && docs.idCard) ||
        (urlDoc === 'marksheet' && activeTerm && docs.marksheets?.[activeTerm]) ||
        (urlDoc === 'admit' && activeTerm && docs.admitCards?.[activeTerm]) ||
        (urlDoc === 'result' && activeTerm && docs.results?.[activeTerm])
      )) {
        defaultTab = urlDoc;
      } else if (activeTerm) {
        if (docs.marksheets && docs.marksheets[activeTerm]) defaultTab = 'marksheet';
        else if (docs.admitCards && docs.admitCards[activeTerm]) defaultTab = 'admit';
        else if (docs.results && docs.results[activeTerm]) defaultTab = 'result';
      } else if (docs.idCard) {
        defaultTab = 'id';
      }
      setPortalActiveTab(defaultTab);
    } catch (err) {
      console.error(err);
      setPortalError('Unable to connect to database. Please check back later.');
    }
  };

  // Trigger print in browser
  const triggerPrint = () => {
    window.print();
  };

  // Filter students based on search input
  const filteredStudents = students.filter(student => {
    const matchCourse = searchCourse ? student.course.toLowerCase().includes(searchCourse.toLowerCase()) : true;
    const matchSession = searchSession ? student.session.toLowerCase().includes(searchSession.toLowerCase()) : true;
    return matchCourse && matchSession;
  });

  // ---- CENTER HANDLERS ----
  const handleCenterLogin = async (e) => {
    e.preventDefault();
    setCenterLoginError('');
    try {
      const res = await fetch('/api/center/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: centerLoginUser, password: centerLoginPass })
      });
      const data = await res.json();
      if (!res.ok) { setCenterLoginError(data.error || 'Login failed'); return; }
      setCenterAuthenticated(true);
      setCenterData(data.center);
      sessionStorage.setItem('centerAuthenticated', 'true');
      sessionStorage.setItem('centerData', JSON.stringify(data.center));
      setCenterLoginUser('');
      setCenterLoginPass('');
      fetchCenterData();
    } catch (err) { setCenterLoginError('Connection error'); }
  };

  const handleCenterLogout = () => {
    setCenterAuthenticated(false);
    setCenterData(null);
    setCenterStudents([]);
    sessionStorage.removeItem('centerAuthenticated');
    sessionStorage.removeItem('centerData');
  };

  const fetchCenterData = async () => {
    const center = JSON.parse(sessionStorage.getItem('centerData'));
    if (!center) return;
    setCenterLoading(true);
    try {
      const headers = { 'x-center-id': center.id };
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/center/dashboard-stats', { headers }),
        fetch('/api/center/students', { headers })
      ]);
      if (statsRes.ok) setCenterStats(await statsRes.json());
      if (studentsRes.ok) setCenterStudents(await studentsRes.json());
    } catch (err) { console.error('Error fetching center data:', err); }
    setCenterLoading(false);
  };

  const handleCenterStudentSave = async (e) => {
    e.preventDefault();
    const form = centerStudentForm;
    if (!form.name || !form.fatherName || !form.motherName || !form.dob || !form.email || !form.address || !form.admissionDate || !form.contactNumber || !form.course || !form.session) {
      alert('All mandatory fields are required.');
      return;
    }
    const formDataToSend = new FormData();
    Object.keys(form).forEach(k => formDataToSend.append(k, form[k]));
    if (centerStudentPhoto) formDataToSend.append('photo', centerStudentPhoto);
    centerDocuments.forEach(doc => formDataToSend.append('documents', doc));

    try {
      const center = JSON.parse(sessionStorage.getItem('centerData'));
      const url = centerExistingStudent ? `/api/center/students/${centerExistingStudent.id}` : '/api/center/students';
      const method = centerExistingStudent ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'x-center-id': center.id }, body: formDataToSend });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed to save'); return; }
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      setCenterView('dashboard');
      setCenterExistingStudent(null);
      resetCenterStudentForm();
      fetchCenterData();
    } catch (err) { alert('Connection error'); }
  };

  const resetCenterStudentForm = () => {
    setCenterStudentForm({ name: '', fatherName: '', motherName: '', dob: '', email: '', address: '', admissionDate: '', contactNumber: '', course: '', session: '' });
    setCenterStudentPhoto('');
    setCenterDocuments([]);
  };

  const handleCenterPhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setCenterCropSrc(reader.result);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCenterCropComplete = (croppedBase64) => {
    setCenterCropSrc(null);
    setCenterStudentPhoto(croppedBase64);
  };

  const fetchCenterPayments = async () => {
    const center = JSON.parse(sessionStorage.getItem('centerData'));
    if (!center) return;
    try {
      const res = await fetch('/api/center/payments', { headers: { 'x-center-id': center.id } });
      if (res.ok) setCenterPayments(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCenterWallet = async () => {
    const center = JSON.parse(sessionStorage.getItem('centerData'));
    if (!center) return;
    try {
      const res = await fetch('/api/center/wallet', { headers: { 'x-center-id': center.id } });
      if (res.ok) setCenterWallet(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCenterAckDownload = async (student) => {
    setCenterAckStudent(student);
    setCenterView('acknowledgement');
  };

  const handleCenterDeleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student? This cannot be undone.')) return;
    try {
      const center = JSON.parse(sessionStorage.getItem('centerData'));
      const res = await fetch(`/api/center/students/${id}`, { method: 'DELETE', headers: { 'x-center-id': center.id } });
      if (res.ok) {
        fetchCenterData();
      } else {
        alert('Failed to delete student');
      }
    } catch (err) { console.error(err); alert('Error deleting student'); }
  };

  const handleCenterPaySubmit = async () => {
    const { studentId, amount, description, screenshot } = centerPayModal;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) { alert('Please enter a valid amount'); return; }
    if (parseFloat(amount) > centerStats.walletBalance) { alert('Insufficient wallet balance'); return; }
    
    try {
      const center = JSON.parse(sessionStorage.getItem('centerData'));
      
      // First upload screenshot if provided
      let screenshotUrl = '';
      if (screenshot) {
        const formData = new FormData();
        formData.append('photo', screenshot);
        const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          screenshotUrl = uploadData.photoUrl;
        }
      }
      
      // Then process payment
      const res = await fetch('/api/center/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-center-id': center.id },
        body: JSON.stringify({ studentId, amount: parseFloat(amount), description: description || `Fee payment for student`, screenshot: screenshotUrl })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Payment failed');
        return;
      }
      
      const data = await res.json();
      setCenterStats(prev => ({ ...prev, walletBalance: data.balance }));
      setCenterPayModal({ open: false, studentId: '', studentName: '', amount: '', description: '', screenshot: null, screenshotPreview: '' });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      fetchCenterData();
      alert(`Payment successful! ₹${amount} deducted. Remaining balance: ₹${data.balance}`);
    } catch (err) { alert('Payment error'); }
  };

  const filteredCenterStudents = centerStudents.filter(s => {
    if (!centerSearch) return true;
    const q = centerSearch.toLowerCase();
    return (s.name && s.name.toLowerCase().includes(q)) || (s.course && s.course.toLowerCase().includes(q)) || (s.session && s.session.toLowerCase().includes(q));
  });

  // ---- ADMIN CENTER MANAGEMENT HANDLERS ----
  const fetchAdminCenters = async () => {
    try {
      const res = await fetch('/api/admin/centers');
      if (res.ok) setAdminCenters(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAdminCenterPayments = async (centerId = null) => {
    try {
      const res = await fetch('/api/admin/center-payments');
      if (res.ok) {
        const data = await res.json();
        setAdminCenterPayments(centerId ? data.filter(p => p.centerId === centerId) : data);
        setAdminCenterPaymentsView(centerId);
      }
    } catch (err) { console.error(err); }
  };

  const handleAdminCenterSave = async (e) => {
    e.preventDefault();
    try {
      const url = adminEditingCenter ? `/api/admin/centers/${adminEditingCenter.id}` : '/api/admin/centers';
      const method = adminEditingCenter ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminCenterForm) });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed'); return; }
      setAdminCenterForm({ centerName: '', username: '', password: '', contactPerson: '', email: '', phone: '', address: '' });
      setAdminEditingCenter(null);
      fetchAdminCenters();
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch (err) { alert('Connection error'); }
  };

  const handleAdminDeleteCenter = async (id) => {
    if (!confirm('Delete this center? This cannot be undone.')) return;
    try { await fetch(`/api/admin/centers/${id}`, { method: 'DELETE' }); fetchAdminCenters(); } catch (err) { console.error(err); }
  };

  // ---- STAFF HANDLERS ----
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setStaffLoginError('');
    try {
      const res = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: staffLoginMobile.trim(), password: staffLoginPass }) });
      const data = await res.json();
      if (!res.ok) { setStaffLoginError(data.error || 'Login failed'); return; }
      setStaffAuthenticated(true);
      setStaffData(data.staff);
      sessionStorage.setItem('staffAuthenticated', 'true');
      sessionStorage.setItem('staffData', JSON.stringify(data.staff));
      setStaffView('dashboard');
      fetchStaffData();
      fetchStaffNotifications();
    } catch (err) { setStaffLoginError('Connection error'); }
  };

  const handleStaffRegister = async (e) => {
    e.preventDefault();
    setStaffLoginError('');
    try {
      const res = await fetch('/api/staff/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: staffRegName, mobile: staffRegMobile.trim(), password: staffRegPass }) });
      const data = await res.json();
      if (!res.ok) { setStaffLoginError(data.error || 'Registration failed'); return; }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert('Account created! You can now login.');
      setStaffView('login');
      setStaffRegName(''); setStaffRegMobile(''); setStaffRegPass('');
    } catch (err) { setStaffLoginError('Connection error'); }
  };

  const fetchStaffData = async () => {
    const staff = JSON.parse(sessionStorage.getItem('staffData'));
    if (!staff) return;
    setStaffLoading(true);
    try {
      const headers = { 'x-staff-id': staff.id };
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/staff/dashboard-stats', { headers }),
        fetch('/api/staff/students', { headers })
      ]);
      if (statsRes.ok) setStaffStats(await statsRes.json());
      if (studentsRes.ok) setStaffStudents(await studentsRes.json());
    } catch (err) { console.error(err); }
    setStaffLoading(false);
  };

  const fetchStaffNotifications = async () => {
    const staff = JSON.parse(sessionStorage.getItem('staffData'));
    if (!staff) return;
    try {
      const res = await fetch('/api/staff/notifications', { headers: { 'x-staff-id': staff.id } });
      if (res.ok) setStaffNotifications(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleStaffMarkNotifRead = async (notifId) => {
    const staff = JSON.parse(sessionStorage.getItem('staffData'));
    if (!staff) return;
    try {
      await fetch(`/api/staff/notifications/${notifId}/read`, { method: 'POST', headers: { 'x-staff-id': staff.id } });
      setStaffNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleStaffMarkAllRead = async () => {
    const staff = JSON.parse(sessionStorage.getItem('staffData'));
    if (!staff) return;
    try {
      await fetch('/api/staff/notifications/read-all', { method: 'POST', headers: { 'x-staff-id': staff.id } });
      setStaffNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const handleStaffDeleteNotif = async (notifId) => {
    const staff = JSON.parse(sessionStorage.getItem('staffData'));
    if (!staff) return;
    try {
      await fetch(`/api/staff/notifications/${notifId}`, { method: 'DELETE', headers: { 'x-staff-id': staff.id } });
      setStaffNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) { console.error(err); }
  };

  const handleStaffAddStudent = async (e) => {
    e.preventDefault();
    try {
      const staff = JSON.parse(sessionStorage.getItem('staffData'));
      const fd = new FormData();
      Object.entries(staffStudentForm).forEach(([k, v]) => fd.append(k, v));
      if (staffStudentPhoto) fd.append('photo', staffStudentPhoto);
      if (staffPaymentScreenshot) fd.append('paymentScreenshot', staffPaymentScreenshot);
      staffDocuments.forEach(doc => fd.append('documents', doc));
      const res = await fetch('/api/staff/students', { method: 'POST', headers: { 'x-staff-id': staff.id }, body: fd });
      if (res.ok) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        setStaffStudentForm({ name: '', fatherName: '', motherName: '', dob: '', email: '', address: '', admissionDate: '', contactNumber: '', course: '', session: '', paymentDescription: '', staffNote: '', universityBoard: '' });
        setStaffStudentPhoto(''); setStaffDocuments([]); setStaffPaymentScreenshot('');
        setStaffView('dashboard');
        fetchStaffData();
      } else { const err = await res.json(); alert(err.error || 'Failed'); }
    } catch (err) { alert('Connection error'); }
  };

  const handleStaffEditStudent = async (e) => {
    e.preventDefault();
    try {
      const staff = JSON.parse(sessionStorage.getItem('staffData'));
      const fd = new FormData();
      Object.entries(staffStudentForm).forEach(([k, v]) => fd.append(k, v));
      fd.append('correctionNote', 'Staff correction request');
      if (staffStudentPhoto && !staffStudentPhoto.startsWith('/')) fd.append('photo', staffStudentPhoto);
      staffDocuments.forEach(doc => fd.append('documents', doc));
      const res = await fetch(`/api/staff/students/${staffExistingStudent.id}`, { method: 'PUT', headers: { 'x-staff-id': staff.id }, body: fd });
      if (res.ok) {
        setStaffStudentForm({ name: '', fatherName: '', motherName: '', dob: '', email: '', address: '', admissionDate: '', contactNumber: '', course: '', session: '', paymentDescription: '', staffNote: '', universityBoard: '' });
        setStaffStudentPhoto(''); setStaffDocuments([]); setStaffExistingStudent(null);
        setStaffView('dashboard');
        fetchStaffData();
        alert('Correction request submitted!');
      } else { const err = await res.json(); alert(err.error || 'Failed'); }
    } catch (err) { alert('Connection error'); }
  };

  const handleStaffDeleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      const staff = JSON.parse(sessionStorage.getItem('staffData'));
      await fetch(`/api/staff/students/${id}`, { method: 'DELETE', headers: { 'x-staff-id': staff.id } });
      fetchStaffData();
    } catch (err) { alert('Error'); }
  };

  const handleStaffViewDocs = async (student) => {
    try {
      const staff = JSON.parse(sessionStorage.getItem('staffData'));
      const res = await fetch(`/api/staff/students/${student.id}/documents`, { headers: { 'x-staff-id': staff.id } });
      if (res.ok) {
        const docs = await res.json();
        setStaffSelectedStudentDocs({ student, documents: docs });
        setStaffView('view-documents');
      }
    } catch (err) { alert('Error loading documents'); }
  };

  const startStaffEditStudent = (student) => {
    setStaffExistingStudent(student);
    setStaffStudentForm({
      name: student.name, fatherName: student.fatherName, motherName: student.motherName || '',
      dob: student.dob, email: student.email || '', address: student.address || '',
      admissionDate: student.admissionDate || '', contactNumber: student.contactNumber || '',
      course: student.course, session: student.session, paymentDescription: student.paymentDescription || '',
      staffNote: student.staffNote || '', universityBoard: student.universityBoard || ''
    });
    setStaffStudentPhoto(student.photo || '');
    setStaffDocuments([]);
    setStaffView('edit-student');
  };

  // ---- STAFF ADMIN HANDLERS ----
  const handleStaffAdminLogin = async (e) => {
    e.preventDefault();
    setStaffAdminLoginError('');
    try {
      const res = await fetch('/api/staff-admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: staffAdminUsername.trim(), password: staffAdminPass }) });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {}
      if (!res.ok) { 
        setStaffAdminLoginError(data.error || `Login failed (Status: ${res.status}). Make sure you restarted your Node server!`); 
        return; 
      }
      setStaffAdminAuthenticated(true);
      setStaffAdminData(data.admin);
      sessionStorage.setItem('staffAdminAuthenticated', 'true');
      sessionStorage.setItem('staffAdminData', JSON.stringify(data.admin));
      setStaffAdminView('dashboard');
      fetchStaffAdminData();
    } catch (err) { setStaffAdminLoginError('Connection error'); }
  };

  const fetchStaffAdminData = async () => {
    try {
      await fetch('/api/staff-admin/backfill-passwords', { method: 'POST' }).catch(() => {});
      const [statsRes, staffRes, studentsRes] = await Promise.all([
        fetch('/api/staff-admin/dashboard-stats'),
        fetch('/api/staff-admin/staff'),
        fetch('/api/staff-admin/students')
      ]);
      if (statsRes.ok) setStaffAdminStats(await statsRes.json());
      if (staffRes.ok) setStaffAdminStaffList(await staffRes.json());
      if (studentsRes.ok) {
        const studentsList = await studentsRes.json();
        setStaffAdminStudents(studentsList);
        return studentsList;
      }
    } catch (err) { console.error(err); }
  };

  const handleStaffAdminUploadDocs = (studentId) => {
    if (staffAdminUploadFiles.length === 0) return;
    try {
      const fd = new FormData();
      staffAdminUploadFiles.forEach(f => fd.append('files', f));
      fd.append('note', staffAdminUploadNote);

      setStaffAdminUploadProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/staff-admin/students/${studentId}/documents`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setStaffAdminUploadProgress(percent);
        }
      });

      xhr.onload = () => {
        setStaffAdminUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          setStaffAdminUploadFiles([]);
          setStaffAdminUploadNote('');
          fetchStaffAdminData().then((updatedList) => {
            if (updatedList) {
              const updatedStudent = updatedList.find(s => s.id === studentId);
              if (updatedStudent) {
                setStaffAdminSelectedStudent(updatedStudent);
              }
            }
          });
          alert('Documents uploaded successfully!');
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            alert(err.error || 'Failed');
          } catch {
            alert('Failed');
          }
        }
      };

      xhr.onerror = () => {
        setStaffAdminUploadProgress(null);
        alert('Connection error');
      };

      xhr.send(fd);
    } catch (err) {
      setStaffAdminUploadProgress(null);
      alert('Connection error');
    }
  };

  const handleStaffAdminForceAvailable = async (studentId, docId) => {
    try {
      const res = await fetch(`/api/staff-admin/students/${studentId}/documents/${docId}/force-available`, { method: 'POST' });
      if (res.ok) {
        fetchStaffAdminData().then((updatedList) => {
          if (updatedList) {
            const updatedStudent = updatedList.find(s => s.id === studentId);
            if (updatedStudent) {
              setStaffAdminSelectedStudent(updatedStudent);
            }
          }
        });
      }
    } catch (err) { alert('Error'); }
  };

  const handleStaffAdminDeleteDoc = async (studentId, docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`/api/staff-admin/students/${studentId}/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStaffAdminData().then((updatedList) => {
          if (updatedList) {
            const updatedStudent = updatedList.find(s => s.id === studentId);
            if (updatedStudent) {
              setStaffAdminSelectedStudent(updatedStudent);
            }
          }
        });
      }
    } catch (err) { alert('Error'); }
  };

  const handleStaffAdminDismissUpdates = async (studentId) => {
    try {
      const res = await fetch(`/api/staff-admin/students/${studentId}/dismiss-updates`, { method: 'POST' });
      if (res.ok) {
        fetchStaffAdminData().then((updatedList) => {
          if (updatedList) {
            const updatedStudent = updatedList.find(s => s.id === studentId);
            if (updatedStudent) {
              setStaffAdminSelectedStudent(updatedStudent);
            }
          }
        });
      } else { alert('Error updating record'); }
    } catch (err) { alert('Connection error'); }
  };

  const handleStaffAdminDeleteStaff = (staffId) => {
    showConfirm('Are you sure you want to delete this staff member?', async () => {
      try {
        const res = await fetch(`/api/staff-admin/staff/${staffId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchStaffAdminData();
          showAlert('Staff member deleted successfully');
        } else {
          let errMsg = 'Failed to delete staff member';
          try {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } catch {}
          showAlert(errMsg);
        }
      } catch (err) { showAlert('Connection error'); }
    });
  };

  const [staffListShowPassMap, setStaffListShowPassMap] = useState({});
  const [staffListEditingPass, setStaffListEditingPass] = useState(null);
  const [staffListNewPass, setStaffListNewPass] = useState('');

  const handleStaffAdminChangePassword = async (staffId) => {
    if (!staffListNewPass || staffListNewPass.length < 4) {
      showAlert('Password must be at least 4 characters');
      return;
    }
    try {
      const res = await fetch(`/api/staff-admin/staff/${staffId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: staffListNewPass })
      });
      if (res.ok) {
        showAlert('Password updated successfully');
        setStaffListEditingPass(null);
        setStaffListNewPass('');
        fetchStaffAdminData();
      } else {
        const err = await res.json();
        showAlert(err.error || 'Failed to change password');
      }
    } catch (err) { showAlert('Connection error'); }
  };

  const handleStaffAdminDeletePaymentScreenshot = (studentId) => {
    showConfirm('Are you sure you want to delete this payment screenshot? This action cannot be undone.', async () => {
      try {
        const res = await fetch(`/api/staff-admin/students/${studentId}/payment-screenshot`, { method: 'DELETE' });
        if (res.ok) {
          fetchStaffAdminData().then((updatedList) => {
            if (updatedList && staffAdminSelectedStudent && staffAdminSelectedStudent.id === studentId) {
              const updatedStudent = updatedList.find(s => s.id === studentId);
              if (updatedStudent) {
                setStaffAdminSelectedStudent(updatedStudent);
              }
            }
          });
          showAlert('Payment screenshot deleted successfully');
        } else {
          let errMsg = 'Failed to delete payment screenshot';
          try {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } catch {}
          showAlert(errMsg);
        }
      } catch (err) { showAlert('Connection error'); }
    });
  };

  // Staff detail + chat handlers
  const fetchStaffDetail = async (staffId) => {
    try {
      const res = await fetch(`/api/staff-admin/staff/${staffId}/details`);
      if (res.ok) setStaffDetailData(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchChatMessages = async (otherId) => {
    try {
      const adminId = 'staffadmin_1';
      const res = await fetch(`/api/chat/messages?user1=${adminId}&user2=${otherId}`);
      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) { console.error(err); }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !staffAdminSelectedStaffId) return;
    const text = chatInput.trim();
    setChatInput('');
    setShowEmojiPicker(false);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'staffadmin_1', to: staffAdminSelectedStaffId, text })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) { showAlert('Connection error'); }
  };

  const handleStaffDetailChatOpen = (staffId) => {
    setStaffAdminSelectedStaffId(staffId);
    setStaffAdminView('staff-detail');
  };

  // Staff Portal Chat functions
  const fetchStaffChatMessages = async () => {
    if (!staffData) return;
    try {
      const adminId = 'staffadmin_1';
      const res = await fetch(`/api/chat/messages?user1=${staffData.id}&user2=${adminId}`);
      if (res.ok) {
        const msgs = await res.json();
        setStaffChatMessages(msgs);
        setTimeout(() => staffChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) { console.error(err); }
  };

  const sendStaffChatMessage = async () => {
    if (!staffChatInput.trim() || !staffData) return;
    const text = staffChatInput.trim();
    setStaffChatInput('');
    setStaffChatShowEmoji(false);
    try {
      const adminId = 'staffadmin_1';
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: staffData.id, to: adminId, text })
      });
      if (res.ok) {
        const msg = await res.json();
        setStaffChatMessages(prev => [...prev, msg]);
        setTimeout(() => staffChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) { showAlert('Connection error'); }
  };

  // Staff chat polling
  useEffect(() => {
    if (staffAuthenticated && staffView === 'chat') {
      fetchStaffChatMessages();
      const poll = setInterval(fetchStaffChatMessages, 5000);
      return () => clearInterval(poll);
    }
  }, [staffAuthenticated, staffView]);

  const handleAdminWalletTopup = (centerId) => {
    const center = adminCenters.find(c => c.id === centerId);
    setWalletTopupModal({ open: true, centerId, centerName: center ? center.centerName : '', amount: '', description: '' });
  };

  const handleWalletTopupSubmit = async () => {
    const { centerId, amount, description } = walletTopupModal;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) { alert('Please enter a valid amount'); return; }
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(amount), description: description || 'Admin wallet top-up' }) });
      if (res.ok) {
        setWalletTopupModal({ open: false, centerId: '', centerName: '', amount: '', description: '' });
        fetchAdminCenters();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) { alert('Error adding balance'); }
  };

  const handleAdminResetWallet = async (centerId) => {
    if (!confirm('Reset this center wallet balance to ₹0? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/reset-wallet`, { method: 'POST' });
      if (res.ok) {
        fetchAdminCenters();
        alert('Wallet balance reset to ₹0');
      } else { alert('Failed to reset wallet'); }
    } catch (err) { alert('Error resetting wallet'); }
  };

  const handleAdminClearPayments = async (centerId) => {
    if (!confirm('Delete ALL payment history and wallet transactions for this center? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/clear-payments`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminCenters();
        setAdminCenterPaymentsView(null);
        setAdminCenterPayments([]);
        alert('Payment history cleared');
      } else { alert('Failed to clear payments'); }
    } catch (err) { alert('Error clearing payments'); }
  };

  const handleAdminDeleteCenterStudent = async (studentId) => {
    if (!confirm('Delete this center student record? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/center-students/${studentId}`, { method: 'DELETE' });
      if (res.ok && adminSelectedCenter) fetchAdminCenterStudents(adminSelectedCenter);
    } catch (err) { console.error(err); }
  };

  const fetchAdminCenterStudents = async (centerId) => {
    setAdminSelectedCenter(centerId);
    try {
      const res = await fetch(`/api/admin/center-students/${centerId}`);
      if (res.ok) setAdminCenterStudents(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAdminProcessStudent = async (studentId) => {
    if (!confirm('Process this student into the main system? Roll/Enrollment numbers will be generated.')) return;
    try {
      const res = await fetch(`/api/admin/process-center-student/${studentId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      alert(`Student processed! Roll No: ${data.student.rollNo}, Enrollment No: ${data.student.enrollmentNo}`);
      if (adminSelectedCenter) fetchAdminCenterStudents(adminSelectedCenter);
      fetchData();
    } catch (err) { alert('Error processing student'); }
  };

  const handleAdminProcessToForm = (cs) => {
    setEditingStudentId(null);
    setIsCompleteEdit(false);
    setFormData({
      name: cs.name, fatherName: cs.fatherName, motherName: cs.motherName,
      dob: cs.dob, courseName: cs.course, session: cs.session,
      photo: cs.photo || '', email: cs.email || '',
      centerStudentId: cs.id
    });
    setSelectedTerm('');
    setFormMarksheets({});
    setAdminTab('add-student');
  };

  return (
    <div className="app-root-container">
      
      {/* ----------------- Top Navigation Bar (Screen Only) ----------------- */}
      <header className="admin-header no-print">
        <div className="logo-section">
          <img src="/Monogram.png" alt="GVU Logo" className="logo-monogram-top" />
          <div>
            <h1 className="header-univ-title">GURUKUL VIDHYAPEETH UNIVERSITY</h1>
            <p className="header-univ-sub">NAMCHI, SIKKIM &bull; ADMINISTRATIVE SYSTEMS</p>
          </div>
        </div>

        <nav className="header-nav">
          <a 
            href="/"
            className="nav-mode-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <ArrowLeft size={18} /> Back to Website
          </a>
          <button 
            className={`nav-mode-btn ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => { setCurrentView('admin'); if (isAdminAuthenticated) fetchData(); }}
          >
            <Sliders size={18} /> Desktop App
          </button>
          <button 
            className={`nav-mode-btn ${currentView === 'center' ? 'active' : ''}`}
            onClick={() => { setCurrentView('center'); if (centerAuthenticated) fetchCenterData(); }}
          >
            <Building2 size={18} /> Center Portal
          </button>
          <button 
            className={`nav-mode-btn ${currentView === 'staff' ? 'active' : ''}`}
            onClick={() => { setCurrentView('staff'); if (staffAuthenticated) { setStaffView('dashboard'); fetchStaffData(); } else { setStaffView('login'); } }}
          >
            <User size={18} /> Staff Portal
          </button>
          <button 
            className={`nav-mode-btn ${currentView === 'staff-admin' ? 'active' : ''}`}
            onClick={() => { setCurrentView('staff-admin'); if (staffAdminAuthenticated) { setStaffAdminView('dashboard'); fetchStaffAdminData(); } else { setStaffAdminView('login'); } }}
          >
            <Lock size={18} /> Staff Admin
          </button>
          <button 
            className={`nav-mode-btn ${currentView === 'portal' ? 'active' : ''}`}
            onClick={() => { setCurrentView('portal'); setPortalStudent(null); setPortalError(''); }}
          >
            <Globe size={18} /> Web Portal
          </button>
        </nav>
      </header>

      {/* Main Content Layout */}
      <main className="main-layout-container">
        
        {/* -------------------------------------------------------------
           1. ADMIN DASHBOARD VIEW (Desktop App look)
           ------------------------------------------------------------- */}
        {currentView === 'admin' && (
          !isAdminAuthenticated ? (
            <div className="admin-login-wrapper no-print animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 'calc(100vh - 120px)',
              padding: '20px'
            }}>
              <div className="glass-panel animate-fade-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '35px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: 'var(--shadow-glow)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="/brand-logo-transparent.png" alt="GVU Logo" style={{ height: '60px', margin: '0 auto 15px auto', display: 'block', objectFit: 'contain' }} />
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Admin Console</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Gurukul Vidyapeeth University Registry</p>
                </div>
                
                <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>USERNAME</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input portal-input" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      placeholder="Enter admin username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={adminShowPass ? 'text' : 'password'} 
                        required 
                        className="form-input portal-input" 
                        style={{ width: '100%', padding: '10px 14px', paddingRight: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                        placeholder="Enter password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setAdminShowPass(!adminShowPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {adminShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {authError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                      <AlertCircle size={16} />
                      <span>{authError}</span>
                    </div>
                  )}
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                    Access Console
                  </button>
                  <a href="/" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'underline', marginTop: '15px' }}>
                    Go back to home page
                  </a>
                </form>
              </div>
            </div>
          ) : (
            <div className="admin-view-wrapper no-print animate-fade-in">
              {/* Sidebar for Desktop Dashboard */}
              <aside className="dashboard-sidebar">
                <div className="sidebar-heading">NAVIGATOR</div>
                <button 
                  className={`sidebar-link ${adminTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setAdminTab('dashboard')}
                >
                  <Eye size={18} /> Dashboard List
                </button>
                <button 
                  className={`sidebar-link ${adminTab === 'add-student' ? 'active' : ''}`}
                  onClick={startRegisterStudent}
                >
                  <UserPlus size={18} /> Add Student
                </button>
                <button 
                  className={`sidebar-link ${adminTab === 'courses' ? 'active' : ''}`}
                  onClick={() => setAdminTab('courses')}
                >
                  <BookOpen size={18} /> Course Manager
                </button>
                <button 
                  className={`sidebar-link ${adminTab === 'admin-centers' ? 'active' : ''}`}
                  onClick={() => { setAdminTab('admin-centers'); fetchAdminCenters(); }}
                >
                  <Building2 size={18} /> Center Admissions
                </button>

                {googleDriveConnected ? (
                  <button className="sidebar-link" onClick={handleGoogleDriveDisconnect} style={{ color: 'var(--secondary)', marginTop: '12px' }}>
                    <CheckCircle size={18} /> Google Drive Connected
                  </button>
                ) : (
                  <button className="sidebar-link" onClick={handleGoogleDriveConnect} style={{ color: 'var(--warning)', marginTop: '12px' }}>
                    <UploadCloud size={18} /> Connect Google Drive
                  </button>
                )}
                
                <button 
                  className="sidebar-link"
                  onClick={handleAdminLogout}
                  style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <X size={18} /> Sign Out
                </button>
                
                <div className="sidebar-footer-info">
                  <RefreshCw size={14} className="spin-icon" onClick={fetchData} style={{ cursor: 'pointer' }} />
                  <span>DB status: Connected</span>
                </div>
              </aside>

            {/* Admin Content Panel */}
            <section className="admin-content-panel">
              {errorMsg && (
                <div className="error-banner">
                  <AlertCircle size={20} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* A. DASHBOARD STUDENT LIST */}
              {adminTab === 'dashboard' && (
                <div className="tab-content-wrapper">
                  <div className="page-header-row">
                    <h2>Student Records Dashboard</h2>
                    <button className="btn btn-primary" onClick={startRegisterStudent}>
                      <UserPlus size={16} /> Register Student
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="glass-panel search-filter-bar" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                      <input 
                        type="text" 
                        placeholder="Search by Course..." 
                        className="form-input" 
                        style={{ paddingLeft: '40px' }}
                        value={searchCourse}
                        onChange={(e) => setSearchCourse(e.target.value)}
                      />
                    </div>
                    <div style={{ width: '250px' }}>
                      <input 
                        type="text" 
                        placeholder="Filter by Session..." 
                        className="form-input"
                        value={searchSession}
                        onChange={(e) => setSearchSession(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Student Grid */}
                  {loading ? (
                    <div className="loading-state">Loading students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="empty-state glass-panel">
                      <User size={48} style={{ color: 'var(--text-muted)' }} />
                      <p>No student records found matching the criteria.</p>
                    </div>
                  ) : (
                    <div className="student-grid">
                      {filteredStudents.map(student => (
                        <div key={student.id} className="student-card glass-panel glass-panel-interactive">
                          <div className="student-card-header">
                            <div className="photo-container">
                              {student.photo ? (
                                <img src={student.photo} alt={student.name} />
                              ) : (
                                <User size={32} style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <div className="student-header-text">
                              <h3>{student.name}</h3>
                              <p className="student-session-badge">{student.session}</p>
                            </div>
                          </div>

                          <div className="student-card-details">
                            <div className="detail-row">
                              <span className="lbl">Roll No:</span>
                              <span className="val">{student.rollNo}</span>
                            </div>
                            <div className="detail-row">
                              <span className="lbl">Enroll No:</span>
                              <span className="val">{student.enrollmentNo}</span>
                            </div>
                            <div className="detail-row">
                              <span className="lbl">Course:</span>
                              <span className="val text-truncate">{student.course}</span>
                            </div>
                            <div className="detail-row" style={{ marginTop: '8px' }}>
                              <span className="lbl">Status:</span>
                              <span className={`status-badge ${student.isPublished ? 'published' : 'draft'}`}>
                                {student.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>

                          <div className="student-card-actions">
                            <button 
                              className="btn btn-outline btn-sm" 
                              onClick={() => openDocsModal(student)}
                              title="View and Print Documents"
                            >
                              <Printer size={14} /> View
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => startEditStudent(student, false)}
                              title="Partial Edit: Student Details & Marks"
                            >
                              <Edit3 size={14} /> Partial
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => startEditStudent(student, true)}
                              title="Complete Edit: Change Course / Session Structure"
                            >
                              <Sliders size={14} /> Complete
                            </button>
                            
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => startPublishDocs(student)}
                              title="Configure publishing settings for Student Web Portal"
                            >
                              <CheckCircle size={14} /> Publish
                            </button>
                            {student.isPublished && (
                              <span className="published-check" title="Documents are Live on Web Portal">
                                <CheckCircle size={14} color="var(--secondary)" /> Live
                              </span>
                            )}
                            
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Delete Record"
                              style={{ marginLeft: 'auto', padding: '8px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* B. ADD / EDIT STUDENT FORM */}
              {adminTab === 'add-student' && (
                <div className="tab-content-wrapper glass-panel" style={{ padding: '30px' }}>
                  <div className="form-header">
                    <h2>{editingStudentId ? (isCompleteEdit ? 'Complete Structure Edit' : 'Partial Student Edit') : 'Register New Student'}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {editingStudentId ? `Modifying profile for Roll No: ${students.find(s => s.id === editingStudentId)?.rollNo}` : 'Sequential Roll/Enrollment numbering will auto-apply.'}
                    </p>
                  </div>

                  <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-row-grid">
                      <div>
                        <label className="form-label">Student Name</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Father's Name</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input"
                          value={formData.fatherName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Mother's Name</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input"
                          value={formData.motherName}
                          onChange={(e) => setFormData(prev => ({ ...prev, motherName: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>

                    <div className="form-row-grid">
                      <div>
                        <label className="form-label">Date of Birth (DD/MM/YYYY)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                          className="form-input"
                          value={formData.dob}
                          onChange={(e) => {
                            const val = e.target.value;
                            const clean = val.replace(/\D/g, '');
                            const digits = clean.slice(0, 8);
                            
                            let formatted = '';
                            if (digits.length <= 2) {
                              formatted = digits;
                            } else if (digits.length <= 4) {
                              formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                            } else {
                              formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                            }
                            setFormData(prev => ({ ...prev, dob: formatted }));
                          }}
                        />
                      </div>

                      <div>
                        <label className="form-label">Course</label>
                        {editingStudentId && !isCompleteEdit ? (
                          <input 
                            type="text" 
                            disabled 
                            className="form-input" 
                            style={{ opacity: 0.6 }}
                            value={formData.courseName}
                          />
                        ) : (
                          <select 
                            className="form-select"
                            value={formData.courseName}
                            onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
                          >
                            {courses.length === 0 ? (
                              <option value="">No courses parsed. Upload CSV first.</option>
                            ) : (
                              courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                            )}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Session (Final End Year)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. 2026 FINAL or 2024-2026"
                          className="form-input"
                          disabled={editingStudentId && !isCompleteEdit}
                          style={{ opacity: editingStudentId && !isCompleteEdit ? 0.6 : 1 }}
                          value={formData.session}
                          onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value.toUpperCase() }))}
                        />
                      </div>

                      <div>
                        <label className="form-label">Email ID</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="student@example.com"
                          className="form-input"
                          value={formData.email || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                        />
                      </div>
                    </div>

                    {/* Photo upload row */}
                    <div className="photo-upload-row">
                      <div className="photo-preview-box">
                        {formData.photo ? (
                          <img 
                            src={formData.photo} 
                            alt="Cropped preview" 
                            key={editingStudentId || 'new'} 
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="placeholder" style={{ display: formData.photo ? 'none' : 'flex' }}><Image size={32} /></div>
                      </div>
                      <div>
                        <label className="form-label">Upload Student Photo (Free Crop)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-input" 
                          onChange={handlePhotoSelect} 
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                          Upload an image and crop it using our built-in precision cropping tool.
                        </p>
                      </div>
                    </div>

                    {/* Subject Marks section */}
                    {formData.courseName && (
                      <div className="form-marks-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 className="form-label" style={{ fontSize: '14px', margin: 0 }}>Subject Marks Entry</h3>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="form-label" style={{ margin: 0, textTransform: 'none' }}>Select Semester/Year:</span>
                            <select 
                              className="form-select"
                              style={{ width: '180px', padding: '6px 12px' }}
                              value={selectedTerm}
                              onChange={(e) => setSelectedTerm(e.target.value)}
                            >
                              {courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase()) ? (
                                Object.keys(courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase()).terms).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))
                              ) : (
                                <option value="">Select Course</option>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Auto-generate Marks block */}
                        <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="form-label" style={{ margin: 0, textTransform: 'none' }}>Target Percentage:</span>
                            <input 
                              type="number"
                              min={35}
                              max={100}
                              placeholder="e.g. 75"
                              className="form-input"
                              style={{ width: '100px', padding: '6px 10px' }}
                              id="target-percentage-input"
                            />
                            <span>%</span>
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            style={{ margin: 0 }}
                            onClick={() => {
                              const pctInput = document.getElementById('target-percentage-input');
                              const pctVal = parseInt(pctInput ? pctInput.value : '');
                              if (isNaN(pctVal) || pctVal < 35 || pctVal > 100) {
                                alert('Please enter a target percentage between 35 and 100.');
                                return;
                              }
                              
                              const course = courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase());
                              if (!course || !selectedTerm || !course.terms[selectedTerm]) return;
                              
                              const activeSubjects = course.terms[selectedTerm];
                              const totalMaxMarks = activeSubjects.reduce((sum, s) => sum + (parseInt(s.maxMarks) || 100), 0);
                              const targetTotal = Math.round(totalMaxMarks * (pctVal / 100));
                              
                              // Determine limits: default [40, 80] (above 40, less than 80)
                              let lowBound = 40;
                              let highBound = 80;
                              
                              // If target percentage is outside [40, 80], dynamically shift boundaries
                              if (pctVal < 40) {
                                lowBound = Math.max(0, pctVal - 10);
                                highBound = Math.min(100, pctVal + 15);
                              } else if (pctVal > 80) {
                                lowBound = Math.max(0, pctVal - 15);
                                highBound = Math.min(100, pctVal + 10);
                              }
                              
                              // Baseline random assignment within bounds scaled to subject maxMarks
                              const generated = {};
                              let currentSum = 0;
                              
                              activeSubjects.forEach(sub => {
                                const maxM = parseInt(sub.maxMarks) || 100;
                                const factor = maxM / 100;
                                
                                const subLow = Math.round(lowBound * factor);
                                const subHigh = Math.round(highBound * factor);
                                
                                const randomVal = Math.floor(Math.random() * (subHigh - subLow + 1)) + subLow;
                                generated[sub.code] = randomVal;
                                currentSum += randomVal;
                              });
                              
                              // Randomly adjust the difference to sum up to exactly targetTotal
                              let diff = targetTotal - currentSum;
                              let attempts = 0;
                              const maxAttempts = 1000;
                              
                              while (diff !== 0 && attempts < maxAttempts) {
                                attempts++;
                                // Shuffle indices to distribute increments/decrements naturally
                                const indices = Array.from({ length: activeSubjects.length }, (_, i) => i);
                                indices.sort(() => Math.random() - 0.5);
                                
                                for (let idx of indices) {
                                  if (diff === 0) break;
                                  
                                  const sub = activeSubjects[idx];
                                  const maxM = parseInt(sub.maxMarks) || 100;
                                  const factor = maxM / 100;
                                  const subLow = Math.round(lowBound * factor);
                                  const subHigh = Math.round(highBound * factor);
                                  
                                  let currentVal = generated[sub.code];
                                  if (diff > 0 && currentVal < subHigh) {
                                    generated[sub.code] += 1;
                                    diff -= 1;
                                  } else if (diff < 0 && currentVal > subLow) {
                                    generated[sub.code] -= 1;
                                    diff += 1;
                                  }
                                }
                              }
                              
                              setFormMarksheets(prev => ({
                                ...prev,
                                [selectedTerm]: generated
                              }));
                            }}
                          >
                            Generate Marks
                          </button>
                        </div>

                        {/* Subject Input Fields */}
                        <div className="marks-input-container">
                          {courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase())?.terms[selectedTerm] ? (
                            <table className="marks-input-table">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th style={{ textAlign: 'left' }}>Subject</th>
                                  <th>Min Marks</th>
                                  <th>Max Marks</th>
                                  <th style={{ width: '150px' }}>Obtained Marks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courses.find(c => c.name.toLowerCase() === formData.courseName.toLowerCase()).terms[selectedTerm].map(sub => (
                                  <tr key={sub.code}>
                                    <td style={{ textAlign: 'center' }}>{sub.code}</td>
                                    <td>{sub.name}</td>
                                    <td style={{ textAlign: 'center' }}>{sub.minMarks}</td>
                                    <td style={{ textAlign: 'center' }}>{sub.maxMarks}</td>
                                    <td>
                                      <input 
                                        type="number"
                                        min={0}
                                        max={sub.maxMarks}
                                        placeholder={`Max ${sub.maxMarks}`}
                                        className="form-input text-center"
                                        style={{ padding: '6px' }}
                                        value={formMarksheets[selectedTerm]?.[sub.code] !== undefined ? formMarksheets[selectedTerm][sub.code] : ''}
                                        onChange={(e) => handleMarkChange(sub.code, e.target.value, sub.maxMarks)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="loading-state">No subjects configured for selected term. Check CSV upload.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setAdminTab('dashboard')}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingStudentId ? 'Update Record' : 'Save & Register Student'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* C. MANAGE COURSES (CSV UPLOADS) */}
              {adminTab === 'courses' && (
                <div className="tab-content-wrapper animate-fade-in">
                  <h2>Course CSV Manager</h2>
                  
                  <div className="csv-uploader-row">
                    {/* Upload card */}
                    <div className="glass-panel csv-upload-card">
                      <h3 className="form-label" style={{ marginBottom: '12px' }}>Upload Course Mapping</h3>
                      <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="upload-dropzone">
                          <UploadCloud size={40} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                          <span>Select Course CSV File</span>
                          <input 
                            type="file" 
                            accept=".csv" 
                            required 
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setCsvFile(e.target.files[0]);
                                setCsvMessage('');
                              }
                            }} 
                          />
                        </div>
                        {csvFile && <div className="file-info">Selected file: <strong>{csvFile.name}</strong></div>}
                        
                        <button type="submit" className="btn btn-primary">
                          <UploadCloud size={16} /> Process CSV Mapping
                        </button>
                        
                        {csvMessage && (
                          <div className={`message-banner ${csvMessage.includes('success') ? 'success' : 'info'}`}>
                            {csvMessage}
                          </div>
                        )}
                      </form>
                    </div>

                    {/* Configured Courses List */}
                    <div className="glass-panel courses-list-card">
                      <h3 className="form-label" style={{ marginBottom: '12px' }}>Configured Courses ({courses.length})</h3>
                      <div className="courses-list-scrollbar">
                        {courses.length === 0 ? (
                          <div className="empty-state" style={{ padding: '20px' }}>No courses uploaded yet. Use the uploader to import CSVs.</div>
                        ) : (
                          courses.map(c => (
                            <div key={c.name} className="course-item-row">
                              <div>
                                <strong>{c.name}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Type: <span style={{ textTransform: 'capitalize' }}>{c.type}</span>
                                </div>
                              </div>
                              <div className="terms-badges-row">
                                {Object.keys(c.terms).map(term => (
                                  <span key={term} className="term-badge">
                                    {term}: {c.terms[term].length} Subjects
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* D. ADMIN CENTER MANAGEMENT */}
              {adminTab === 'admin-centers' && (
                <div className="tab-content-wrapper animate-fade-in">
                  <div className="page-header-row">
                    <h2>Center Management</h2>
                  </div>

                  {/* Create/Edit Center Form */}
                  <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>{adminEditingCenter ? 'Edit Center' : 'Create New Center'}</h3>
                    <form onSubmit={handleAdminCenterSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-row-grid">
                        <div>
                          <label className="form-label">Center Name *</label>
                          <input type="text" required className="form-input" value={adminCenterForm.centerName} onChange={(e) => setAdminCenterForm(p => ({ ...p, centerName: e.target.value.toUpperCase() }))} placeholder="e.g. ABC EDUCATION CENTER" />
                        </div>
                        <div>
                          <label className="form-label">Username *</label>
                          <input type="text" required className="form-input" value={adminCenterForm.username} onChange={(e) => setAdminCenterForm(p => ({ ...p, username: e.target.value }))} placeholder="center_login_username" />
                        </div>
                        <div>
                          <label className="form-label">Password *</label>
                          <input type="password" required className="form-input" value={adminCenterForm.password} onChange={(e) => setAdminCenterForm(p => ({ ...p, password: e.target.value }))} placeholder={adminEditingCenter ? 'Leave blank to keep current' : 'Set password'} />
                        </div>
                      </div>
                      <div className="form-row-grid">
                        <div>
                          <label className="form-label">Contact Person</label>
                          <input type="text" className="form-input" value={adminCenterForm.contactPerson} onChange={(e) => setAdminCenterForm(p => ({ ...p, contactPerson: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Email</label>
                          <input type="email" className="form-input" value={adminCenterForm.email} onChange={(e) => setAdminCenterForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Phone</label>
                          <input type="text" className="form-input" value={adminCenterForm.phone} onChange={(e) => setAdminCenterForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Address</label>
                        <input type="text" className="form-input" value={adminCenterForm.address} onChange={(e) => setAdminCenterForm(p => ({ ...p, address: e.target.value.toUpperCase() }))} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary">{adminEditingCenter ? 'Update Center' : 'Create Center'}</button>
                        {adminEditingCenter && (
                          <button type="button" className="btn btn-outline" onClick={() => { setAdminEditingCenter(null); setAdminCenterForm({ centerName: '', username: '', password: '', contactPerson: '', email: '', phone: '', address: '' }); }}>Cancel Edit</button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Centers List */}
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>All Centers ({adminCenters.length})</h3>
                  {adminCenters.length === 0 ? (
                    <div className="empty-state glass-panel">
                      <Building2 size={48} style={{ color: 'var(--text-muted)' }} />
                      <p>No centers created yet.</p>
                    </div>
                  ) : adminCenters.map(c => (
                    <div key={c.id} className="center-manage-card">
                      <div className="center-manage-info">
                        <h3>{c.centerName}</h3>
                        <p>Username: {c.username} | Contact: {c.contactPerson || '—'} | Phone: {c.phone || '—'}</p>
                        <p>Email: {c.email || '—'} | Wallet: ₹{(c.walletBalance || 0).toLocaleString('en-IN')} | Status: <span style={{ color: c.isActive ? 'var(--secondary)' : 'var(--danger)' }}>{c.isActive ? 'Active' : 'Inactive'}</span></p>
                      </div>
                      <div className="center-manage-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAdminWalletTopup(c.id)}>
                          <Wallet size={14} /> Add Wallet
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => fetchAdminCenterPayments(c.id)}>
                          <Wallet size={14} /> View Payments
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleAdminResetWallet(c.id)}>
                          <Wallet size={14} /> Reset Wallet
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAdminClearPayments(c.id)}>
                          <Trash2 size={14} /> Clear Payments
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => fetchAdminCenterStudents(c.id)}>
                          <Eye size={14} /> View Students
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setAdminEditingCenter(c); setAdminCenterForm({ centerName: c.centerName, username: c.username, password: '', contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '', address: c.address || '' }); }}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAdminDeleteCenter(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Center Students View */}
                  {adminSelectedCenter && (
                    <div style={{ marginTop: '24px' }}>
                      <div className="page-header-row">
                        <h3>Students of {adminCenters.find(c => c.id === adminSelectedCenter)?.centerName || ''}</h3>
                        <button className="btn btn-outline btn-sm" onClick={() => { setAdminSelectedCenter(null); setAdminCenterStudents([]); }}>Close</button>
                      </div>
                      {adminCenterStudents.length === 0 ? (
                        <div className="empty-state glass-panel"><p>No students registered by this center.</p></div>
                      ) : (
                        <div className="center-student-table-wrapper">
                          <table className="center-student-table">
                            <thead>
                              <tr>
                                <th>S.No</th><th>Name</th><th>Father Name</th><th>Course</th><th>Session</th><th>Status</th><th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminCenterStudents.map((s, idx) => (
                                <tr key={s.id}>
                                  <td>{idx + 1}</td>
                                  <td style={{ fontWeight: '600' }}>{s.name}</td>
                                  <td>{s.fatherName}</td>
                                  <td style={{ fontSize: '12px' }}>{s.course}</td>
                                  <td>{s.session}</td>
                                  <td><span className={`center-status-badge ${s.status}`}>{s.status}</span></td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      {!s.processed && (
                                        <button className="center-action-btn" onClick={() => handleAdminProcessStudent(s.id)}>
                                          <CheckCircle size={12} /> Process
                                        </button>
                                      )}
                                      <button className="center-action-btn" onClick={() => handleAdminProcessToForm(s)}>
                                        <Edit3 size={12} /> Edit in Form
                                      </button>
                                      <button className="center-action-btn" onClick={() => handleAdminDeleteCenterStudent(s.id)} style={{ color: 'var(--danger)' }}>
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Center Payment History View */}
                  {adminCenterPaymentsView && (
                    <div style={{ marginTop: '24px' }}>
                      <div className="page-header-row">
                        <h3>Payment History — {adminCenters.find(c => c.id === adminCenterPaymentsView)?.centerName || ''}</h3>
                        <button className="btn btn-outline btn-sm" onClick={() => { setAdminCenterPaymentsView(null); setAdminCenterPayments([]); }}>Close</button>
                      </div>
                      {adminCenterPayments.length === 0 ? (
                        <div className="empty-state glass-panel"><p>No payments made by this center yet.</p></div>
                      ) : (
                        <>
                          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Payments</div>
                              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--secondary)' }}>₹{adminCenterPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Transactions</div>
                              <div style={{ fontSize: '22px', fontWeight: '800' }}>{adminCenterPayments.length}</div>
                            </div>
                          </div>
                          <div className="center-student-table-wrapper">
                            <table className="center-student-table">
                              <thead>
                                <tr>
                                  <th>Date</th><th>Student</th><th>Amount</th><th>Description</th><th>Screenshot</th><th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminCenterPayments.map(p => (
                                  <tr key={p.id}>
                                    <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td style={{ fontWeight: '600' }}>{p.studentName || '—'}</td>
                                    <td style={{ fontWeight: '700', color: 'var(--secondary)' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                                    <td>{p.description || '—'}</td>
                                    <td>
                                      {p.screenshot ? (
                                        <a href={p.screenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '12px' }}>
                                          <img src={p.screenshot} alt="Screenshot" style={{ maxHeight: '40px', borderRadius: '4px', objectFit: 'contain', verticalAlign: 'middle', marginRight: '6px' }} />
                                          View
                                        </a>
                                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                                    </td>
                                    <td><span className={`payment-status ${p.status}`}>{p.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* STAFF ADMIN VIEW DOCUMENTS */}
            {staffAdminAuthenticated && staffAdminView === 'view-documents' && staffAdminSelectedStudent && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Documents — {staffAdminSelectedStudent.name}</h2>
                  <button className="btn btn-outline" onClick={() => { setStaffAdminSelectedStudent(null); setStaffAdminView('students'); }}><ArrowLeft size={16} /> Back</button>
                </div>

                {/* Full Student Details */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {staffAdminSelectedStudent.photo && (
                      <div style={{ flexShrink: 0 }}>
                        <img 
                          src={staffAdminSelectedStudent.photo} 
                          alt={staffAdminSelectedStudent.name} 
                          onClick={() => showAlert(
                            <div style={{ textAlign: 'center' }}>
                              <img src={staffAdminSelectedStudent.photo} alt={staffAdminSelectedStudent.name} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                            </div>,
                            `Photo - ${staffAdminSelectedStudent.name}`
                          )}
                          style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--primary)', cursor: 'zoom-in' }} 
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>{staffAdminSelectedStudent.name}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 20px', fontSize: '13px' }}>
                        <p><strong>Staff:</strong> {staffAdminSelectedStudent.staffName}</p>
                        <p><strong>Father's Name:</strong> {staffAdminSelectedStudent.fatherName || '—'}</p>
                        <p><strong>Mother's Name:</strong> {staffAdminSelectedStudent.motherName || '—'}</p>
                        <p><strong>DOB:</strong> {staffAdminSelectedStudent.dob || '—'}</p>
                        <p><strong>Email:</strong> {staffAdminSelectedStudent.email || '—'}</p>
                        <p><strong>Contact:</strong> {staffAdminSelectedStudent.contactNumber || '—'}</p>
                        <p><strong>Address:</strong> {staffAdminSelectedStudent.address || '—'}</p>
                        <p><strong>Course:</strong> {staffAdminSelectedStudent.course}</p>
                        <p><strong>Session:</strong> {staffAdminSelectedStudent.session || '—'}</p>
                        <p><strong>University/Board:</strong> {staffAdminSelectedStudent.universityBoard || '—'}</p>
                        <p><strong>Admission Date:</strong> {staffAdminSelectedStudent.admissionDate || '—'}</p>
                        <p><strong>Status:</strong> <span className={`center-status-badge ${staffAdminSelectedStudent.status}`}>{staffAdminSelectedStudent.status}</span></p>
                      </div>
                      {staffAdminSelectedStudent.paymentDescription && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fb923c', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', marginBottom: '4px' }}>Payment Description:</p>
                          <p style={{ fontSize: '13px', color: '#9a3412', margin: 0 }}>{staffAdminSelectedStudent.paymentDescription}</p>
                        </div>
                      )}
                      {staffAdminSelectedStudent.staffNote && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #3b82f6', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>Staff Note / Required Documents:</p>
                          <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>{staffAdminSelectedStudent.staffNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff Submitted Documents */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Documents Submitted by Staff</h3>
                  {(!staffAdminSelectedStudent.documents || staffAdminSelectedStudent.documents.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)' }}>No documents submitted by staff.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {staffAdminSelectedStudent.documents.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href={doc.path} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-outline btn-sm" 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={14} /> {doc.originalname || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Screenshot */}
                {staffAdminSelectedStudent.paymentScreenshot && (
                  <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Payment Screenshot</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <img 
                        src={staffAdminSelectedStudent.paymentScreenshot} 
                        alt="Payment Screenshot" 
                        onClick={() => showAlert(
                          <div style={{ textAlign: 'center' }}>
                            <img src={staffAdminSelectedStudent.paymentScreenshot} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                          </div>,
                          `Payment Screenshot - ${staffAdminSelectedStudent.name}`
                        )}
                        style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'zoom-in' }} 
                      />
                      <a href={staffAdminSelectedStudent.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                )}

                {/* Admin Uploaded Documents */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Documents Uploaded by Admin</h3>
                  {(!staffAdminSelectedStudent.adminDocuments || staffAdminSelectedStudent.adminDocuments.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)' }}>No documents uploaded by admin yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {staffAdminSelectedStudent.adminDocuments.map(doc => (
                        <div key={doc.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Round {doc.correctionRound}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                            {doc.note && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>({doc.note})</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {doc.files.map((f, i) => (
                              <a key={i} href={f.path} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><Download size={14} /> {f.originalname}</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </section>
          </div>
          )
        )}

        {/* -------------------------------------------------------------
           3. STAFF PORTAL
           ------------------------------------------------------------- */}
        {currentView === 'staff' && (
          !staffAuthenticated ? (
            /* STAFF LOGIN */
            staffView === 'login' ? (
              <div className="admin-login-wrapper no-print" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 'calc(100vh - 120px)', padding: '20px'
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '100%', maxWidth: '420px', padding: '35px', display: 'flex',
                  flexDirection: 'column', gap: '24px', boxShadow: 'var(--shadow-glow)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <img src="/brand-logo-transparent.png" alt="GVU Logo" style={{ height: '60px', margin: '0 auto 15px auto', display: 'block', objectFit: 'contain' }} />
                    <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Staff Login</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Access your staff dashboard</p>
                  </div>
                  {staffLoginError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                      <AlertCircle size={16} /><span>{staffLoginError}</span>
                    </div>
                  )}
                  <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>MOBILE NUMBER</label>
                      <input type="tel" required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter mobile number" value={staffLoginMobile} onChange={e => setStaffLoginMobile(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>PASSWORD</label>
                      <div style={{ position: 'relative' }}>
                        <input type={staffLoginShowPass ? 'text' : 'password'} required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', paddingRight: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter password" value={staffLoginPass} onChange={e => setStaffLoginPass(e.target.value)} />
                        <button type="button" onClick={() => setStaffLoginShowPass(!staffLoginShowPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {staffLoginShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                      <Lock size={16} /> Staff Login
                    </button>
                  </form>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Don't have an account? <button className="link-btn" style={{ color: 'var(--primary)', fontWeight: '600', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setStaffView('register'); setStaffLoginError(''); }}>Create Account</button>
                  </p>
                </div>
              </div>
            ) : (
              /* STAFF REGISTER */
              staffView === 'register' && (
                <div className="admin-login-wrapper no-print" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 'calc(100vh - 120px)', padding: '20px'
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '100%', maxWidth: '420px', padding: '35px', display: 'flex',
                  flexDirection: 'column', gap: '24px', boxShadow: 'var(--shadow-glow)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <img src="/brand-logo-transparent.png" alt="GVU Logo" style={{ height: '60px', margin: '0 auto 15px auto', display: 'block', objectFit: 'contain' }} />
                    <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Create Staff Account</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Register to get started</p>
                  </div>
                  {staffLoginError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                      <AlertCircle size={16} /><span>{staffLoginError}</span>
                    </div>
                  )}
                  <form onSubmit={handleStaffRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>FULL NAME</label>
                      <input type="text" required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter your full name" value={staffRegName} onChange={e => setStaffRegName(e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>MOBILE NUMBER</label>
                      <input type="tel" required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter mobile number" value={staffRegMobile} onChange={e => setStaffRegMobile(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>PASSWORD</label>
                      <div style={{ position: 'relative' }}>
                        <input type={staffRegShowPass ? 'text' : 'password'} required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', paddingRight: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Set password" value={staffRegPass} onChange={e => setStaffRegPass(e.target.value)} />
                        <button type="button" onClick={() => setStaffRegShowPass(!staffRegShowPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {staffRegShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                      <UserPlus size={16} /> Create Account
                    </button>
                  </form>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Already have an account? <button className="link-btn" style={{ color: 'var(--primary)', fontWeight: '600', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setStaffView('login'); setStaffLoginError(''); }}>Login</button>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="center-dashboard-wrapper no-print animate-fade-in">
              <aside className="center-sidebar">
                <div className="sidebar-heading">STAFF NAVIGATOR</div>
                <button className={`sidebar-link ${staffView === 'dashboard' ? 'active' : ''}`} onClick={() => { setStaffView('dashboard'); fetchStaffData(); fetchStaffNotifications(); }}>
                  <Eye size={18} /> Dashboard
                </button>
                <button className={`sidebar-link ${staffView === 'add-student' ? 'active' : ''}`} onClick={() => { setStaffExistingStudent(null); setStaffStudentForm({ name: '', fatherName: '', motherName: '', dob: '', email: '', address: '', admissionDate: '', contactNumber: '', course: '', session: '', paymentDescription: '', staffNote: '', universityBoard: '' }); setStaffStudentPhoto(''); setStaffDocuments([]); setStaffPaymentScreenshot(''); setStaffView('add-student'); }}>
                  <UserPlus size={18} /> Add Student
                </button>
                <button className={`sidebar-link ${staffView === 'chat' ? 'active' : ''}`} onClick={() => { setStaffView('chat'); fetchStaffChatMessages(); }}>
                  <MessageSquare size={18} /> Chat with Admin
                </button>
                <div style={{ position: 'relative', marginTop: '12px' }}>
                  <button className="sidebar-link" data-notif-toggle onClick={() => setStaffNotifOpen(!staffNotifOpen)} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Bell size={18} /> Notifications</span>
                    {staffNotifications.filter(n => !n.read).length > 0 && (
                      <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', padding: '0 5px' }}>
                        {staffNotifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                  {staffNotifOpen && (
                    <div className="staff-notif-dropdown">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>Notifications</span>
                        {staffNotifications.some(n => !n.read) && (
                          <button className="link-btn" style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleStaffMarkAllRead}>Mark all read</button>
                        )}
                      </div>
                      {staffNotifications.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No notifications yet</p>
                      ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {staffNotifications.slice(0, 20).map(n => (
                            <div key={n.id} className={`staff-notif-item ${n.read ? '' : 'unread'}`} onClick={() => { if (!n.read) handleStaffMarkNotifRead(n.id); }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: '600', fontSize: '12px', margin: 0 }}>{n.title}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>{n.message}</p>
                                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button className="link-btn" onClick={(e) => { e.stopPropagation(); handleStaffDeleteNotif(n.id); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}><X size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button className="sidebar-link" onClick={() => { setStaffAuthenticated(false); setStaffData(null); sessionStorage.removeItem('staffAuthenticated'); sessionStorage.removeItem('staffData'); setStaffView('login'); }} style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <X size={18} /> Sign Out
                </button>
                <div className="sidebar-footer-info">
                  <span>{staffData?.name}</span>
                </div>
              </aside>

              <section className="admin-content-panel">

            {/* STAFF DASHBOARD */}
            {staffAuthenticated && staffView === 'dashboard' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Staff Dashboard</h2>
                  <button className="btn btn-primary" onClick={() => { setStaffExistingStudent(null); setStaffStudentForm({ name: '', fatherName: '', motherName: '', dob: '', email: '', address: '', admissionDate: '', contactNumber: '', course: '', session: '', paymentDescription: '', staffNote: '', universityBoard: '' }); setStaffStudentPhoto(''); setStaffDocuments([]); setStaffPaymentScreenshot(''); setStaffView('add-student'); }}>
                    <UserPlus size={16} /> Add Student
                  </button>
                </div>
                <div className="glass-panel stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px' }}>
                  <div className="stat-item"><div className="stat-value">{staffStats.total}</div><div className="stat-label">Total Students</div></div>
                  <div className="stat-item"><div className="stat-value" style={{ color: 'var(--secondary)' }}>{staffStats.active}</div><div className="stat-label">Active</div></div>
                  <div className="stat-item"><div className="stat-value" style={{ color: 'var(--warning)' }}>{staffStats.pending}</div><div className="stat-label">Pending</div></div>
                </div>
                <div className="glass-panel search-filter-bar" style={{ padding: '16px', marginBottom: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                    <input type="text" placeholder="Search students..." className="form-input" style={{ paddingLeft: '40px' }} value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
                  </div>
                </div>
                <div className="center-student-table-wrapper">
                  <table className="center-student-table">
                    <thead><tr><th>S.No</th><th>Name</th><th>Father Name</th><th>Course</th><th>Session</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {staffStudents.filter(s => !staffSearch || s.name.toLowerCase().includes(staffSearch.toLowerCase()) || s.fatherName.toLowerCase().includes(staffSearch.toLowerCase())).map((s, idx) => (
                        <tr key={s.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{s.name}</td>
                          <td>{s.fatherName}</td>
                          <td style={{ fontSize: '12px' }}>{s.course}</td>
                          <td>{s.session}</td>
                          <td><span className={`center-status-badge ${s.status}`}>{s.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button className="center-action-btn" onClick={() => handleStaffViewDocs(s)}><Eye size={12} /> Docs</button>
                              <button className="center-action-btn" onClick={() => startStaffEditStudent(s)}><Edit3 size={12} /> Update</button>
                              <button className="center-action-btn" onClick={() => handleStaffDeleteStudent(s.id)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STAFF ADD STUDENT */}
            {staffAuthenticated && staffView === 'add-student' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Add New Student</h2>
                  <button className="btn btn-outline" onClick={() => setStaffView('dashboard')}><ArrowLeft size={16} /> Back</button>
                </div>
                <form onSubmit={handleStaffAddStudent} className="glass-panel" style={{ padding: '24px' }}>
                  <div className="form-row-grid">
                    <div><label className="form-label">Student Name *</label><input type="text" className="form-input" required value={staffStudentForm.name} onChange={e => setStaffStudentForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Father Name *</label><input type="text" className="form-input" required value={staffStudentForm.fatherName} onChange={e => setStaffStudentForm(p => ({ ...p, fatherName: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Mother Name</label><input type="text" className="form-input" value={staffStudentForm.motherName} onChange={e => setStaffStudentForm(p => ({ ...p, motherName: e.target.value.toUpperCase() }))} /></div>
                  </div>
                  <div className="form-row-grid">
                    <div><label className="form-label">Date of Birth *</label><input type="date" className="form-input" required value={staffStudentForm.dob} onChange={e => setStaffStudentForm(p => ({ ...p, dob: e.target.value }))} /></div>
                    <div><label className="form-label">Email</label><input type="email" className="form-input" value={staffStudentForm.email} onChange={e => setStaffStudentForm(p => ({ ...p, email: e.target.value }))} /></div>
                    <div><label className="form-label">Contact Number</label><input type="text" className="form-input" value={staffStudentForm.contactNumber} onChange={e => setStaffStudentForm(p => ({ ...p, contactNumber: e.target.value }))} /></div>
                  </div>
                  <div className="form-row-grid">
                    <div><label className="form-label">Course *</label><input type="text" className="form-input" required value={staffStudentForm.course} onChange={e => setStaffStudentForm(p => ({ ...p, course: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Session *</label><input type="text" className="form-input" required value={staffStudentForm.session} onChange={e => setStaffStudentForm(p => ({ ...p, session: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Admission Date</label><input type="date" className="form-input" value={staffStudentForm.admissionDate} onChange={e => setStaffStudentForm(p => ({ ...p, admissionDate: e.target.value }))} /></div>
                  </div>
                  <div><label className="form-label">Address</label><input type="text" className="form-input" value={staffStudentForm.address} onChange={e => setStaffStudentForm(p => ({ ...p, address: e.target.value.toUpperCase() }))} /></div>
                  <div style={{ marginTop: '12px' }}><label className="form-label">University / Board Name</label><input type="text" className="form-input" placeholder="e.g. UNIVERSITY OF DELHI, CBSE, ISC" value={staffStudentForm.universityBoard} onChange={e => setStaffStudentForm(p => ({ ...p, universityBoard: e.target.value.toUpperCase() }))} /></div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Student Photo</label>
                    <div className="doc-upload-zone">
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload photo</span>
                      <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) { const reader = new FileReader(); reader.onload = ev => setStaffStudentPhoto(ev.target.result); reader.readAsDataURL(e.target.files[0]); } }} />
                    </div>
                    {staffStudentPhoto && <img src={staffStudentPhoto} alt="Preview" style={{ maxHeight: '80px', marginTop: '8px', borderRadius: '8px' }} />}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Payment Description</label>
                    <input type="text" className="form-input" placeholder="e.g. 1st Semester Fee" value={staffStudentForm.paymentDescription} onChange={e => setStaffStudentForm(p => ({ ...p, paymentDescription: e.target.value }))} />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Payment Screenshot</label>
                    <div className="doc-upload-zone">
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload payment screenshot</span>
                      <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) { const reader = new FileReader(); reader.onload = ev => { setStaffPaymentScreenshot(ev.target.result); }; reader.readAsDataURL(e.target.files[0]); } }} />
                    </div>
                    {staffPaymentScreenshot && <img src={staffPaymentScreenshot} alt="Screenshot" style={{ maxHeight: '80px', marginTop: '8px', borderRadius: '8px' }} />}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Note / Required Documents</label>
                    <textarea className="form-input" rows={3} placeholder="e.g. Please also upload 10th marksheet, Aadhaar card, and migration certificate" value={staffStudentForm.staffNote} onChange={e => setStaffStudentForm(p => ({ ...p, staffNote: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Documents</label>
                    <div className="doc-upload-zone">
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload documents</span>
                      <input type="file" multiple onChange={e => setStaffDocuments(Array.from(e.target.files))} />
                    </div>
                    {staffDocuments.length > 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{staffDocuments.length} file(s) selected</p>}
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary">Submit Student</button>
                    <button type="button" className="btn btn-outline" onClick={() => setStaffView('dashboard')}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* STAFF EDIT STUDENT */}
            {staffAuthenticated && staffView === 'edit-student' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Request Correction — {staffExistingStudent?.name}</h2>
                  <button className="btn btn-outline" onClick={() => { setStaffExistingStudent(null); setStaffView('dashboard'); }}><ArrowLeft size={16} /> Back</button>
                </div>
                <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%)', border: '1px solid #ff9800' }}>
                  <p style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>Correction #{(staffExistingStudent?.correctionCount || 0) + 1} — After admin re-uploads, document will be available after {(staffExistingStudent?.correctionCount || 0) + 1} day(s).</p>
                </div>
                <form onSubmit={handleStaffEditStudent} className="glass-panel" style={{ padding: '24px' }}>
                  <div className="form-row-grid">
                    <div><label className="form-label">Student Name *</label><input type="text" className="form-input" required value={staffStudentForm.name} onChange={e => setStaffStudentForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Father Name *</label><input type="text" className="form-input" required value={staffStudentForm.fatherName} onChange={e => setStaffStudentForm(p => ({ ...p, fatherName: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Mother Name</label><input type="text" className="form-input" value={staffStudentForm.motherName} onChange={e => setStaffStudentForm(p => ({ ...p, motherName: e.target.value.toUpperCase() }))} /></div>
                  </div>
                  <div className="form-row-grid">
                    <div><label className="form-label">Date of Birth *</label><input type="date" className="form-input" required value={staffStudentForm.dob} onChange={e => setStaffStudentForm(p => ({ ...p, dob: e.target.value }))} /></div>
                    <div><label className="form-label">Course *</label><input type="text" className="form-input" required value={staffStudentForm.course} onChange={e => setStaffStudentForm(p => ({ ...p, course: e.target.value.toUpperCase() }))} /></div>
                    <div><label className="form-label">Session *</label><input type="text" className="form-input" required value={staffStudentForm.session} onChange={e => setStaffStudentForm(p => ({ ...p, session: e.target.value.toUpperCase() }))} /></div>
                  </div>
                  <div style={{ marginTop: '12px' }}><label className="form-label">University / Board Name</label><input type="text" className="form-input" placeholder="e.g. UNIVERSITY OF DELHI, CBSE, ISC" value={staffStudentForm.universityBoard} onChange={e => setStaffStudentForm(p => ({ ...p, universityBoard: e.target.value.toUpperCase() }))} /></div>
                  <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <label className="form-label">Student Photo</label>
                    <div className="doc-upload-zone">
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload photo</span>
                      <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) { const reader = new FileReader(); reader.onload = ev => setStaffStudentPhoto(ev.target.result); reader.readAsDataURL(e.target.files[0]); } }} />
                    </div>
                    {staffStudentPhoto && <img src={staffStudentPhoto} alt="Preview" style={{ maxHeight: '80px', marginTop: '8px', borderRadius: '8px' }} />}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Note / Required Documents</label>
                    <textarea className="form-input" rows={3} placeholder="e.g. Please update the address, also need 12th marksheet" value={staffStudentForm.staffNote} onChange={e => setStaffStudentForm(p => ({ ...p, staffNote: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Upload New Documents (if any)</label>
                    <div className="doc-upload-zone">
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload new documents</span>
                      <input type="file" multiple onChange={e => setStaffDocuments(Array.from(e.target.files))} />
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary">Submit Correction Request</button>
                    <button type="button" className="btn btn-outline" onClick={() => { setStaffExistingStudent(null); setStaffView('dashboard'); }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* STAFF VIEW DOCUMENTS */}
            {staffAuthenticated && staffView === 'view-documents' && staffSelectedStudentDocs && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Documents — {staffSelectedStudentDocs.student.name}</h2>
                  <button className="btn btn-outline" onClick={() => { setStaffSelectedStudentDocs(null); setStaffView('dashboard'); }}><ArrowLeft size={16} /> Back</button>
                </div>

                {/* Submitted Documents section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Submitted Student Documents</h3>
                  {(!staffSelectedStudentDocs.student.documents || staffSelectedStudentDocs.student.documents.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents uploaded during registration.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {staffSelectedStudentDocs.student.documents.map((f, i) => (
                        <a key={i} href={f.path} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          <Download size={14} /> {f.originalname}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Corrected Documents section */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Admin Corrected Documents</h3>
                  {staffSelectedStudentDocs.documents.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents uploaded by admin yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {staffSelectedStudentDocs.documents.map(doc => (
                        <div key={doc.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontWeight: '700', fontSize: '14px' }}>Correction Round {doc.correctionRound}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            {doc.isAvailable ? (
                              <span className="payment-status completed">Available</span>
                            ) : (
                              <span className="payment-status pending">Available after {new Date(doc.availableAt).toLocaleDateString('en-IN')}</span>
                            )}
                          </div>
                          {doc.note && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Note: {doc.note}</p>}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {doc.files.map((f, i) => (
                              doc.isAvailable ? (
                                <a key={i} href={f.path} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><Download size={14} /> {f.originalname}</a>
                              ) : (
                                <span key={i} className="btn btn-outline btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }}><Lock size={14} /> {f.originalname}</span>
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* STAFF CHAT WITH ADMIN */}
            {staffAuthenticated && staffView === 'chat' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2><MessageSquare size={20} /> Chat with Admin</h2>
                </div>
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
                    <div>
                      <p style={{ fontWeight: '700', margin: 0, fontSize: '15px' }}>Chat with Staff Admin</p>
                      <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Ask questions, share updates, get support</p>
                    </div>
                  </div>
                  <div style={{ height: '450px', overflowY: 'auto', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {staffChatMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 20px' }}>
                        <p style={{ fontSize: '40px', margin: '0 0 8px' }}>💬</p>
                        <p style={{ fontSize: '14px', fontWeight: '600' }}>No messages yet</p>
                        <p style={{ fontSize: '12px' }}>Send a message to the staff admin</p>
                      </div>
                    )}
                    {staffChatMessages.map((msg, i) => (
                      <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.from === staffData?.id ? 'flex-end' : 'flex-start', animation: 'chatBubbleIn 0.3s ease' }}>
                        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: msg.from === staffData?.id ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.from === staffData?.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white', color: msg.from === staffData?.id ? 'white' : 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '13px', wordBreak: 'break-word' }}>
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={staffChatEndRef} />
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
                    {staffChatShowEmoji && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px', padding: '8px', background: '#f1f5f9', borderRadius: '8px', animation: 'fadeIn 0.2s ease' }}>
                        {['😀','😂','😍','🥰','😎','🤩','👍','👎','❤️','🔥','💯','✅','🎉','🙏','👋','🤔','😢','😡','🤝','💪','👏','📦','📄','❌','⏰','💰','📋','🎯','⭐','🚀','💬','📩','📞','🏫','👨‍🎓','👩‍🎓'].map(e => (
                          <button key={e} onClick={() => setStaffChatInput(prev => prev + e)} style={{ fontSize: '20px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', transition: 'transform 0.15s' }} onMouseEnter={ev => ev.target.style.transform = 'scale(1.3)'} onMouseLeave={ev => ev.target.style.transform = 'scale(1)'}>{e}</button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => setStaffChatShowEmoji(!staffChatShowEmoji)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s' }} onMouseEnter={ev => ev.target.style.transform = 'scale(1.2)'} onMouseLeave={ev => ev.target.style.transform = 'scale(1)'}>😊</button>
                      <input type="text" value={staffChatInput} onChange={e => setStaffChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendStaffChatMessage()} placeholder="Type a message..." className="form-input" style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }} />
                      <button onClick={sendStaffChatMessage} disabled={!staffChatInput.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: staffChatInput.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0', color: 'white', cursor: staffChatInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', transform: staffChatInput.trim() ? 'scale(1)' : 'scale(0.9)' }}>
                        <UploadCloud size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </section>
          </div>
          )
        )}

        {/* -------------------------------------------------------------
           4. STAFF ADMIN PORTAL
           ------------------------------------------------------------- */}
        {currentView === 'staff-admin' && (
          !staffAdminAuthenticated ? (
            /* STAFF ADMIN LOGIN */
            staffAdminView === 'login' && (
              <div className="admin-login-wrapper no-print" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 'calc(100vh - 120px)', padding: '20px'
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '100%', maxWidth: '420px', padding: '35px', display: 'flex',
                  flexDirection: 'column', gap: '24px', boxShadow: 'var(--shadow-glow)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <img src="/brand-logo-transparent.png" alt="GVU Logo" style={{ height: '60px', margin: '0 auto 15px auto', display: 'block', objectFit: 'contain' }} />
                    <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Staff Admin Login</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Manage staff and documents</p>
                  </div>
                  {staffAdminLoginError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                      <AlertCircle size={16} /><span>{staffAdminLoginError}</span>
                    </div>
                  )}
                  <form onSubmit={handleStaffAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>USERNAME</label>
                      <input type="text" required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter username" value={staffAdminUsername} onChange={e => setStaffAdminUsername(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>PASSWORD</label>
                      <div style={{ position: 'relative' }}>
                        <input type={staffAdminShowPass ? 'text' : 'password'} required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', paddingRight: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter password" value={staffAdminPass} onChange={e => setStaffAdminPass(e.target.value)} />
                        <button type="button" onClick={() => setStaffAdminShowPass(!staffAdminShowPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {staffAdminShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                      <Lock size={16} /> Staff Admin Login
                    </button>
                  </form>
                </div>
              </div>
            )
          ) : (
            <div className="center-dashboard-wrapper no-print animate-fade-in">
              <aside className="center-sidebar">
                <div className="sidebar-heading">STAFF ADMIN</div>
                <button className={`sidebar-link ${staffAdminView === 'dashboard' ? 'active' : ''}`} onClick={() => setStaffAdminView('dashboard')}>
                  <Eye size={18} /> Dashboard
                </button>
                <button className={`sidebar-link ${staffAdminView === 'students' ? 'active' : ''}`} onClick={() => { setStaffAdminView('students'); fetchStaffAdminData(); }}>
                  <UserPlus size={18} /> All Students
                </button>
                <button className={`sidebar-link ${staffAdminView === 'staff-list' ? 'active' : ''}`} onClick={() => setStaffAdminView('staff-list')}>
                  <Building2 size={18} /> Staff List
                </button>
                <button className={`sidebar-link ${staffAdminView === 'payments' ? 'active' : ''}`} onClick={() => { setStaffAdminView('payments'); fetchStaffAdminData(); }}>
                  <CreditCard size={18} /> Payments
                </button>
                <button className="sidebar-link" onClick={() => { setStaffAdminAuthenticated(false); setStaffAdminData(null); sessionStorage.removeItem('staffAdminAuthenticated'); sessionStorage.removeItem('staffAdminData'); setStaffAdminView('login'); }} style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <X size={18} /> Sign Out
                </button>
                <div className="sidebar-footer-info">
                  <span>{staffAdminData?.name}</span>
                </div>
              </aside>

              <section className="admin-content-panel">

            {/* STAFF ADMIN DASHBOARD */}
            {staffAdminAuthenticated && staffAdminView === 'dashboard' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Staff Admin Dashboard</h2>
                </div>
                <div className="glass-panel stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px' }}>
                  <div className="stat-item"><div className="stat-value">{staffAdminStats.totalStaff}</div><div className="stat-label">Total Staff</div></div>
                  <div className="stat-item"><div className="stat-value">{staffAdminStats.totalStudents}</div><div className="stat-label">Total Students</div></div>
                  <div className="stat-item"><div className="stat-value" style={{ color: 'var(--warning)' }}>{staffAdminStats.pending}</div><div className="stat-label">Pending</div></div>
                  <div className="stat-item"><div className="stat-value" style={{ color: 'var(--secondary)' }}>{staffAdminStats.active}</div><div className="stat-label">Active</div></div>
                </div>

                {/* Correction Notifications */}
                {staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').length > 0 && (
                  <div className="correction-warning" style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Correction Requests ({staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').length})</p>
                    {staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '13px' }}>{s.name}</span>
                          <span style={{ fontSize: '12px', color: '#bf360c', marginLeft: '8px' }}>by {s.staffName}</span>
                          {s.correctionNote && <span style={{ fontSize: '12px', color: '#e65100', marginLeft: '8px' }}>({s.correctionNote})</span>}
                        </div>
                        <button className="center-action-btn" onClick={() => { setStaffAdminSelectedStudent(s); setStaffAdminView('manage-student'); setStaffAdminUploadFiles([]); setStaffAdminUploadNote(''); }} style={{ color: '#e65100', borderColor: '#e65100' }}>
                          <UploadCloud size={12} /> Review & Upload
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button className="btn btn-primary" onClick={() => { setStaffAdminView('students'); fetchStaffAdminData(); }}><Eye size={16} /> View All Students</button>
                  <button className="btn btn-outline" onClick={() => { setStaffAdminView('staff-list'); }}><User size={16} /> View Staff</button>
                </div>
              </div>
            )}

            {/* STAFF ADMIN STAFF LIST */}
            {staffAdminAuthenticated && staffAdminView === 'staff-list' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>All Staff ({staffAdminStaffList.length})</h2>
                  <button className="btn btn-outline" onClick={() => setStaffAdminView('dashboard')}><ArrowLeft size={16} /> Back</button>
                </div>
                <div className="center-student-table-wrapper">
                  <table className="center-student-table">
                    <thead><tr><th>S.No</th><th>Name</th><th>Mobile</th><th>Password</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {staffAdminStaffList.map((s, idx) => (
                        <tr key={s.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: '600', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setStaffAdminView('staff-detail'); setStaffAdminSelectedStaffId(s.id); }} title="Click to view details">{s.name}</td>
                          <td>{s.mobile}</td>
                          <td>
                            {staffListEditingPass === s.id ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                  <input type={staffListShowPassMap[`edit_${s.id}`] ? 'text' : 'password'} value={staffListNewPass} onChange={e => setStaffListNewPass(e.target.value)} className="form-input" style={{ padding: '4px 28px 4px 8px', fontSize: '12px', width: '140px' }} placeholder="New password" />
                                  <button type="button" onClick={() => setStaffListShowPassMap(p => ({ ...p, [`edit_${s.id}`]: !p[`edit_${s.id}`] }))} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {staffListShowPassMap[`edit_${s.id}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                                <button className="center-action-btn" onClick={() => handleStaffAdminChangePassword(s.id)} style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)', fontSize: '11px' }}>Save</button>
                                <button className="center-action-btn" onClick={() => { setStaffListEditingPass(null); setStaffListNewPass(''); }} style={{ fontSize: '11px' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{staffListShowPassMap[s.id] ? (s.plainPassword || 'N/A') : '••••••••'}</span>
                                <button type="button" onClick={() => setStaffListShowPassMap(p => ({ ...p, [s.id]: !p[s.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                                  {staffListShowPassMap[s.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            )}
                          </td>
                          <td><span className={`center-status-badge ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {staffListEditingPass !== s.id && (
                                <button className="center-action-btn" onClick={() => { setStaffListEditingPass(s.id); setStaffListNewPass(''); }} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                                  <Key size={12} /> Change Pass
                                </button>
                              )}
                              <button className="center-action-btn" onClick={() => handleStaffAdminDeleteStaff(s.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STAFF ADMIN ALL STUDENTS */}
            {staffAdminAuthenticated && staffAdminView === 'students' && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>All Staff Students</h2>
                  <button className="btn btn-outline" onClick={() => setStaffAdminView('dashboard')}><ArrowLeft size={16} /> Back</button>
                </div>

                {/* Correction Notifications */}
                {staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').length > 0 && (
                  <div className="correction-warning" style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Correction Requests ({staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').length})</p>
                    {staffAdminStudents.filter(s => s.correctionCount > 0 && s.status === 'pending').map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <div>
                          <span style={{ fontWeight: '600' }}>{s.name}</span>
                          <span style={{ fontSize: '12px', color: '#bf360c', marginLeft: '8px' }}>— {s.staffName}</span>
                          {s.correctionNote && <span style={{ fontSize: '12px', color: '#e65100', marginLeft: '8px' }}>({s.correctionNote})</span>}
                        </div>
                        <button className="center-action-btn" onClick={() => { setStaffAdminSelectedStudent(s); setStaffAdminView('manage-student'); setStaffAdminUploadFiles([]); setStaffAdminUploadNote(''); }} style={{ color: '#e65100', borderColor: '#e65100' }}>
                          <UploadCloud size={12} /> Review & Upload
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="glass-panel search-filter-bar" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                    <input type="text" placeholder="Search students..." className="form-input" style={{ paddingLeft: '40px' }} value={staffAdminSearch} onChange={e => setStaffAdminSearch(e.target.value)} />
                  </div>
                  <select className="form-input" style={{ width: '200px' }} value={staffAdminFilterStaff} onChange={e => setStaffAdminFilterStaff(e.target.value)}>
                    <option value="">All Staff</option>
                    {staffAdminStaffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="center-student-table-wrapper">
                  <table className="center-student-table">
                    <thead><tr><th>S.No</th><th>Staff</th><th>Student</th><th>Father</th><th>Mother</th><th>Course</th><th>Session</th><th>Address</th><th>University</th><th>Note</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {staffAdminStudents.filter(s => {
                        if (staffAdminFilterStaff && s.staffId !== staffAdminFilterStaff) return false;
                        if (staffAdminSearch) { const q = staffAdminSearch.toLowerCase(); return s.name.toLowerCase().includes(q) || s.fatherName.toLowerCase().includes(q); }
                        return true;
                      }).map((s, idx) => (
                        <tr key={s.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontSize: '12px' }}>{s.staffName}</td>
                          <td style={{ fontWeight: '600' }}>
                            {s.name}
                            {s.hasNewUpdates && (
                              <span className="payment-status pending" style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Updates Pending</span>
                            )}
                          </td>
                          <td>{s.fatherName}</td>
                          <td>{s.motherName || '—'}</td>
                          <td style={{ fontSize: '12px' }}>{s.course}</td>
                          <td>{s.session || '—'}</td>
                          <td style={{ fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address}>{s.address || '—'}</td>
                          <td style={{ fontSize: '11px', fontWeight: '500' }}>{s.universityBoard || '—'}</td>
                          <td style={{ maxWidth: '180px' }}>
                            {s.staffNote ? (
                              <span 
                                onClick={() => showAlert(s.staffNote, 'Staff Note / Required Documents')} 
                                style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline' }} 
                                title="Click to read full note"
                              >
                                {s.staffNote}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>}
                          </td>
                          <td><span className={`center-status-badge ${s.status}`}>{s.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button className="center-action-btn" onClick={() => { setStaffAdminSelectedStudent(s); setStaffAdminView('manage-student'); setStaffAdminUploadFiles([]); setStaffAdminUploadNote(''); }}><Eye size={12} /> View All</button>
                              <button className="center-action-btn" onClick={() => { setStaffAdminSelectedStudent(s); setStaffAdminView('manage-student'); setStaffAdminUploadFiles([]); setStaffAdminUploadNote(''); }}><UploadCloud size={12} /> Upload Docs</button>
                              {s.correctionCount > 0 && <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '600', alignSelf: 'center' }}>Correction #{s.correctionCount}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* STAFF ADMIN PAYMENTS VIEW */}
            {staffAdminAuthenticated && staffAdminView === 'payments' && (() => {
              const uniqueUniversities = Array.from(
                new Set(
                  staffAdminStudents
                    .map(s => s.universityBoard)
                    .filter(u => u && u.trim() !== '')
                )
              ).sort();

              const filteredPayments = staffAdminStudents
                .filter(s => s.paymentScreenshot)
                .filter(student => {
                  if (staffAdminPaymentSearch) {
                    const q = staffAdminPaymentSearch.toLowerCase();
                    if (!student.name.toLowerCase().includes(q)) return false;
                  }
                  if (staffAdminPaymentFilterUniv) {
                    if (student.universityBoard !== staffAdminPaymentFilterUniv) return false;
                  }
                  return true;
                });

              return (
                <div className="tab-content-wrapper animate-fade-in">
                  <div className="page-header-row">
                    <h2>Student Fee Payments</h2>
                    <button className="btn btn-outline" onClick={() => setStaffAdminView('dashboard')}><ArrowLeft size={16} /> Back</button>
                  </div>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Log of all payment screenshots uploaded by staff members during student registration.</p>
                    
                    {/* Search & Filter Controls */}
                    <div className="glass-panel search-filter-bar" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                        <input 
                          type="text" 
                          placeholder="Search student name..." 
                          className="form-input" 
                          style={{ paddingLeft: '40px' }} 
                          value={staffAdminPaymentSearch} 
                          onChange={e => setStaffAdminPaymentSearch(e.target.value)} 
                        />
                      </div>
                      <select 
                        className="form-input" 
                        style={{ width: '240px' }} 
                        value={staffAdminPaymentFilterUniv} 
                        onChange={e => setStaffAdminPaymentFilterUniv(e.target.value)}
                      >
                        <option value="">All Universities / Boards</option>
                        {uniqueUniversities.map(univ => (
                          <option key={univ} value={univ}>{univ}</option>
                        ))}
                      </select>
                    </div>

                    {filteredPayments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <CreditCard size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>No matching payment screenshots found.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {filteredPayments.map(student => (
                          <div key={student.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{student.name}</h4>
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Staff: {student.staffName}</span>
                              </div>
                              <span className={`center-status-badge ${student.status}`} style={{ fontSize: '10px' }}>{student.status}</span>
                            </div>
                            
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                              <div><strong>Course:</strong> {student.course}</div>
                              {student.universityBoard && <div><strong>University:</strong> {student.universityBoard}</div>}
                              {student.paymentDescription && <div style={{ marginTop: '4px' }}><strong>Description:</strong> {student.paymentDescription}</div>}
                            </div>
                            
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', minHeight: '160px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                              <img 
                                src={student.paymentScreenshot} 
                                alt="Payment Screenshot" 
                                onClick={() => showAlert(
                                  <div style={{ textAlign: 'center' }}>
                                    <img src={student.paymentScreenshot} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                                    {student.paymentDescription && <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-main)' }}>{student.paymentDescription}</p>}
                                  </div>,
                                  `Payment Screenshot - ${student.name}`
                                )}
                                style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', cursor: 'zoom-in', transition: 'transform 0.2s' }} 
                                title="Click to expand"
                              />
                              <button 
                                onClick={() => handleStaffAdminDeletePaymentScreenshot(student.id)} 
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                  transition: 'background 0.2s'
                                }}
                                title="Delete Payment Screenshot"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* STAFF ADMIN MANAGE STUDENT (Upload Docs) */}
            {staffAdminAuthenticated && staffAdminView === 'manage-student' && staffAdminSelectedStudent && (
              <div className="tab-content-wrapper">
                <div className="page-header-row">
                  <h2>Manage — {staffAdminSelectedStudent.name}</h2>
                  <button className="btn btn-outline" onClick={() => { setStaffAdminSelectedStudent(null); setStaffAdminView('students'); }}><ArrowLeft size={16} /> Back</button>
                </div>

                {/* Student Full Details */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {staffAdminSelectedStudent.photo && (
                      <div style={{ flexShrink: 0, textAlign: 'center' }}>
                        <img 
                          src={staffAdminSelectedStudent.photo} 
                          alt={staffAdminSelectedStudent.name} 
                          onClick={() => showAlert(
                            <div style={{ textAlign: 'center' }}>
                              <img src={staffAdminSelectedStudent.photo} alt={staffAdminSelectedStudent.name} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                            </div>,
                            `Photo - ${staffAdminSelectedStudent.name}`
                          )}
                          style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--primary)', cursor: 'zoom-in' }} 
                        />
                        <a href={staffAdminSelectedStudent.photo} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: '6px', fontSize: '11px' }}><Download size={12} /> Photo</a>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{staffAdminSelectedStudent.name}</h3>
                        <span className={`center-status-badge ${staffAdminSelectedStudent.status}`}>{staffAdminSelectedStudent.status}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px 20px', fontSize: '13px' }}>
                        <p><strong>Staff:</strong> {staffAdminSelectedStudent.staffName}</p>
                        <p><strong>Father's Name:</strong> {staffAdminSelectedStudent.fatherName || '—'}</p>
                        <p><strong>Mother's Name:</strong> {staffAdminSelectedStudent.motherName || '—'}</p>
                        <p><strong>DOB:</strong> {staffAdminSelectedStudent.dob || '—'}</p>
                        <p><strong>Email:</strong> {staffAdminSelectedStudent.email || '—'}</p>
                        <p><strong>Contact:</strong> {staffAdminSelectedStudent.contactNumber || '—'}</p>
                        <p><strong>Address:</strong> {staffAdminSelectedStudent.address || '—'}</p>
                        <p><strong>Course:</strong> {staffAdminSelectedStudent.course}</p>
                        <p><strong>Session:</strong> {staffAdminSelectedStudent.session || '—'}</p>
                        <p><strong>University/Board:</strong> {staffAdminSelectedStudent.universityBoard || '—'}</p>
                        <p><strong>Admission Date:</strong> {staffAdminSelectedStudent.admissionDate || '—'}</p>
                      </div>
                      {staffAdminSelectedStudent.paymentDescription && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fb923c', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', marginBottom: '4px' }}>Payment Description:</p>
                          <p style={{ fontSize: '13px', color: '#9a3412', margin: 0 }}>{staffAdminSelectedStudent.paymentDescription}</p>
                        </div>
                      )}
                      {staffAdminSelectedStudent.staffNote && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #3b82f6', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>Staff Note / Required Documents:</p>
                          <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>{staffAdminSelectedStudent.staffNote}</p>
                        </div>
                      )}
                      {staffAdminSelectedStudent.correctionNote && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', marginBottom: '4px' }}>Correction Note:</p>
                          <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>{staffAdminSelectedStudent.correctionNote}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {staffAdminSelectedStudent.paymentScreenshot && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Payment Screenshot:</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <img 
                          src={staffAdminSelectedStudent.paymentScreenshot} 
                          alt="Payment Screenshot" 
                          onClick={() => showAlert(
                            <div style={{ textAlign: 'center' }}>
                              <img src={staffAdminSelectedStudent.paymentScreenshot} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                            </div>,
                            `Payment Screenshot - ${staffAdminSelectedStudent.name}`
                          )}
                          style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'zoom-in' }} 
                        />
                        <a href={staffAdminSelectedStudent.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Newly Updated Fields Notification */}
                  {staffAdminSelectedStudent.hasNewUpdates && staffAdminSelectedStudent.updatedFieldsLog && staffAdminSelectedStudent.updatedFieldsLog.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--warning)', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.05)' }}>
                      <p style={{ fontWeight: '700', fontSize: '13px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <AlertCircle size={16} /> Staff Recently Updated Following Fields:
                      </p>
                      <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {staffAdminSelectedStudent.updatedFieldsLog.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                      <button className="btn btn-outline btn-sm" onClick={() => handleStaffAdminDismissUpdates(staffAdminSelectedStudent.id)}>
                        Mark Updates as Reviewed
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents Submitted by Staff */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Documents Submitted by Staff</h3>
                  {(!staffAdminSelectedStudent.documents || staffAdminSelectedStudent.documents.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)' }}>No documents submitted by staff.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {staffAdminSelectedStudent.documents.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href={doc.path} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-outline btn-sm" 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={14} /> {doc.originalname || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Documents */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Upload Documents</h3>
                  <div style={{ marginBottom: '12px' }}>
                    <label className="form-label">Note (optional)</label>
                    <input type="text" className="form-input" placeholder="e.g. Updated marksheet" value={staffAdminUploadNote} onChange={e => setStaffAdminUploadNote(e.target.value)} disabled={staffAdminUploadProgress !== null} />
                  </div>
                  <div className="doc-upload-zone" style={{ marginBottom: '12px', opacity: staffAdminUploadProgress !== null ? 0.6 : 1, pointerEvents: staffAdminUploadProgress !== null ? 'none' : 'auto' }}>
                    <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                    <span>Click to upload multiple documents</span>
                    <input type="file" multiple onChange={e => setStaffAdminUploadFiles(Array.from(e.target.files))} disabled={staffAdminUploadProgress !== null} />
                  </div>
                  {staffAdminUploadFiles.length > 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{staffAdminUploadFiles.length} file(s) selected</p>}
                  
                  {staffAdminUploadProgress !== null && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                        <span style={{ color: 'var(--primary)' }}>Uploading documents...</span>
                        <span>{staffAdminUploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${staffAdminUploadProgress}%`, height: '100%', background: 'var(--secondary)', transition: 'width 0.1s ease' }}></div>
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={() => handleStaffAdminUploadDocs(staffAdminSelectedStudent.id)} disabled={staffAdminUploadFiles.length === 0 || staffAdminUploadProgress !== null}>
                    <UploadCloud size={16} /> {staffAdminUploadProgress !== null ? 'Uploading...' : `Upload ${staffAdminUploadFiles.length} File(s)`}
                  </button>
                </div>

                {/* Existing Documents */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Uploaded Documents</h3>
                  {(!staffAdminSelectedStudent.adminDocuments || staffAdminSelectedStudent.adminDocuments.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {staffAdminSelectedStudent.adminDocuments.map(doc => {
                        const now = new Date();
                        const uploadedAt = new Date(doc.uploadedAt);
                        const delayDays = doc.correctionRound || 1;
                        const availableAt = new Date(uploadedAt.getTime() + delayDays * 24 * 60 * 60 * 1000);
                        const isAvailable = doc.forceAvailable || now >= availableAt;
                        return (
                          <div key={doc.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div>
                                <span style={{ fontWeight: '600' }}>Round {doc.correctionRound}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                                {doc.note && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>({doc.note})</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {!isAvailable && (
                                  <button className="center-action-btn" onClick={() => handleStaffAdminForceAvailable(staffAdminSelectedStudent.id, doc.id)} style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                                    <Eye size={12} /> Make Available Now
                                  </button>
                                )}
                                <button className="center-action-btn" onClick={() => handleStaffAdminDeleteDoc(staffAdminSelectedStudent.id, doc.id)} style={{ color: 'var(--danger)' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {doc.files.map((f, i) => (
                                <a key={i} href={f.path} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><Download size={14} /> {f.originalname}</a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            </section>
          </div>
          )
        )}

        {/* -------------------------------------------------------------
           2. PUBLIC WEBSITE PORTAL (Student lookup and document view)
           ------------------------------------------------------------- */}
        {currentView === 'portal' && (
          <div className="portal-view-wrapper no-print animate-fade-in">
            {/* If student is not logged in / lookup not performed */}
            {!portalStudent ? (
              <div className="portal-landing-container">
                <div className="glass-panel portal-search-card">
                  <div className="portal-header-decor">
                    <img src="/brand-logo-transparent.png" alt="GVU Logo" className="portal-logo" style={{ height: '70px', width: 'auto', objectFit: 'contain', margin: '0 auto 15px auto' }} />
                    <h2>GURUKUL VIDHYAPEETH UNIVERSITY</h2>
                    <p>STUDENT ONLINE DOCUMENT VERIFICATION HUB</p>
                  </div>
                  
                  <form onSubmit={handlePortalSearch} className="portal-search-form">
                    <div>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Email ID</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Enter your registered email ID"
                        className="form-input portal-input"
                        value={portalEmail}
                        onChange={(e) => setPortalEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Roll Number or Enrollment Number</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter 6-digit Roll No. or 10-digit Enrollment No."
                        className="form-input portal-input"
                        value={portalSearchVal}
                        onChange={(e) => setPortalSearchVal(e.target.value)}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary portal-btn" style={{ marginTop: '10px' }}>
                      <Globe size={18} /> Search & Retrieve Documents
                    </button>
                  </form>

                  {portalError && (
                    <div className="portal-error-banner">
                      <AlertCircle size={18} />
                      <span>{portalError}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Student Profile and Issued Documents Portal View */
              <div className="portal-student-hub">
                {/* Hub Header */}
                <div className="glass-panel hub-header-card">
                  <button className="btn btn-outline btn-sm" onClick={() => setPortalStudent(null)}>
                    <ArrowLeft size={16} /> Back to Search
                  </button>
                  
                  <div className="hub-student-header-info">
                    <div className="photo-container-large">
                      {portalStudent.photo ? (
                        <img src={portalStudent.photo} alt={portalStudent.name} />
                      ) : (
                        <User size={48} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div>
                      <h2>Welcome, {portalStudent.name.toUpperCase()}</h2>
                      <div className="hub-metadata-grid">
                        <span><strong>Course:</strong> {portalStudent.course}</span>
                        <span><strong>Roll No:</strong> {portalStudent.rollNo}</span>
                        <span><strong>Enrollment No:</strong> {portalStudent.enrollmentNo}</span>
                        <span><strong>Session:</strong> {portalStudent.session}</span>
                        <span><strong>Email ID:</strong> {portalStudent.email || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab layout for documents */}
                <div className="portal-docs-workspace">
                  {/* Selector sidebar */}
                  <div className="portal-docs-sidebar">
                    {/* Term Selector */}
                    <div className="term-selector-block glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Academic Term</label>
                      <select 
                        className="form-select"
                        value={portalActiveTerm}
                        onChange={(e) => setPortalActiveTerm(e.target.value)}
                      >
                        {Object.keys(portalStudent.marksheets)
                          .filter(t => {
                            const docs = portalStudent.publishedDocs || {};
                            const m = docs.marksheets && docs.marksheets[t];
                            const a = docs.admitCards && docs.admitCards[t];
                            const r = docs.results && docs.results[t];
                            return m || a || r;
                          })
                          .map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="doc-tabs-menu glass-panel">
                      {portalStudent.publishedDocs?.marksheets?.[portalActiveTerm] && (
                        <button 
                          className={`doc-tab-link ${portalActiveTab === 'marksheet' ? 'active' : ''}`}
                          onClick={() => setPortalActiveTab('marksheet')}
                        >
                          <FileText size={18} /> Marksheet Statement
                        </button>
                      )}
                      {portalStudent.publishedDocs?.admitCards?.[portalActiveTerm] && (
                        <button 
                          className={`doc-tab-link ${portalActiveTab === 'admit' ? 'active' : ''}`}
                          onClick={() => setPortalActiveTab('admit')}
                        >
                          <Calendar size={18} /> Admit Card
                        </button>
                      )}
                      {portalStudent.publishedDocs?.idCard && (
                        <button 
                          className={`doc-tab-link ${portalActiveTab === 'id' ? 'active' : ''}`}
                          onClick={() => setPortalActiveTab('id')}
                        >
                          <User size={18} /> Student ID Card
                        </button>
                      )}
                      {portalStudent.publishedDocs?.results?.[portalActiveTerm] && (
                        <button 
                          className={`doc-tab-link ${portalActiveTab === 'result' ? 'active' : ''}`}
                          onClick={() => setPortalActiveTab('result')}
                        >
                          <Globe size={18} /> Online Result Page
                        </button>
                      )}
                    </div>
                    
                    <button className="btn btn-primary print-action-btn" onClick={triggerPrint}>
                      <Printer size={18} /> Print / Save as PDF
                    </button>
                  </div>

                  {/* Rendering Area */}
                  <div className="portal-doc-preview-panel glass-panel">
                    <div className="preview-scroll-wrapper">
                      {portalActiveTab === 'marksheet' && (
                        <MarksheetTemplate 
                          student={portalStudent} 
                          course={portalCourse} 
                          termName={portalActiveTerm} 
                        />
                      )}
                      {portalActiveTab === 'admit' && (
                        <AdmitCardTemplate 
                          student={portalStudent} 
                          course={portalCourse} 
                          termName={portalActiveTerm} 
                        />
                      )}
                      {portalActiveTab === 'id' && (
                        <IdCardTemplate student={portalStudent} />
                      )}
                      {portalActiveTab === 'result' && (
                        <OnlineResultTemplate 
                          student={portalStudent} 
                          course={portalCourse} 
                          termName={portalActiveTerm} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
           3. CENTER PORTAL VIEW
           ------------------------------------------------------------- */}
        {currentView === 'center' && (
          !centerAuthenticated ? (
            <div className="admin-login-wrapper no-print animate-fade-in" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', minHeight: 'calc(100vh - 120px)', padding: '20px'
            }}>
              <div className="glass-panel animate-fade-in" style={{
                width: '100%', maxWidth: '420px', padding: '35px', display: 'flex',
                flexDirection: 'column', gap: '24px', boxShadow: 'var(--shadow-glow)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="/brand-logo-transparent.png" alt="GVU Logo" style={{ height: '60px', margin: '0 auto 15px auto', display: 'block', objectFit: 'contain' }} />
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Center Portal</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Gurukul Vidyapeeth University - Center Login</p>
                </div>
                <form onSubmit={handleCenterLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>USERNAME</label>
                    <input type="text" required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter center username" value={centerLoginUser} onChange={(e) => setCenterLoginUser(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input type={centerLoginShowPass ? 'text' : 'password'} required className="form-input portal-input" style={{ width: '100%', padding: '10px 14px', paddingRight: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} placeholder="Enter password" value={centerLoginPass} onChange={(e) => setCenterLoginPass(e.target.value)} />
                      <button type="button" onClick={() => setCenterLoginShowPass(!centerLoginShowPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {centerLoginShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {centerLoginError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                      <AlertCircle size={16} /><span>{centerLoginError}</span>
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                    <Lock size={16} /> Center Login
                  </button>
                  <a href="/" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'underline', marginTop: '15px' }}>Go back to home page</a>
                </form>
              </div>
            </div>
          ) : (
            <div className="center-dashboard-wrapper no-print animate-fade-in">
              <aside className="center-sidebar">
                <div className="sidebar-heading">CENTER NAVIGATOR</div>
                <button className={`sidebar-link ${centerView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCenterView('dashboard'); fetchCenterData(); }}>
                  <Eye size={18} /> Dashboard
                </button>
                <button className={`sidebar-link ${centerView === 'add-student' ? 'active' : ''}`} onClick={() => { setCenterExistingStudent(null); resetCenterStudentForm(); setCenterView('add-student'); }}>
                  <UserPlus size={18} /> Add Student
                </button>
                <button className={`sidebar-link ${centerView === 'payment-history' ? 'active' : ''}`} onClick={() => { setCenterView('payment-history'); fetchCenterPayments(); }}>
                  <CreditCard size={18} /> Payment History
                </button>
                <button className={`sidebar-link ${centerView === 'wallet' ? 'active' : ''}`} onClick={() => { setCenterView('wallet'); fetchCenterWallet(); }}>
                  <Wallet size={18} /> Wallet
                </button>
                <button className="sidebar-link" onClick={handleCenterLogout} style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <X size={18} /> Sign Out
                </button>
                <div className="sidebar-footer-info">
                  <RefreshCw size={14} className="spin-icon" onClick={fetchCenterData} style={{ cursor: 'pointer' }} />
                  <span>{centerData ? centerData.centerName : ''}</span>
                </div>
              </aside>

              <section className="admin-content-panel">
                {/* CENTER DASHBOARD */}
                {centerView === 'dashboard' && (
                  <div className="tab-content-wrapper">
                    <div className="page-header-row">
                      <h2>Center Dashboard</h2>
                      <button className="btn btn-primary" onClick={() => { setCenterExistingStudent(null); resetCenterStudentForm(); setCenterView('add-student'); }}>
                        <UserPlus size={16} /> Add New Student
                      </button>
                    </div>

                    <div className="center-stats-bar">
                      <div className={`center-stat-card ${centerStats.total > 0 ? 'active' : ''}`}>
                        <div className="center-stat-value">{centerStats.total}</div>
                        <div className="center-stat-label">Total Students</div>
                      </div>
                      <div className="center-stat-card">
                        <div className="center-stat-value" style={{ color: 'var(--secondary)' }}>{centerStats.active}</div>
                        <div className="center-stat-label">Active Students</div>
                      </div>
                      <div className="center-stat-card">
                        <div className="center-stat-value" style={{ color: '#d97706' }}>{centerStats.pending}</div>
                        <div className="center-stat-label">Pending Students</div>
                      </div>
                    </div>

                    <div className="glass-panel search-filter-bar" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                        <input type="text" placeholder="Search by name, course, or session..." className="form-input" style={{ paddingLeft: '40px' }} value={centerSearch} onChange={(e) => setCenterSearch(e.target.value)} />
                      </div>
                    </div>

                    {centerLoading ? (
                      <div className="loading-state">Loading students...</div>
                    ) : filteredCenterStudents.length === 0 ? (
                      <div className="empty-state glass-panel">
                        <User size={48} style={{ color: 'var(--text-muted)' }} />
                        <p>No students registered yet. Click "Add New Student" to begin.</p>
                      </div>
                    ) : (
                      <div className="center-student-table-wrapper">
                        <table className="center-student-table">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Photo</th>
                              <th>Name</th>
                              <th>Father Name</th>
                              <th>Contact</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCenterStudents.map((s, idx) => (
                              <tr key={s.id}>
                                <td>{idx + 1}</td>
                                <td>
                                  {s.photo ? (
                                    <img src={s.photo} alt="" className="center-student-photo" />
                                  ) : (
                                    <div className="center-student-photo-placeholder"><User size={16} /></div>
                                  )}
                                </td>
                                <td style={{ fontWeight: '600' }}>{s.name}</td>
                                <td>{s.fatherName}</td>
                                <td>{s.contactNumber}</td>
                                <td style={{ fontSize: '12px' }}>{s.email}</td>
                                <td>
                                  <span className={`center-status-badge ${s.status}`}>{s.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <button className="center-action-btn" onClick={() => { setCenterExistingStudent(s); setCenterStudentForm({ name: s.name, fatherName: s.fatherName, motherName: s.motherName, dob: s.dob, email: s.email, address: s.address || '', admissionDate: s.admissionDate || '', contactNumber: s.contactNumber, course: s.course, session: s.session }); setCenterStudentPhoto(s.photo || ''); setCenterView('add-student'); }}>
                                      <Edit3 size={12} /> Edit
                                    </button>
                                    <button className="center-action-btn" onClick={() => handleCenterAckDownload(s)}>
                                      <FileDown size={12} /> Ack
                                    </button>
                                    <button className="center-action-btn" onClick={() => setCenterPayModal({ open: true, studentId: s.id, studentName: s.name, amount: '', description: '', screenshot: null, screenshotPreview: '' })} style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                                      <CreditCard size={12} /> Pay Fee
                                    </button>
                                    <button className="center-action-btn" onClick={() => handleCenterDeleteStudent(s.id)} style={{ color: 'var(--danger)' }}>
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* CENTER ADD/EDIT STUDENT FORM */}
                {centerView === 'add-student' && (
                  <div className="tab-content-wrapper glass-panel" style={{ padding: '30px' }}>
                    <div className="form-header">
                      <h2>{centerExistingStudent ? 'Edit Student Details' : 'Register New Student'}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {centerExistingStudent ? `Editing: ${centerExistingStudent.name}` : 'All fields marked are mandatory.'}
                      </p>
                    </div>
                    <form onSubmit={handleCenterStudentSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-row-grid">
                        <div>
                          <label className="form-label">Student Name *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.name} onChange={(e) => setCenterStudentForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
                        </div>
                        <div>
                          <label className="form-label">Father Name *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.fatherName} onChange={(e) => setCenterStudentForm(p => ({ ...p, fatherName: e.target.value.toUpperCase() }))} />
                        </div>
                        <div>
                          <label className="form-label">Mother Name *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.motherName} onChange={(e) => setCenterStudentForm(p => ({ ...p, motherName: e.target.value.toUpperCase() }))} />
                        </div>
                      </div>
                      <div className="form-row-grid">
                        <div>
                          <label className="form-label">Date of Birth (DD/MM/YYYY) *</label>
                          <input type="text" required placeholder="DD/MM/YYYY" maxLength={10} className="form-input" value={centerStudentForm.dob} onChange={(e) => {
                            const val = e.target.value; const clean = val.replace(/\D/g, ''); const digits = clean.slice(0, 8);
                            let formatted = '';
                            if (digits.length <= 2) formatted = digits;
                            else if (digits.length <= 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                            else formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                            setCenterStudentForm(p => ({ ...p, dob: formatted }));
                          }} />
                        </div>
                        <div>
                          <label className="form-label">Email Address *</label>
                          <input type="email" required className="form-input" value={centerStudentForm.email} onChange={(e) => setCenterStudentForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Contact Number *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.contactNumber} onChange={(e) => setCenterStudentForm(p => ({ ...p, contactNumber: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-row-grid">
                        <div style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Address *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.address} onChange={(e) => setCenterStudentForm(p => ({ ...p, address: e.target.value.toUpperCase() }))} />
                        </div>
                        <div>
                          <label className="form-label">Center Name *</label>
                          <input type="text" className="form-input" disabled style={{ opacity: 0.7 }} value={centerData ? centerData.centerName : ''} />
                        </div>
                      </div>
                      <div className="form-row-grid">
                        <div>
                          <label className="form-label">Admission Date *</label>
                          <input type="text" required placeholder="DD/MM/YYYY" maxLength={10} className="form-input" value={centerStudentForm.admissionDate} onChange={(e) => {
                            const val = e.target.value; const clean = val.replace(/\D/g, ''); const digits = clean.slice(0, 8);
                            let formatted = '';
                            if (digits.length <= 2) formatted = digits;
                            else if (digits.length <= 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                            else formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                            setCenterStudentForm(p => ({ ...p, admissionDate: formatted }));
                          }} />
                        </div>
                        <div>
                          <label className="form-label">Course *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.course} onChange={(e) => setCenterStudentForm(p => ({ ...p, course: e.target.value.toUpperCase() }))} placeholder="e.g. DIPLOMA IN BUSINESS MANAGEMENT" />
                        </div>
                        <div>
                          <label className="form-label">Session *</label>
                          <input type="text" required className="form-input" value={centerStudentForm.session} onChange={(e) => setCenterStudentForm(p => ({ ...p, session: e.target.value.toUpperCase() }))} placeholder="e.g. 2024-2026" />
                        </div>
                      </div>

                      <div className="photo-upload-row">
                        <div className="photo-preview-box">
                          {centerStudentPhoto ? (
                            <img src={centerStudentPhoto} alt="Cropped preview" />
                          ) : (
                            <div className="placeholder"><Image size={32} /></div>
                          )}
                        </div>
                        <div>
                          <label className="form-label">Upload Student Photo (Mandatory)</label>
                          <input type="file" accept="image/*" className="form-input" onChange={handleCenterPhotoSelect} />
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Upload and crop using our precision cropping tool.</p>
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Upload Documents (Aadhaar, Marksheets, etc.)</label>
                        <div className="doc-upload-zone">
                          <UploadCloud size={24} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                          <span>Click to upload multiple documents</span>
                          <input type="file" multiple accept="image/*,.pdf" onChange={(e) => setCenterDocuments(Array.from(e.target.files))} />
                        </div>
                        {centerDocuments.length > 0 && (
                          <div className="doc-list">
                            {centerDocuments.map((doc, i) => (
                              <span key={i} className="doc-item"><FileText size={12} /> {doc.name}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setCenterView('dashboard')}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{centerExistingStudent ? 'Update Student' : 'Save Student'}</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* CENTER PAYMENT HISTORY */}
                {centerView === 'payment-history' && (
                  <div className="tab-content-wrapper">
                    <div className="page-header-row">
                      <h2>Payment History</h2>
                    </div>
                    <div className="center-student-table-wrapper">
                      <table className="payment-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {centerPayments.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No payment records found.</td></tr>
                          ) : centerPayments.map(p => (
                            <tr key={p.id}>
                              <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                              <td style={{ textTransform: 'capitalize' }}>{p.type.replace(/_/g, ' ')}</td>
                              <td style={{ fontWeight: '600' }}>₹{p.amount}</td>
                              <td>{p.description}</td>
                              <td><span className={`payment-status ${p.status}`}>{p.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CENTER WALLET */}
                {centerView === 'wallet' && (
                  <div className="tab-content-wrapper">
                    <div className="page-header-row">
                      <h2>Wallet Balance</h2>
                    </div>
                    <div className="wallet-card">
                      <div className="wallet-label">AVAILABLE BALANCE</div>
                      <div className="wallet-balance">₹{centerWallet.balance.toLocaleString('en-IN')}</div>
                      <p style={{ fontSize: '12px', opacity: 0.7 }}>Admin adds balance to your wallet. Use it to pay student fees.</p>
                    </div>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Transaction History</h3>
                    <div className="center-student-table-wrapper">
                      <table className="payment-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Balance After</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {centerWallet.transactions.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions yet.</td></tr>
                          ) : centerWallet.transactions.map(t => (
                            <tr key={t.id}>
                              <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                              <td>
                                <span style={{ color: t.type === 'credit' ? 'var(--secondary)' : 'var(--danger)', fontWeight: '600', textTransform: 'capitalize' }}>
                                  {t.type === 'credit' ? '+ Credit' : '- Debit'}
                                </span>
                              </td>
                              <td style={{ fontWeight: '600', color: t.type === 'credit' ? 'var(--secondary)' : 'var(--danger)' }}>
                                {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                              </td>
                              <td>₹{t.balanceAfter}</td>
                              <td>{t.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CENTER ACKNOWLEDGEMENT */}
                {centerView === 'acknowledgement' && centerAckStudent && (
                  <div className="tab-content-wrapper">
                    <div className="page-header-row">
                      <h2>Student Acknowledgement</h2>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={() => window.print()}>
                          <Printer size={16} /> Print / Save PDF
                        </button>
                        <button className="btn btn-outline" onClick={() => setCenterView('dashboard')}>
                          <ArrowLeft size={16} /> Back
                        </button>
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                      <AcknowledgementTemplate student={centerAckStudent} center={centerData} />
                </div>
              </div>
            )}
            {/* STAFF ADMIN STAFF DETAIL + CHAT */}
            {staffAdminAuthenticated && staffAdminView === 'staff-detail' && staffAdminSelectedStaffId && (() => {
              const staff = staffAdminStaffList.find(s => String(s.id) === String(staffAdminSelectedStaffId));
              if (!staff) return null;
              const staffStudents = staffAdminStudents.filter(s => String(s.staffId) === String(staff.id));
              return (
                <div className="tab-content-wrapper">
                  <div className="page-header-row">
                    <h2>Staff Profile — {staff.name}</h2>
                    <button className="btn btn-outline" onClick={() => { setStaffAdminSelectedStaffId(null); setStaffDetailData(null); setChatMessages([]); setStaffAdminView('staff-list'); }}><ArrowLeft size={16} /> Back</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>{staffStudents.length}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Total Students</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)', margin: 0 }}>{staffStudents.filter(s => s.status === 'pending').length}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Pending</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>{staffStudents.filter(s => s.status === 'active').length}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Active</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: '#e65100', margin: 0 }}>{staffStudents.reduce((sum, s) => sum + (s.correctionCount || 0), 0)}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Corrections</p>
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                      <p><strong>Mobile:</strong> {staff.mobile}</p>
                      <p><strong>Password:</strong> <span style={{ fontFamily: 'monospace' }}>{staff.plainPassword || 'Set via Change Pass'}</span></p>
                      <p><strong>Joined:</strong> {new Date(staff.createdAt).toLocaleDateString('en-IN')}</p>
                      <p><strong>Status:</strong> <span className={`center-status-badge ${staff.isActive ? 'active' : 'inactive'}`}>{staff.isActive ? 'Active' : 'Inactive'}</span></p>
                    </div>
                  </div>
                  {staffStudents.length > 0 && (
                    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Students ({staffStudents.length})</h3>
                      <div className="center-student-table-wrapper">
                        <table className="center-student-table">
                          <thead><tr><th>S.No</th><th>Student</th><th>Father</th><th>Course</th><th>Status</th><th>Corrections</th><th>Actions</th></tr></thead>
                          <tbody>
                            {staffStudents.map((s, idx) => (
                              <tr key={s.id}>
                                <td>{idx + 1}</td>
                                <td style={{ fontWeight: '600' }}>{s.name}</td>
                                <td>{s.fatherName}</td>
                                <td style={{ fontSize: '12px' }}>{s.course}</td>
                                <td><span className={`center-status-badge ${s.status}`}>{s.status}</span></td>
                                <td>{s.correctionCount || 0}</td>
                                <td><button className="center-action-btn" onClick={() => { setStaffAdminSelectedStudent(s); setStaffAdminView('manage-student'); setStaffAdminUploadFiles([]); setStaffAdminUploadNote(''); }}><Eye size={12} /> View</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
                      <div>
                        <p style={{ fontWeight: '700', margin: 0, fontSize: '15px' }}>Chat with {staff.name}</p>
                        <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Send messages and instructions</p>
                      </div>
                    </div>
                    <div style={{ height: '350px', overflowY: 'auto', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
                          <p style={{ fontSize: '40px', margin: '0 0 8px' }}>💬</p>
                          <p style={{ fontSize: '14px', fontWeight: '600' }}>No messages yet</p>
                          <p style={{ fontSize: '12px' }}>Start a conversation with {staff.name}</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.from === 'staffadmin_1' ? 'flex-end' : 'flex-start', animation: 'chatBubbleIn 0.3s ease' }}>
                          <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: msg.from === 'staffadmin_1' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.from === 'staffadmin_1' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white', color: msg.from === 'staffadmin_1' ? 'white' : 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '13px', wordBreak: 'break-word' }}>
                            <p style={{ margin: 0 }}>{msg.text}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <style>{`@keyframes chatBubbleIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
                      {showEmojiPicker && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px', padding: '8px', background: '#f1f5f9', borderRadius: '8px', animation: 'fadeIn 0.2s ease' }}>
                          {['😀','😂','😍','🥰','😎','🤩','👍','👎','❤️','🔥','💯','✅','🎉','🙏','👋','🤔','😢','😡','🤝','💪','👏','📦','📄','❌','⏰','💰','📋','🎯','⭐','🚀','💬','📩','📞','🏫','👨‍🎓','👩‍🎓'].map(e => (
                            <button key={e} onClick={() => setChatInput(prev => prev + e)} style={{ fontSize: '20px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', transition: 'transform 0.15s' }} onMouseEnter={ev => ev.target.style.transform = 'scale(1.3)'} onMouseLeave={ev => ev.target.style.transform = 'scale(1)'}>{e}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s' }} onMouseEnter={ev => ev.target.style.transform = 'scale(1.2)'} onMouseLeave={ev => ev.target.style.transform = 'scale(1)'}>😊</button>
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} placeholder="Type a message..." className="form-input" style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }} />
                        <button onClick={sendChatMessage} disabled={!chatInput.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: chatInput.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0', color: 'white', cursor: chatInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', transform: chatInput.trim() ? 'scale(1)' : 'scale(0.9)' }}>
                          <UploadCloud size={18} style={{ transform: 'rotate(0deg)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            </section>
          </div>
          )
        )}
      </main>

      {/* ----------------- ADMIN DOCUMENTS DIALOG MODAL (Screen Only) ----------------- */}
      {activeDocStudent && (
        <div className="dialog-modal-overlay no-print animate-fade-in">
          <div className="dialog-modal-container">
            <div className="dialog-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3>Document Portal: {activeDocStudent.name}</h3>
                
                <select 
                  className="form-select"
                  style={{ width: '180px', padding: '4px 8px', fontSize: '12px' }}
                  value={activeDocTerm}
                  onChange={(e) => setActiveDocTerm(e.target.value)}
                >
                  {Object.keys(activeDocStudent.marksheets).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={triggerPrint}>
                  <Printer size={14} /> Print / PDF
                </button>
                <button className="btn btn-outline btn-sm" style={{ padding: '6px' }} onClick={() => setActiveDocStudent(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Selector Nav Tabs inside Modal */}
            <div className="modal-tab-nav">
              <button 
                className={`modal-nav-link ${activeDocTab === 'marksheet' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('marksheet')}
              >
                Marksheet
              </button>
              <button 
                className={`modal-nav-link ${activeDocTab === 'admit' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('admit')}
              >
                Admit Card
              </button>
              <button 
                className={`modal-nav-link ${activeDocTab === 'id' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('id')}
              >
                ID Card
              </button>
              <button 
                className={`modal-nav-link ${activeDocTab === 'result' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('result')}
              >
                Online Result
              </button>
            </div>

            {/* Document Render block inside Modal */}
            <div className="modal-document-frame">
              {activeDocTab === 'marksheet' && (
                <MarksheetTemplate 
                  student={activeDocStudent} 
                  course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
                  termName={activeDocTerm} 
                />
              )}
              {activeDocTab === 'admit' && (
                <AdmitCardTemplate 
                  student={activeDocStudent} 
                  course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
                  termName={activeDocTerm} 
                />
              )}
              {activeDocTab === 'id' && (
                <IdCardTemplate student={activeDocStudent} />
              )}
              {activeDocTab === 'result' && (
                <OnlineResultTemplate 
                  student={activeDocStudent} 
                  course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
                  termName={activeDocTerm} 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SELECTIVE PUBLISH DIALOG MODAL (Screen Only) ----------------- */}
      {publishingStudent && (
        <div className="dialog-modal-overlay no-print animate-fade-in">
          <div className="dialog-modal-container" style={{ maxWidth: '520px', height: 'auto', maxHeight: '85vh' }}>
            <div className="dialog-header-bar">
              <h3>Publishing Options: {publishingStudent.name}</h3>
              <button className="btn btn-outline btn-sm" style={{ padding: '6px' }} onClick={() => setPublishingStudent(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Select which student documents should be visible and accessible on the student public web portal.
              </p>
              
              {/* ID Card Checkbox */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Student ID Card</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Valid across all academic sessions</div>
                </div>
                <input 
                  type="checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  checked={!!localPublishDocs.idCard}
                  onChange={(e) => setLocalPublishDocs(prev => ({ ...prev, idCard: e.target.checked }))}
                />
              </div>
              
              {/* Academic Terms Document Checklist */}
              <div>
                <h4 className="form-label" style={{ marginBottom: '10px' }}>Select Documents by Academic Term</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.keys(publishingStudent.marksheets).map(term => (
                    <div key={term} className="glass-panel" style={{ padding: '16px' }}>
                      <strong style={{ fontSize: '13.5px', color: 'var(--secondary)', display: 'block', marginBottom: '12px' }}>
                        {term.toUpperCase()}
                      </strong>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}>
                          <span>Marksheet Statement</span>
                          <input 
                            type="checkbox"
                            style={{ width: '16px', height: '16px' }}
                            checked={!!localPublishDocs.marksheets?.[term]}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLocalPublishDocs(prev => ({
                                ...prev,
                                marksheets: { ...(prev.marksheets || {}), [term]: checked }
                              }));
                            }}
                          />
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}>
                          <span>Examination Admit Card</span>
                          <input 
                            type="checkbox"
                            style={{ width: '16px', height: '16px' }}
                            checked={!!localPublishDocs.admitCards?.[term]}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLocalPublishDocs(prev => ({
                                ...prev,
                                admitCards: { ...(prev.admitCards || {}), [term]: checked }
                              }));
                            }}
                          />
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px' }}>
                          <span>Online Result Page</span>
                          <input 
                            type="checkbox"
                            style={{ width: '16px', height: '16px' }}
                            checked={!!localPublishDocs.results?.[term]}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLocalPublishDocs(prev => ({
                                ...prev,
                                results: { ...(prev.results || {}), [term]: checked }
                              }));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setPublishingStudent(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPublishSettings}>Confirm & Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CENTER FEE PAYMENT MODAL ----------------- */}
      {centerPayModal.open && (
        <div className="dialog-modal-overlay no-print animate-fade-in" onClick={() => setCenterPayModal({ open: false, studentId: '', studentName: '', amount: '', description: '', screenshot: null, screenshotPreview: '' })}>
          <div className="wallet-topup-modal animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: '20px', width: '460px', maxWidth: '95vw',
            overflow: 'hidden', boxShadow: '0 25px 60px rgba(13, 33, 73, 0.3)', border: '1px solid var(--border-color)'
          }}>
            {/* Gradient Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1b5e20 0%, #0D2149 100%)',
              padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <CreditCard size={32} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Pay Student Fee</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>Student: {centerPayModal.studentName}</p>
            </div>
            
            {/* Form Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Wallet Balance */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%)', 
                border: '1px solid rgba(27, 94, 32, 0.2)', borderRadius: '12px', padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Wallet Balance</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>₹{(centerStats.walletBalance || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Fee Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>₹</span>
                  <input
                    type="number" min="1" placeholder="Enter fee amount"
                    className="form-input"
                    style={{ paddingLeft: '36px', fontSize: '20px', fontWeight: '700', height: '54px', borderRadius: '12px', border: '2px solid var(--border-color)' }}
                    value={centerPayModal.amount}
                    onChange={(e) => setCenterPayModal(p => ({ ...p, amount: e.target.value }))}
                    autoFocus
                  />
                </div>
                {centerPayModal.amount && parseFloat(centerPayModal.amount) > (centerStats.walletBalance || 0) && (
                  <p style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '4px' }}>Insufficient wallet balance</p>
                )}
              </div>

              {/* Quick Amount Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1000, 2000, 5000, 10000, 25000].map(amt => (
                  <button key={amt} type="button" onClick={() => setCenterPayModal(p => ({ ...p, amount: amt.toString() }))}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
                      background: centerPayModal.amount === amt.toString() ? 'var(--secondary)' : 'transparent',
                      color: centerPayModal.amount === amt.toString() ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                    }}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Description (optional)</label>
                <input type="text" placeholder="e.g. 1st Semester Fee" className="form-input" style={{ borderRadius: '10px' }}
                  value={centerPayModal.description}
                  onChange={(e) => setCenterPayModal(p => ({ ...p, description: e.target.value }))} />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Payment Screenshot</label>
                <div className="doc-upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '20px' }}>
                  {centerPayModal.screenshotPreview ? (
                    <img src={centerPayModal.screenshotPreview} alt="Screenshot" style={{ maxHeight: '80px', borderRadius: '8px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                      <span>Click to upload payment screenshot</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => setCenterPayModal(p => ({ ...p, screenshot: file, screenshotPreview: ev.target.result }));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }}
                  onClick={() => setCenterPayModal({ open: false, studentId: '', studentName: '', amount: '', description: '', screenshot: null, screenshotPreview: '' })}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 2, padding: '12px', fontSize: '15px', fontWeight: '700', background: 'var(--secondary)' }}
                  onClick={handleCenterPaySubmit}
                  disabled={!centerPayModal.amount || parseFloat(centerPayModal.amount) <= 0 || parseFloat(centerPayModal.amount) > (centerStats.walletBalance || 0)}>
                  <CreditCard size={18} /> Pay ₹{centerPayModal.amount ? parseFloat(centerPayModal.amount).toLocaleString('en-IN') : '0'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- WALLET TOPUP MODAL ----------------- */}
      {walletTopupModal.open && (
        <div className="dialog-modal-overlay no-print animate-fade-in" onClick={() => setWalletTopupModal({ open: false, centerId: '', centerName: '', amount: '', description: '' })}>
          <div className="wallet-topup-modal animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: '20px', width: '420px', maxWidth: '95vw',
            overflow: 'hidden', boxShadow: '0 25px 60px rgba(13, 33, 73, 0.3)', border: '1px solid var(--border-color)'
          }}>
            {/* Gradient Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0D2149 0%, #1b5e20 100%)',
              padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: '-30px', right: '30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <Wallet size={32} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Add Wallet Balance</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>{walletTopupModal.centerName}</p>
            </div>
            
            {/* Form Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Amount Input */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>₹</span>
                  <input
                    type="number" min="1" placeholder="Enter amount"
                    className="form-input"
                    style={{ paddingLeft: '36px', fontSize: '20px', fontWeight: '700', height: '54px', borderRadius: '12px', border: '2px solid var(--border-color)' }}
                    value={walletTopupModal.amount}
                    onChange={(e) => setWalletTopupModal(p => ({ ...p, amount: e.target.value }))}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1000, 5000, 10000, 25000, 50000].map(amt => (
                  <button key={amt} type="button" onClick={() => setWalletTopupModal(p => ({ ...p, amount: amt.toString() }))}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
                      background: walletTopupModal.amount === amt.toString() ? 'var(--primary)' : 'transparent',
                      color: walletTopupModal.amount === amt.toString() ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                    }}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Description (optional)</label>
                <input
                  type="text" placeholder="e.g. Quarterly fee deposit"
                  className="form-input"
                  style={{ borderRadius: '10px' }}
                  value={walletTopupModal.description}
                  onChange={(e) => setWalletTopupModal(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }}
                  onClick={() => setWalletTopupModal({ open: false, centerId: '', centerName: '', amount: '', description: '' })}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 2, padding: '12px', fontSize: '15px', fontWeight: '700' }}
                  onClick={handleWalletTopupSubmit}>
                  <Wallet size={18} /> Add ₹{walletTopupModal.amount ? parseFloat(walletTopupModal.amount).toLocaleString('en-IN') : '0'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PHOTO CROPPER BOX MODAL (Screen Only) ----------------- */}
      {cropSrc && (
        <ImageCropper 
          imageSrc={cropSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropSrc(null)} 
        />
      )}

      {centerCropSrc && (
        <ImageCropper 
          imageSrc={centerCropSrc} 
          onCropComplete={handleCenterCropComplete} 
          onCancel={() => setCenterCropSrc(null)} 
        />
      )}

      {/* -------------------------------------------------------------
         3. PRINT DISPLAY CONTAINER (Rendered only when printing)
         ------------------------------------------------------------- */}
      {currentView === 'portal' && portalStudent && (
        <div className="print-only-container">
          {portalActiveTab === 'marksheet' && (
            <MarksheetTemplate 
              student={portalStudent} 
              course={portalCourse} 
              termName={portalActiveTerm} 
            />
          )}
          {portalActiveTab === 'admit' && (
            <AdmitCardTemplate 
              student={portalStudent} 
              course={portalCourse} 
              termName={portalActiveTerm} 
            />
          )}
          {portalActiveTab === 'id' && (
            <IdCardTemplate student={portalStudent} />
          )}
          {portalActiveTab === 'result' && (
            <OnlineResultTemplate 
              student={portalStudent} 
              course={portalCourse} 
              termName={portalActiveTerm} 
            />
          )}
        </div>
      )}

      {activeDocStudent && (
        <div className="print-only-container">
          {activeDocTab === 'marksheet' && (
            <MarksheetTemplate 
              student={activeDocStudent} 
              course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
              termName={activeDocTerm} 
            />
          )}
          {activeDocTab === 'admit' && (
            <AdmitCardTemplate 
              student={activeDocStudent} 
              course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
              termName={activeDocTerm} 
            />
          )}
          {activeDocTab === 'id' && (
            <IdCardTemplate student={activeDocStudent} />
          )}
          {activeDocTab === 'result' && (
            <OnlineResultTemplate 
              student={activeDocStudent} 
              course={courses.find(c => c.name.toLowerCase() === activeDocStudent.course.toLowerCase())} 
              termName={activeDocTerm} 
            />
          )}
        </div>
      )}

      {/* Print-only Acknowledgement */}
      {centerView === 'acknowledgement' && centerAckStudent && (
        <div className="print-only-container">
          <AcknowledgementTemplate student={centerAckStudent} center={centerData} />
        </div>
      )}
      {/* CUSTOM PREMIUM MODAL */}
      {customModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: typeof customModal.message !== 'string' ? '600px' : '400px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>{customModal.title}</h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>{customModal.message}</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {customModal.type === 'confirm' && (
                <button className="btn btn-outline" onClick={customModal.onCancel} style={{ minWidth: '100px' }}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={customModal.onConfirm} style={{ minWidth: '100px' }}>
                {customModal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

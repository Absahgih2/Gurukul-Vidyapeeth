# Center Login & Management System - Implementation Plan

## Overview
Implement a complete Center Login system where educational centers can log in, manage students, process payments, and download acknowledgements. Admin gains the ability to manage centers, view their data, and process documents.

---

## Phase 1: Database Schema Changes

### 1.1 Add `centers` collection to `db.json`
```json
{
  "centers": [
    {
      "id": "center_001",
      "centerName": "ABC EDUCATION CENTER",
      "username": "abc_center",
      "password": "hashed_password",
      "contactPerson": "John Doe",
      "email": "abc@example.com",
      "phone": "9876543210",
      "address": "123 Main St, City",
      "walletBalance": 0,
      "isActive": true,
      "createdAt": "2026-08-18T00:00:00.000Z"
    }
  ],
  "centerStudents": [],
  "centerPayments": [
    {
      "id": "pay_001",
      "centerId": "center_001",
      "amount": 5000,
      "type": "wallet_topup",
      "description": "Wallet balance added by admin",
      "screenshot": "",
      "status": "approved",
      "createdAt": "2026-08-18T00:00:00.000Z"
    }
  ],
  "walletTransactions": [
    {
      "id": "txn_001",
      "centerId": "center_001",
      "type": "credit",
      "amount": 5000,
      "balanceAfter": 5000,
      "description": "Admin wallet topup",
      "createdAt": "2026-08-18T00:00:00.000Z"
    }
  ]
}
```

### 1.2 Student record gets a `centerId` field
Every student added by a center or admin will have `centerId` to track which center registered them.

---

## Phase 2: Backend API (server.js)

### 2.1 Center Authentication APIs
- `POST /api/center/login` - Center login with username/password
- `POST /api/center/logout` - Center logout
- `GET /api/center/profile` - Get center profile (requires center auth)

### 2.2 Center Student Management APIs
- `GET /api/center/students` - Get students for logged-in center (filtered)
- `POST /api/center/students` - Add new student (auto-assigns centerId)
- `PUT /api/center/students/:id` - Edit student
- `GET /api/center/dashboard-stats` - Get total, active, pending student counts

### 2.3 Center Payment APIs
- `GET /api/center/payments` - Get payment history for center
- `POST /api/center/payments` - Upload payment screenshot
- `GET /api/center/wallet` - Get wallet balance and transactions
- `POST /api/center/wallet/pay` - Deduct wallet for student fee payment

### 2.4 Admin Center Management APIs
- `GET /api/admin/centers` - List all centers
- `POST /api/admin/centers` - Create new center
- `PUT /api/admin/centers/:id` - Edit center
- `DELETE /api/admin/centers/:id` - Delete center
- `POST /api/admin/centers/:id/wallet` - Add wallet balance
- `GET /api/admin/center-students/:centerId` - View center's students
- `POST /api/admin/process-center-student/:studentId` - Process/auto-fill into admin student system

### 2.5 Acknowledgement API
- `GET /api/center/acknowledgement/:studentId` - Generate acknowledgement HTML

### Auth Approach
- Passwords hashed with **bcrypt** (new dependency)
- Use simple session-based auth stored in sessionStorage (like current admin)
- Center auth token stored client-side
- Server validates via middleware
- Student numbering: Center adds data first → admin processes and generates Roll/Enrollment numbers
- Wallet: Admin only can add balance to center wallets
- Document storage: Files in `/uploads/` folder, referenced by URL

---

## Phase 3: Frontend - Center Login & Dashboard

### 3.1 Navbar Changes (index.html)
- Change "Login" (student portal) to "Center Login"
- Add new link pointing to `/admin/?view=center-login`
- Keep "Admin Login" as-is
- Update mobile drawer similarly

### 3.2 New View: `center-login` (App.jsx)
- Center Login form (username + password)
- On success → redirect to center dashboard

### 3.3 New View: `center-dashboard` (App.jsx)
**Top Stats Bar:**
- Total Students Registered (active button)
- Active Students count
- Pending Students count

**Student List Table:**
| S.No | Photo | Name | Father Name | Contact | Email | Status | Actions |
- Search by name, course, session
- Recent updates on top (sorted by updatedAt desc)
- Action buttons: View, Complete Edit, Download Acknowledgement

**Sidebar Navigation:**
- Dashboard
- Add New Student
- Payment History
- Wallet Balance
- Sign Out

### 3.4 New Component: `CenterStudentForm`
All mandatory fields:
- Student Name (uppercase, mandatory)
- Father Name (uppercase, mandatory)
- Mother Name (uppercase, mandatory)
- Date of Birth (DD/MM/YYYY auto-separator, mandatory)
- Email Address (mandatory)
- Center Name (auto-filled, mandatory)
- Address (uppercase, mandatory)
- Admission Date (mandatory)
- Contact Number (mandatory)
- Course (dropdown, mandatory)
- Session (mandatory)
- Upload Photo with cropping tool (mandatory)
- Multiple document uploads (Aadhaar, marksheets, etc.)

**Input Behavior:**
- All text fields auto-convert to uppercase via onChange
- Backspace and space work normally
- Date format DD/MM/YYYY with automatic `/` separators

### 3.5 New Component: `AcknowledgementTemplate`
- University logo and name header
- Student details
- Center name
- Admission date
- Roll/Enrollment number
- Auto-generated acknowledgement number
- Printable/downloadable

### 3.6 Payment History View
- Table of all payments made
- Upload screenshot option
- Payment status indicators

### 3.7 Wallet View
- Current balance display
- Transaction history
- Pay for student (deducts from wallet)

---

## Phase 4: Frontend - Admin Center Management

### 4.1 Admin Sidebar Addition
- Below "Course Manager": add "Center Admissions" link
- Clicking shows all centers and their student data

### 4.2 Admin Center Management Tab
- Create/edit/delete centers
- Set username/password for centers
- Add wallet balance to centers
- View which center gave which admissions
- View admission counts per center

### 4.3 Admin Center Student Processing
- When admin clicks on a center's student
- Data auto-fills into the admin's "Add Student" form
- Admin can process normally (add marks, generate documents)

---

## Phase 5: Files to Create/Modify

### Files to MODIFY:
1. `admin-panel/data/db.json` - Add centers, centerStudents, centerPayments, walletTransactions
2. `admin-panel/server.js` - Add all new API endpoints
3. `admin-panel/src/App.jsx` - Add center login view, center dashboard, center student form, admin center management
4. `admin-panel/src/index.css` - Add new CSS for center dashboard, table, etc.
5. `index.html` - Change "Login" to "Center Login" in navbar
6. `assets/css/styles.css` - May need minor updates for navbar

### Files to CREATE:
7. `admin-panel/src/components/AcknowledgementTemplate.jsx` - Acknowledgement document template
8. `admin-panel/src/components/CenterStudentForm.jsx` - Center student registration form
9. `admin-panel/src/components/PaymentHistory.jsx` - Payment history component
10. `admin-panel/src/components/WalletView.jsx` - Wallet balance and transactions

---

## Phase 6: Implementation Order

1. **Database schema** - Update db.json with new collections
2. **Backend APIs** - Add all server.js endpoints
3. **Navbar update** - Change index.html Login to Center Login
4. **Center Login** - Add center-login view to App.jsx
5. **Center Dashboard** - Student list, stats, search
6. **Center Student Form** - Add new student with all fields + photo crop
7. **Acknowledgement Template** - Generate downloadable acknowledgement
8. **Payment & Wallet** - Payment history, wallet, screenshot upload
9. **Admin Center Management** - Create/edit centers, view data, process students
10. **Admin Center Student Processing** - Auto-fill admin form from center data
11. **CSS** - All styling for new components
12. **Testing** - Verify all flows work correctly

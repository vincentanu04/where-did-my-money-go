# WHERE DID MY MONEY GO — Product Overview

## 1. Existing Features

### 1.1 User Accounts & Authentication

- User registration  
- User login  
- User logout  
- Cookie-based JWT authentication (stateless, no server-side session storage)

---

### 1.2 Home Page (Daily Expense Input)

- Displays expenses for a selected date  
- Date navigation using **left / right buttons**  
- Categories are **hardcoded** and always visible  
- Clicking a category opens a **modal** to:
  - Input expense amount
  - Add an optional remark
- Newly added expenses are tied to the currently selected date

---

### 1.3 History Page (Daily Expense Review)

- Opened via a **Floating Action Button (FAB)** from the Home page  
- Displays expenses for the selected date  
- Date navigation using **left / right buttons**

**Navigation behavior**
- When returning to the Home page, the previously selected Home date is preserved

**Expense Management**
- Edit expense amount  
- Edit expense remark  
- Delete expense  

---

### 1.4 CSV Export

- Export expenses as CSV from the History page  
- Supported export modes:
  - **Monthly**
  - **Yearly**
  - **Custom date range** (From / To)

**CSV capabilities**
- Grouped by categories  
- Daily totals  
- Grand totals  
- Average per day calculations  
- Remarks included where applicable  

---

## 2. Future Improvements & Feature Ideas

### 2.1 UX & Productivity Improvements

**Goal:** Reduce friction in daily expense entry and review.

- **Editable Categories**
  - Add new categories
  - Rename categories
  - Reorder categories
  - Optional icon or color per category
  - Category changes do **not** affect historical data

- **Quick-Add Shortcuts**
  - Remember last-used amount per category
  - Remember last-used remark
  - One-tap repeat for recent expenses
  - Optimized for recurring purchases

- **Duplicate Expense**
  - Duplicate an expense to the same or different date
  - Useful for recurring or corrected entries

- **Inline Editing**
  - Edit amount and remark directly in the History list
  - Modal retained for advanced edits

- **Keyboard & Power User Support (Desktop)**
  - Arrow keys for date navigation
  - Enter to confirm
  - Escape to cancel
  - Improves speed for frequent users

---

### 2.2 Insights & Analytics

**Goal:** Turn raw expense data into actionable insight.

- **Weekly / Monthly Summaries**
  - Total spending
  - Daily average
  - Highest spending day
  - Top category

- **Category Breakdown**
  - Pie or bar charts
  - Percentage of total spend
  - Cross-month comparisons

- **Spending Trends**
  - Line charts for totals
  - Per-category trends
  - Identify increases or savings

- **Budgets**
  - Monthly budget per category
  - Overall monthly budget
  - Visual progress indicators
  - Soft warnings or hard limits

- **Period Comparison**
  - This month vs last month
  - This year vs last year
  - Highlight changes clearly

---

### 2.3 Data & Export Enhancements

**Goal:** Make data portable, safe, and reusable.

- **Excel (XLSX) Export**
  - Native formulas
  - Better accounting tool compatibility

- **CSV Import**
  - Import from banks or other apps
  - Column mapping UI
  - Validation and preview step

- **Scheduled Exports**
  - Automatic monthly exports
  - Delivered via email
  - Useful for accounting or personal records

- **Backup & Restore**
  - Manual backup download
  - Restore from backup file
  - Enables device migration and recovery

---

### 2.4 Notifications & Reminders

**Goal:** Encourage consistency without being intrusive.

- **Daily Reminder**
  - Optional
  - User-defined time

- **End-of-Day Summary**
  - Daily total
  - Categories used

- **Monthly Summary**
  - Total spending
  - Largest category
  - Average per day

---

### 2.5 Friends & Social Features (Recommended)

This is a **strong, natural extension** when scoped carefully.

#### Shared Expense Groups

- **Create Groups**
  - Examples: Trip, Roommates, Couple, Event
  - Invite by email or username

- **Shared Expenses**
  - Expenses can belong to a group
  - Split equally or custom amounts
  - Track who paid

- **Balance Tracking**
  - Automatic balance calculation
  - Per-group overview

- **Settlements**
  - Mark balances as settled
  - Keep settlement history
  - No real payments required

**Why this works**
- Real-world use cases
- Encourages retention
- Optional and isolated from personal tracking
- High value without social feed complexity

**Recommended scope**
- Start with groups + balances only

---

### 2.6 Security & Account Enhancements

**Goal:** Improve trust and account safety with minimal complexity.

- **Forgot Password**
  - Email-based reset
  - Time-limited token
  - No additional infrastructure cost

- **Session Management**
  - View active sessions
  - Logout all devices
  - Token versioning or rotation

- **Account Settings**
  - Change password
  - Export personal data
  - Delete account

---

### 2.7 Advanced & Long-Term Ideas

**Goal:** Power features without bloating the core.

- Multiple currencies
- Receipt upload with optional OCR
- Smart category suggestions
- Tax / reimbursement reports
- Offline-first support with sync

---

## 3. Suggested Feature Roadmap

### Phase 1 — Polish & Retention
- Editable categories
- Faster input UX
- Improved summaries
- Forgot password

### Phase 2 — Power Users
- Budgets
- Analytics
- Import and advanced exports

### Phase 3 — Social Value
- Shared groups
- Split expenses
- Settlements

### Phase 4 — Intelligence
- Smart categorization
- Receipts
- Advanced reporting

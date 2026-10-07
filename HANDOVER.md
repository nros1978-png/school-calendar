# Technical Handover: School Calendar & Gantt Application (לוח שנה וגאנט בית ספרי)

> **Document Version:** 1.0.0  
> **Date:** October 7, 2026  
> **Source Platform:** Antigravity  
> **Target Platform:** OpenAI Codex / Future Engineering Agents  
> **Live Production URL:** [https://nros1978-png.github.io/school-calendar/](https://nros1978-png.github.io/school-calendar/)  
> **GitHub Repository:** [https://github.com/nros1978-png/school-calendar.git](https://github.com/nros1978-png/school-calendar.git)  

---

## 1. Executive Summary & Authoritative Source Code

### 1.1 Architecture & Purpose
The **School Calendar & Gantt Application** is a specialized pedagogical scheduling and display platform developed for **ממ"ד כרמי יהודה** (Carmei Yehuda State Religious Elementary School). It provides:
1. **Interactive Pedagogical Calendar:** A dual-calendar grid supporting Hebrew dates, Israeli holidays, Rosh Chodesh, and school event categorization.
2. **Gantt Chart View:** A visual timeline for multi-day pedagogical milestones, grade-level projects, and field trips.
3. **Staff Room Television Kiosk Mode:** A dedicated full-screen 4-week rolling display tailored for smart TVs (Android TV, Tizen, webOS) showing active schedules, live clock, daily teacher duty rosters (תורנויות), and staff announcements without UI clutter.
4. **Role-Based Access Control (RBAC):** Firebase Authentication with Google Sign-in and Firestore database persistence for managing events, permissions, and duty rosters.
5. **Zero-Dependency Deployment:** Pure client-side static web application hosted directly on GitHub Pages with real-time multi-client synchronization via Cloud Firestore.

### 1.2 Repository & Environment Details
* **Remote Repository URL:** `https://github.com/nros1978-png/school-calendar.git`
* **Local Workspace Directory:** `C:\Users\נעם\.gemini\antigravity\scratch\school-calendar-gantt`
* **Authoritative Branch:** `main` (both primary branch and GitHub Pages deployment branch).
* **Current Production Commit:** `c6febdcdde294996e0d30bf5e431440d6f7cf931` (`c6febdc`).
* **Deployment Mechanism:** GitHub Pages configured to serve the root directory (`/`) of branch `main`. Commits pushed to `origin main` deploy live automatically within 60–120 seconds.
* **Technology Stack:**
  * **Markup & UI:** Vanilla HTML5, CSS3, modern JavaScript (ES6+).
  * **Runtime / Framework:** No framework (No React/Vue/Angular), no bundler (No Vite/Webpack), no Node build process.
  * **Package Manager:** None required for production or local development.
  * **External CDN Dependencies:**
    * FontAwesome 6.4.0 (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`)
    * Google Fonts: Assistant font family (weights 300, 400, 600, 700, 800)
    * Google Firebase SDK v10.8.0 (Compat CDN builds):
      * `https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js`
      * `https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js`
      * `https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js`

### 1.3 Repository File Map
| File / Directory | Purpose & Description | Maintenance Rule |
| :--- | :--- | :--- |
| `index.html` | **Authoritative Production Entry Point.** Self-contained standalone single-file bundle containing all HTML markup, CSS styling, and embedded client-side JavaScript. This is what GitHub Pages serves directly. | **Primary target for updates.** Must always be kept functional and standalone. |
| `index_standalone.html` | Exact twin of `index.html`. Used for verification and offline testing. | Synchronize whenever `index.html` changes. |
| `demo.html` | Standalone offline sandbox copy with identical UI. Contains fallback logic for `localStorage` and mock login dialogs when run via `file://`. | Synchronize whenever `index.html` changes. |
| `css/style.css` | Modular source CSS stylesheet (design tokens, calendar grid, TV fullscreen mode rules, Gantt chart, admin forms, duty roster). | Keep in sync with `<style>` block in `index.html`. |
| `js/config.js` | Configuration module exporting `CONFIG` with `SUPER_ADMIN_EMAILS` whitelist and public client `firebaseConfig`. | Contains public Firebase web app client keys. |
| `js/firebase.js` | Modular Firebase initialization for client Firestore and Auth. | ES Module loader for modular scripts. |
| `js/database.js` | Firestore data persistence layer, real-time listeners (`onSnapshot`), `DEFAULT_CALENDAR_BASE`, Hebrew date formatting, Gematria converters, and remote data refresh API. | Mirror changes into `index.html`. |
| `js/auth.js` | Google OAuth authentication handler, session storage sync (`school_user_session`), and local mock fallback. | Mirror changes into `index.html`. |
| `js/calendar.js` | Calendar engine: renders monthly grid and 4-week TV kiosk mode, calculates multi-day spans, dynamic slot heights, and dynamic font scaling. | Mirror changes into `index.html`. |
| `js/gantt.js` | Pedagogical Gantt timeline chart visualization engine. | Mirror changes into `index.html`. |
| `js/admin.js` | Admin console logic: user role & permission editor, CSV calendar upload/export, and PIN-secured database reset. | Mirror changes into `index.html`. |
| `js/app.js` | Main application orchestrator: state management, event listeners, view switching, filter changes, TV kiosk trigger, live clock, and 3-minute silent refresh. | Mirror changes into `index.html`. |
| `assets/logo.jpg` | School emblem image ("ממ\"ד כרמי יהודה"). Displayed in header and TV kiosk view. | Static asset. |
| `data/default_calendar.csv` | Master CSV dataset of Israeli school calendar dates, holidays, and memorial days for 2026–2027. | Updated with 27.10 Election Day. |
| `school_calendar_demo_2026_2027.csv` | Seed demo CSV file for importing events and school schedule. | Updated with 27.10 Election Day. |
| `firebase_app_creation_master_guide.md` | Architectural documentation and post-mortem notes covering Firebase race conditions, security rules, and design choices. | Reference documentation. |

---

## 2. Application Architecture & Behavior

### 2.1 Calendar Views & Navigation
1. **Monthly Calendar Grid (`#calendar-grid-container`):**
   * Standard desktop/tablet view displaying 5–6 weekly rows.
   * Toggle between **Hebrew Month** view (e.g. תשרי, חשוון) and **Gregorian Month** view (e.g. ספטמבר, אוקטובר).
   * Supports navigation arrows (next/prev month) and a "Today" (היום) jump button.
   * Days contain day numbers (primary Hebrew gematria or Gregorian digit), holiday badges, and color-coded event bars.
2. **Pedagogical Gantt Timeline (`#gantt-chart-container`):**
   * Visual horizontal timeline rendering events that span multiple days or weeks.
   * Grouped and filtered by event type and target grades.
   * Clicking an event opens the Event Details modal (`#event-details-modal`).
3. **Staff Room TV Kiosk Mode (`body.fullscreen-mode`):**
   * Automatically triggered when accessed with `?tv`, `?kiosk`, `?fullscreen`, `#tv`, or detected TV User-Agents.
   * **Rolling 4-Week Window:** Shows the current week on row 1, plus 3 forward weeks (Sunday to Friday, 6 days per week; Saturday is omitted to save screen space).
   * **Header:** Displays only the circular school logo, the live ticking clock (`HH:MM:SS`), Hebrew date, Gregorian date, and current month label. School name text is hidden. Return-to-normal button is hidden.
   * **Side Panel (`#tv-side-panel`):** Fixed right sidebar (in RTL) consisting of:
     * **Top Card - Today's Duties (`.tv-duties-card`):** Teachers on duty during school recesses (e.g. הפסקת בוקר, הפסקת צהריים) mapped to locations (שער ראשי, חצר עליונה, etc.).
     * **Bottom Card - Staff Announcements (`.tv-announcements-card`):** Halved footprint (max 20% height, min 60px) for concise messages.
   * **Dynamic Text & Font Sizing Rules:**
     * Multi-line text wrapping (`white-space: normal`, `word-break: break-word`) on event bars and holiday labels.
     * Dynamic slot track height: adapts from `34px` (for 1 slot) down to `19px` (for 5+ slots).
     * Dynamic font size scaling: scales down to `0.52rem–0.60rem` if titles exceed 20 characters or slots exceed 3.
   * **Seamless Silent Background Refresh:**
     * Runs every 3 minutes (`3 * 60 * 1000`).
     * Silently fetches updated events, base calendar dates, and duty rosters directly from Firestore (`source: 'server'`).
     * Re-renders the DOM in memory with zero page flicker, no white screen, and no browser reload.

### 2.2 Event Management & Validation
* **Creation / Editing Modal (`#event-modal`):**
  * **ID:** Auto-generated `evt-<timestamp>-<rand>` upon creation; existing ID preserved on update.
  * **Title:** Required. Trimmed string.
  * **Start Date (`startDate`):** Required. Format `YYYY-MM-DD`.
  * **End Date (`endDate`):** Required. Format `YYYY-MM-DD`. Must be greater than or equal to Start Date.
  * **Event Type (`eventType`):** Required. One of:
    * `צוותי` (Staff - Blue)
    * `מנהלתי` (Admin - Amber)
    * `חברתי` (Social - Pink)
    * `פדגוגי` (Academic - Green)
    * `טיול` (Field Trip - Teal)
    * `אחר` (Other - Purple)
  * **Target Grades (`targetGrades`):** Array of grade strings (`'א'`, `'ב'`, `'ג'`, `'ד'`, `'ה'`, `'ו'`). Conditionally displayed for `חברתי` and `טיול`.
  * **Description (`description`):** Optional free text.
  * **Created By (`createdBy`):** User email recorded automatically on creation.

### 2.3 Authentication & Role-Based Permissions (RBAC)

#### User Roles & Enforcement Matrix
| Role | Stored As | Read Calendar & Events | Create Events | Edit / Delete Own Events | Edit / Delete ANY Event | Manage User Permissions | Edit Duty Roster | Reset Database (PIN) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Guest / Public** | Unauthenticated | Yes | No | No | No | No | No | No |
| **Unauthorized User** | `isAuthorized: false` | Yes | No | No | No | No | No | No |
| **Teacher (Authorized)**| `role: 'Teacher'`, `isAuthorized: true` | Yes | Yes | Yes | No | No | No | No |
| **Admin** | `role: 'Admin'`, `isAuthorized: true` | Yes | Yes | Yes | Yes | Yes | Yes | Yes (`1948`) |
| **Super-Admin** | Email whitelist in `CONFIG` | Yes | Yes | Yes | Yes | Yes | Yes | Yes (`1948`) |

#### Super-Admin Email Whitelist
* Hardcoded in `js/config.js` and `index.html`: `CONFIG.SUPER_ADMIN_EMAILS = ['nros1978@gmail.com']`.
* On login, if the authenticated user's email matches the whitelist, the application automatically ensures the user has `{ isAuthorized: true, role: 'Admin' }` in Firestore.

#### Storage & Session Management
* Active session stored in `sessionStorage` under key `school_user_session`.
* Format: `{ email, isAuthorized, role, name, picture }`.
* Cleared on sign-out.

---

## 3. Firebase & Backend Services

### 3.1 Services Used
* **Firebase Authentication:** Google OAuth (`GoogleAuthProvider`).
* **Cloud Firestore:** Real-time document database.
* **Firebase Hosting / Functions / Storage:** Not currently used.

### 3.2 Firebase Client Configuration
Located in `js/config.js` and inlined in `index.html`:
```javascript
export const CONFIG = {
  SUPER_ADMIN_EMAILS: ['nros1978@gmail.com'],
  firebaseConfig: {
    apiKey: "AIzaSyCMkvGm1zzd0-PfuPRTfcQmV-Obj0-tInc",
    authDomain: "school-calendar-gantt.firebaseapp.com",
    projectId: "school-calendar-gantt",
    storageBucket: "school-calendar-gantt.firebasestorage.app",
    messagingSenderId: "1010871244552",
    appId: "1:1010871244552:web:6ea059155e1eb142d0febd"
  }
};
```

### 3.3 Firestore Database Schema

#### 1. Collection: `users`
* **Document ID:** Lowercase user email (e.g. `nros1978@gmail.com`, `teacher@school.org`).
* **Fields:**
  * `email` *(string)*: Lowercase user email.
  * `isAuthorized` *(boolean)*: Whether the user is permitted to create/edit content.
  * `role` *(string)*: `'Admin'` or `'Teacher'`.

#### 2. Collection: `events`
* **Document ID:** `evt-<timestamp>-<random>` (e.g. `evt-1729000000000-432`).
* **Fields:**
  * `id` *(string)*: Same as document ID.
  * `title` *(string)*: Event title.
  * `startDate` *(string)*: Format `YYYY-MM-DD`.
  * `endDate` *(string)*: Format `YYYY-MM-DD`.
  * `eventType` *(string)*: `'צוותי'` | `'מנהלתי'` | `'חברתי'` | `'פדגוגי'` | `'טיול'` | `'אחר'`.
  * `targetGrades` *(array of strings)*: e.g. `['ד', 'ה']` or empty.
  * `createdBy` *(string)*: Email of creator.
  * `description` *(string)*: Event description.

#### 3. Collection: `calendar_base`
* **Document ID:** Date key `YYYY-MM-DD` (e.g. `2026-10-27`).
* **Fields:**
  * `date` *(string)*: `YYYY-MM-DD`.
  * `hebrewDate` *(string)*: Hebrew formatted date string (e.g. `ט"ז בחשוון תשפ"ז`).
  * `status` *(string)*: `'Holiday'` | `'Special Day'` | `'Regular'`.
  * `description` *(string)*: Holiday or event description (e.g. `יום הבחירות`, `יום הזיכרון ליצחק רבין`).

#### 4. Document: `settings/duty_roster`
* **Fields:**
  * `announcements` *(string)*: Markdown or plaintext announcements for the staff TV panel.
  * `locations` *(array of strings)*: School duty locations (e.g. `['שער ראשי', 'חצר עליונה', 'חצר תחתונה', 'מסדרון קומה א\'']`).
  * `duties` *(map/object)*: Keyed by Hebrew day index `'0'` (Sunday) to `'5'` (Friday). Each key contains an array of recess objects:
    ```json
    [
      {
        "name": "הפסקה ראשונה (10:00 - 10:30)",
        "duties": [
          { "location": "שער ראשי", "teacher": "ישראל ישראלי" },
          { "location": "חצר עליונה", "teacher": "שרה כהן" }
        ]
      }
    ]
    ```

### 3.4 Firestore Security Rules
The rules configured in Firebase Console must match:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSuperAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'nros1978@gmail.com' ||
        request.auth.token.email == 'admin@school.org'
      );
    }
    
    function isAuthorizedAdmin() {
      return isSuperAdmin() || (
        request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'Admin' &&
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.isAuthorized == true
      );
    }
    
    match /users/{userEmail} {
      allow read: if request.auth != null;
      allow write: if isAuthorizedAdmin() || (request.auth != null && request.auth.token.email == userEmail);
    }
    
    match /events/{eventId} {
      allow read: if true;
      allow create, update, delete: if isAuthorizedAdmin() || (
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.isAuthorized == true
      );
    }
    
    match /calendar_base/{docId} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }

    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }
  }
}
```

---

## 4. Local Development & Deployment

### 4.1 Running Locally
Since this is a pure client-side web application, no dependencies need to be installed.

#### Option A: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8000
```
Or using Node `npx serve`:
```bash
npx serve .
```
Open: `http://localhost:8000/index.html` or `http://localhost:8000/?tv`

#### Option B: Direct File Inspection (`file://`)
Open `index.html` or `demo.html` directly in any web browser. When running via `file://`, Firebase popup authentication is bypassed with an interactive mock login dialog allowing instant testing as Super-Admin (`nros1978@gmail.com`) or Teacher (`teacher@school.org`).

### 4.2 Building the Project
* **Build step:** None. The files are deployed directly as plain static files.
* **Synchronization rule:** When making code edits, update `css/style.css`, `js/calendar.js`, `js/database.js`, etc., and **always synchronize changes into `index.html`**, `demo.html`, and `index_standalone.html`.

### 4.3 Deployment Process
1. Test your changes locally or in browser preview.
2. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of update"
   ```
3. Push to `main`:
   ```bash
   git push origin main
   ```
4. GitHub Pages will detect the push to `main` and deploy the changes to `https://nros1978-png.github.io/school-calendar/` automatically within 1–2 minutes.
5. Verify in browser with a hard refresh (`Ctrl + F5` / `Cmd + Shift + R`).

### 4.4 Rollback Procedure
If a production issue occurs:
```bash
git log -n 5 --oneline
git revert HEAD
git push origin main
```
GitHub Pages will automatically deploy the reverted commit.

---

## 5. Access Handover & External Permissions

For Codex or a new developer to maintain the production systems, the owner must provide/grant access to:

1. **GitHub Repository:**
   * Repository: `https://github.com/nros1978-png/school-calendar`
   * Access Required: **Write / Collaborator** to push commits to branch `main`.
   * Action for Owner: In GitHub repo ➔ **Settings ➔ Collaborators ➔ Add people** ➔ enter the developer/agent's GitHub username.
2. **Firebase Console:**
   * Project ID: `school-calendar-gantt`
   * Access Required: **Editor** or **Owner**.
   * Purpose: To view Firestore data, adjust Security Rules, or manage Authorized Domains under Authentication.
   * Action for Owner: In [Firebase Console](https://console.firebase.google.com/) ➔ Select `school-calendar-gantt` ➔ **Project settings ➔ Users and permissions ➔ Add member** ➔ enter developer's Google email ➔ assign role **Editor**.
3. **No Private Machine Dependencies:**
   * There are no private environment files, no local proxies, and no external private npm packages. The application is 100% self-contained in the repository.

---

## 6. Known Maintenance Notes & Future Recommendations

1. **Standalone Bundling Pattern:**
   * Currently, GitHub Pages serves `index.html`, which has inlined styles and scripts for bulletproof loading. Whenever a change is made to modular files in `js/` or `css/`, ensure `index.html` is updated accordingly.
2. **Admin PIN:**
   * The database reset PIN (`1948`) is currently evaluated client-side in `Admin.setupResetAction()`. While sufficient for school staff use, if higher security is needed in the future, this can be moved to a Cloud Function or verified against a secured document in Firestore.
3. **Firestore Document Keys:**
   * Always normalize emails with `.trim().toLowerCase()` when creating or reading user documents to avoid case-sensitivity bugs.

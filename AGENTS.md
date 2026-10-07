# AGENTS.md: Developer & Agent Guide for School Calendar & Gantt

> **Audience:** OpenAI Codex, autonomous coding agents, and maintenance engineers.  
> **Repository:** `https://github.com/nros1978-png/school-calendar`  
> **Primary Language:** Hebrew UI (RTL) / JavaScript ES6+ (No Framework)  

---

## 1. Golden Rules for this Repository

1. **NO BUILD STEP & NO FRAMEWORK MIGRATION:**
   - Do NOT attempt to install React, Vue, Vite, Webpack, TypeScript, or npm packages unless explicitly instructed by the user.
   - The application is intentionally a zero-dependency, vanilla ES6+ static site that GitHub Pages can host directly.

2. **THE THREE-FILE SYNCHRONIZATION RULE (CRITICAL):**
   - GitHub Pages serves `index.html`.
   - `index.html`, `demo.html`, and `index_standalone.html` are identical standalone copies that contain all HTML, CSS, and JS inlined.
   - The repository also maintains modular files (`css/style.css`, `js/calendar.js`, `js/database.js`, `js/app.js`, `js/auth.js`, `js/admin.js`, `js/gantt.js`).
   - **Whenever you make changes to logic or styles, update BOTH the modular files AND the standalone HTML files (`index.html`, `demo.html`, `index_standalone.html`).**

3. **HEBREW RTL & LOCALIZATION INTEGRITY:**
   - The root document is `dir="rtl"`, Hebrew language (`lang="he"`).
   - Never remove `direction: rtl` or change table/grid ordering without understanding RTL flex/grid behavior (Sunday is column 1 on the right).
   - In TV mode, Saturday (שבת) is intentionally hidden, yielding a 6-day week (Sunday to Friday).
   - Email input fields and monospace identifiers must always use `direction: ltr !important; text-align: right; unicode-bidi: embed;` to prevent Hebrew BiDi reversal bugs.

4. **FIREBASE RACE CONDITION PRECAUTION:**
   - Never rely on asynchronous snapshot arrays (`cachedUsers`) inside `auth.onAuthStateChanged`.
   - Always query Firestore directly via `await db.collection('users').doc(cleanEmail).get()` during login.
   - Always sanitize emails with `.trim().toLowerCase()`.
   - Preserved Super-Admin whitelist: `CONFIG.SUPER_ADMIN_EMAILS = ['nros1978@gmail.com']`.

5. **TELEVISION KIOSK DISPLAY RULES:**
   - Triggered via `?tv`, `?kiosk`, `?fullscreen`, or stored `'tv_mode' === 'true'`.
   - The header displays ONLY the circular logo (`assets/logo.jpg`), the live clock/date widget, and the month title. School name text is hidden.
   - The "חזרה לתצוגה רגילה" button is hidden in TV mode (`display: none`).
   - Side panel: Top is Today's Duties (`.tv-duties-card`), bottom is Announcements (`.tv-announcements-card` with max-height 20% / min-height 60px).
   - Event bars and holiday labels must allow multi-line text wrapping (`white-space: normal`, `word-break: break-word`).
   - Auto-refresh: Must remain a silent in-memory refresh every 3 minutes (`3 * 60 * 1000`) without full page reload or screen blink.

---

## 2. Key File Locations

* **Entry Point (Production):** `index.html`
* **Configuration & Keys:** `js/config.js`
* **Database & Persistence:** `js/database.js`
* **Calendar Engine & TV Slots:** `js/calendar.js`
* **App Orchestrator & Timers:** `js/app.js`
* **Auth & User Roles:** `js/auth.js`
* **Admin Console:** `js/admin.js`
* **Stylesheets:** `css/style.css`
* **School Calendar CSV:** `data/default_calendar.csv`

---

## 3. Local Development Commands

To run a quick local HTTP preview without installing any dependencies:

```bash
# Using Python
python -m http.server 8000

# Or using Node
npx serve .
```

Open in browser:
* Standard view: `http://localhost:8000/index.html`
* TV Kiosk view: `http://localhost:8000/index.html?tv`
* Offline Sandbox: `http://localhost:8000/demo.html`

---

## 4. Verification Checklist Before Committing

Before creating a commit:
1. Ensure `index.html`, `demo.html`, and `index_standalone.html` are identical in hash/content.
2. Verify that no console errors appear when opening `index.html`.
3. Test standard view (month navigation, Gantt tab, Event modal).
4. Test TV view (`?tv`):
   - School name text is absent; circular logo is present.
   - "חזרה לתצוגה רגילה" button is absent.
   - Announcements panel is compact (half-height).
   - Long event titles and holiday labels wrap cleanly without clipping.
   - Live clock ticks every second.
5. Verify 2026-10-27 is present as a Holiday ("יום הבחירות").

---

## 5. Deployment

```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```
GitHub Pages will automatically build and deploy within 1–2 minutes.

# Manual Verification Checklist (מדריך בדיקה ידנית)

> **Application:** School Calendar & Gantt Application (`school-calendar`)  
> **Production URL:** [https://nros1978-png.github.io/school-calendar/](https://nros1978-png.github.io/school-calendar/)  
> **Local Test URL:** `http://localhost:8000/index.html` or `file:///.../index.html`  

Since this project has no automated unit or integration tests, follow this checklist to manually verify application health and functionality before pushing any changes.

---

## 1. Calendar View & Basic Navigation
- [ ] **Initial Page Load:** Open `index.html`. Verify that the page loads without any JavaScript errors in the browser console (`F12 ➔ Console`).
- [ ] **Month Header:** Verify that the header shows the current Hebrew and Gregorian month range (e.g. `תשרי - חשוון תשפ"ז`).
- [ ] **Navigation Controls:**
  - [ ] Click the forward arrow (`<`). Verify that the calendar moves to the next month.
  - [ ] Click the backward arrow (`>`). Verify that the calendar moves to the previous month.
  - [ ] Click **היום (Today)**. Verify that the calendar jumps back to the current day.
- [ ] **Calendar Mode Toggle:** Click **חודש עברי / חודש לועזי**. Verify that the grid toggles smoothly between Hebrew month boundaries and Gregorian month boundaries.
- [ ] **Hebrew Dates & Gematria:** Verify that day cells display Hebrew day numbers correctly (א', ב', ... ט"ו, ט"ז, ... כ"ט, ל').
- [ ] **Holidays & Special Days:**
  - [ ] Verify that Israeli school holidays appear in red badges (e.g. ראש השנה, סוכות, חנוכה, פסח).
  - [ ] Verify that Rosh Chodesh appears as a "Special Day" badge on the 1st of Hebrew months.
  - [ ] **Specific Requirement Check:** Navigate to **27.10.2026** (ט"ז בחשוון תשפ"ז). Verify that it displays a **Holiday** badge with the text **יום הבחירות**.

---

## 2. Event Operations (CRUD)
- [ ] **Modal Trigger:** Click **+ אירוע חדש** (or click directly on any date cell).
  - [ ] If logged out or unauthorized: verify an alert notifies the user that only authorized teachers/admins can create events.
  - [ ] If logged in as an authorized user: verify the modal opens with empty/pre-filled date fields.
- [ ] **Form Validation:**
  - [ ] Submit an empty form. Verify that required fields (Title, Start Date, End Date, Event Type) trigger validation warnings.
  - [ ] Set End Date earlier than Start Date. Verify that an error message prevents submission.
- [ ] **Create Event:** Fill in a test event (Title: "אירוע בדיקה", Type: "פדגוגי"). Submit the form.
  - [ ] Verify that the modal closes.
  - [ ] Verify that the event bar appears immediately in the calendar grid.
  - [ ] Verify that the event bar color matches the event type color (e.g. Academic = Green).
- [ ] **View Event Details:** Click on the newly created event bar.
  - [ ] Verify that `#event-details-modal` opens with accurate title, dates, type, description, and author email.
- [ ] **Delete Event:**
  - [ ] Click the **מחק (Delete)** button in the details modal.
  - [ ] Verify that a confirmation prompt appears.
  - [ ] Confirm deletion. Verify that the event is removed from the calendar grid and Firestore.

---

## 3. Gantt Chart View
- [ ] **Tab Switch:** Click the **תרשים גאנט (Gantt Chart)** button in the header.
  - [ ] Verify that the calendar grid hides and the Gantt timeline appears.
- [ ] **Event Bars:** Verify that multi-day events span across their corresponding dates on the horizontal timeline.
- [ ] **Filters:**
  - [ ] Filter by Event Type (e.g. "טיול"). Verify that only field trip events remain visible.
  - [ ] Filter by Grade (e.g. "ו'"). Verify that only grade 6 events remain visible.
  - [ ] Reset filters to "הכל" (All). Verify all events return.

---

## 4. Authentication & Role Permissions
- [ ] **Sign-In Flow:**
  - [ ] In production: click **התחברות (Google Sign-In)**. Complete the Google popup authentication.
  - [ ] In local `file://` mode: verify that the mock prompt opens, enter `nros1978@gmail.com` to test as Super-Admin.
- [ ] **User State:**
  - [ ] Verify that the user avatar / name appears in the header.
  - [ ] Verify that the role badge displays the correct role (מנהל / מורה / אורח).
- [ ] **Admin Console (Admins only):**
  - [ ] Verify that the **ניהול משתמשים (User Management)** button is visible ONLY to Admins.
  - [ ] Click the button to open Admin Console.
  - [ ] Verify that the user table lists registered accounts.
  - [ ] Toggle authorization switch on/off for a test user. Verify immediate persistence in Firestore.
  - [ ] Change user role between "מורה" and "מנהל".
  - [ ] Verify that self-demotion is disabled (current admin cannot uncheck their own authorization).
- [ ] **Sign-Out Flow:**
  - [ ] Click **התנתק (Sign Out)**.
  - [ ] Verify that the session clears, the avatar disappears, and editing permissions are revoked.

---

## 5. Television Kiosk Mode (מסך טלוויזיה / מסך מלא)
- [ ] **Activation:**
  - [ ] Navigate to URL with query parameter: `index.html?tv`.
  - [ ] Or click the TV button: `#cal-fullscreen-btn`.
- [ ] **Header Inspection:**
  - [ ] Verify that the school name text ("ממ\"ד כרמי יהודה", "ע\"ש הרב יהודה עמיטל") is **HIDDEN**.
  - [ ] Verify that the circular school logo (`assets/logo.jpg`) is **VISIBLE**.
  - [ ] Verify that the "חזרה לתצוגה רגילה" button is **HIDDEN**.
  - [ ] Verify that the live clock widget ticks every second (`HH:MM:SS`) and shows day name, Hebrew date, and Gregorian date.
- [ ] **Calendar Grid (6 Columns, 4 Weeks):**
  - [ ] Verify that Saturday (שבת) is omitted; days run Sunday (ראשון) to Friday (שישי).
  - [ ] Verify that exactly 4 weekly rows are displayed (current week at top + 3 weeks forward).
- [ ] **Text Wrapping & Dynamic Font Sizing:**
  - [ ] Inspect cells with long titles (e.g. `טקס יום הזיכרון לחללי מלחמת חרבות ברזל`).
  - [ ] Verify that the text wraps to 2 lines (`white-space: normal`, `word-break: break-word`) instead of cutting off with `...`.
  - [ ] Inspect cells with multiple events (3–4 events). Verify that font size scales down automatically so all events fit inside the cell.
- [ ] **Side Panel (לוח תורנויות והודעות):**
  - [ ] Right sidebar is visible.
  - [ ] **Today's Duties Card (Top):** Displays active duties grouped by recesses (הפסקת בוקר, etc.) and locations.
  - [ ] **Staff Announcements Card (Bottom):** Halved footprint (max 20% height, min 60px). Text is visible or empty state ("אין הודעות כרגע") displays cleanly without taking excess space.
- [ ] **3-Minute Silent Refresh:**
  - [ ] In browser dev tools console, monitor network requests over 3 minutes.
  - [ ] Verify that `DB.refreshFromRemote()` executes silently every 3 minutes (`180,000 ms`).
  - [ ] Verify that the screen updates without reloading the entire page and without any white flash or blink.

---

## 6. Deployment Verification (GitHub Pages)
- [ ] After pushing changes to `origin main`:
  - [ ] Wait 1–2 minutes for GitHub Pages to complete publishing.
  - [ ] Open [https://nros1978-png.github.io/school-calendar/](https://nros1978-png.github.io/school-calendar/).
  - [ ] Perform a hard refresh (`Ctrl + F5` or `Cmd + Shift + R`).
  - [ ] Open Developer Tools Console (`F12`). Verify zero 404 or MIME-type errors.
  - [ ] Test TV mode on the live site: [https://nros1978-png.github.io/school-calendar/?tv](https://nros1978-png.github.io/school-calendar/?tv).

## 7. Phone / TV layout regression checks (October 2026)
- [ ] At 360px and 390px phone widths, the complete calendar grid is visible by scrolling; the selected day's event list remains interactive.
- [ ] Tap an event card and close its details dialog. Verify the dialog fits the screen and sits above navigation.
- [ ] Open ?tv on a phone, including landscape orientation. Verify normal phone layout and no fullscreen button, even with previously stored tv_mode=true.
- [ ] At 1280x720 and 1920x1080 TV sizes, verify the sidebar is 155px wide (previously 310px).
- [ ] Verify long event titles and Rosh Chodesh / holiday labels remain visible together, including days containing multiple events.
- [ ] Resize the screen and verify text fits again. Verify loading the Assistant font does not introduce clipping.
- [ ] Verify automatic kiosk detection on the actual school TV. Native browser fullscreen may still require a user gesture; kiosk layout must activate immediately.
- [ ] Verify silent remote refresh remains scheduled every 180,000ms without a page reload.


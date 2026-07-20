// Admin Console Module for School Calendar & Gantt Application
// Manages User Roles, Permissions, CSV uploads, and PIN-secured resets.

import { DB } from './database.js';

const ADMIN_PIN = '1948'; // Pre-configured Admin PIN (Year of Israel's independence)

export const Admin = {
  /**
   * Initializes Admin Console event listeners and view bindings
   */
  init(onDatabaseResetCallback) {
    this.onDatabaseReset = onDatabaseResetCallback;
    this.setupUserForm();
    this.setupCsvUpload();
    this.setupResetAction();
    this.setupTemplateDownload();
  },

  /**
   * Renders the user list table in the Admin Console
   */
  renderUserTable() {
    const tableBody = document.getElementById('admin-users-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const users = DB.getUsers();

    users.forEach(user => {
      const row = document.createElement('tr');

      // Email
      const emailCell = document.createElement('td');
      emailCell.textContent = user.email;
      row.appendChild(emailCell);

      // IsAuthorized Toggle
      const authCell = document.createElement('td');
      const switchLabel = document.createElement('label');
      switchLabel.className = 'switch-control';
      
      const switchInput = document.createElement('input');
      switchInput.type = 'checkbox';
      switchInput.checked = user.isAuthorized;
      
      // Prevent self-revocation of active admin session
      const currentUser = JSON.parse(sessionStorage.getItem('school_user_session') || '{}');
      const isSelf = currentUser.email && currentUser.email.toLowerCase() === user.email.toLowerCase();
      if (isSelf) {
        switchInput.disabled = true;
      }

      switchInput.addEventListener('change', (e) => {
        DB.updateUser(user.email, { isAuthorized: e.target.checked });
        // If updating self (though disabled, general sanity check)
        if (isSelf) {
          currentUser.isAuthorized = e.target.checked;
          sessionStorage.setItem('school_user_session', JSON.stringify(currentUser));
        }
      });

      const switchSlider = document.createElement('span');
      switchSlider.className = 'switch-slider';
      
      switchLabel.appendChild(switchInput);
      switchLabel.appendChild(switchSlider);
      authCell.appendChild(switchLabel);
      row.appendChild(authCell);

      // Role Select Dropdown
      const roleCell = document.createElement('td');
      const roleSelect = document.createElement('select');
      roleSelect.className = 'form-select';
      roleSelect.style.padding = '4px 28px 4px 8px';
      
      const teacherOpt = document.createElement('option');
      teacherOpt.value = 'Teacher';
      teacherOpt.textContent = 'מורה';
      teacherOpt.selected = user.role === 'Teacher';
      
      const adminOpt = document.createElement('option');
      adminOpt.value = 'Admin';
      adminOpt.textContent = 'מנהל';
      adminOpt.selected = user.role === 'Admin';

      roleSelect.appendChild(teacherOpt);
      roleSelect.appendChild(adminOpt);

      if (isSelf) {
        roleSelect.disabled = true; // Prevent changing own role to lock out admin
      }

      roleSelect.addEventListener('change', (e) => {
        DB.updateUser(user.email, { role: e.target.value });
      });

      roleCell.appendChild(roleSelect);
      row.appendChild(roleCell);

      // Delete action button
      const actionsCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.style.padding = '4px 8px';
      deleteBtn.style.fontSize = '0.8rem';
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      
      if (isSelf) {
        deleteBtn.disabled = true;
        deleteBtn.title = 'לא ניתן למחוק את החשבון המחובר';
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.cursor = 'not-allowed';
      } else {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${user.email}?`)) {
            DB.removeUser(user.email);
            this.renderUserTable();
          }
        });
      }

      actionsCell.appendChild(deleteBtn);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  },

  /**
   * Sets up user creation form submit listener
   */
  setupUserForm() {
    const form = document.getElementById('admin-add-user-form');
    if (!form) return;

    // Remove existing event listener if any (clean rebind)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('admin-user-email');
      const authInput = document.getElementById('admin-user-authorized');
      const roleInput = document.getElementById('admin-user-role');
      
      const email = emailInput.value.trim();
      const isAuth = authInput.checked;
      const role = roleInput.value;

      if (!email) return;

      try {
        await DB.addUser(email, isAuth, role);
        emailInput.value = '';
        authInput.checked = false;
        roleInput.value = 'Teacher';
        this.renderUserTable();
      } catch (err) {
        alert("שגיאה בהוספת המשתמש: " + err.message);
      }
    });
  },

  /**
   * Sets up file reader for CSV upload
   */
  setupCsvUpload() {
    const fileInput = document.getElementById('csv-file-input');
    const uploadZone = document.getElementById('csv-upload-zone');
    if (!fileInput || !uploadZone) return;

    // Trigger click on file input when clicking drag-and-drop zone
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle drag and drop visuals
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
      }, false);
    });

    // Handle drop event
    uploadZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) {
        fileInput.files = files;
        this.handleCsvFile(files[0]);
      }
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
      if (fileInput.files.length) {
        this.handleCsvFile(fileInput.files[0]);
      }
    });
  },

  /**
   * Parses the uploaded CSV file and replaces Calendar_Base in DB
   */
  handleCsvFile(file) {
    if (!file.name.endsWith('.csv')) {
      alert('נא להעלות קובץ בפורמט CSV בלבד.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      
      // Auto-detect Hebrew Windows-1255 encoding if replacement characters are present
      if (text.includes('\ufffd') || text.includes('')) {
        const reReader = new FileReader();
        reReader.onload = (e2) => {
          this.processCsvText(e2.target.result);
        };
        reReader.readAsText(file, 'windows-1255');
      } else {
        this.processCsvText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  },

  processCsvText(text) {
    const parsedData = this.parseCSV(text);
    if (parsedData.success && parsedData.data.length > 0) {
      DB.saveCalendarBase(parsedData.data);
      alert(`הקובץ נטען בהצלחה! ${parsedData.data.length} ימים עודכנו בלוח הבסיס.`);
      if (this.onDatabaseReset) {
        this.onDatabaseReset(); // Refresh calendar view
      }
    } else {
      alert('טעינת הקובץ נכשלה: ' + (parsedData.error || 'קובץ ריק או לא תקין.'));
    }
  },

  /**
   * Helper that parses CSV text to JSON with structural validation
   */
  parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, error: 'הקובץ אינו מכיל שורות נתונים.' };
    }

    // Detect separator (comma or semicolon)
    let separator = ',';
    if (lines[0].includes(';')) {
      separator = ';';
    }

    // Parse header: Date,HebrewDate,Status,Description
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
    
    // Check if headers contain Date and HebrewDate (minimum requirement)
    const dateIdx = headers.indexOf('date');
    const hebrewIdx = headers.indexOf('hebrewdate');
    const statusIdx = headers.indexOf('status');
    const descIdx = headers.indexOf('description');
    
    if (dateIdx === -1 || hebrewIdx === -1) {
      return { success: false, error: 'עמודות הכותרת לא תואמות. הקובץ חייב להכיל לפחות: Date, HebrewDate' };
    }

    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip empty rows

      const columns = this.csvLineSplit(line, separator);
      if (columns.length < 2) continue; // skip broken rows

      const dateVal = columns[dateIdx]?.trim();
      const hebrewVal = columns[hebrewIdx]?.trim() || '';
      const statusVal = statusIdx !== -1 ? columns[statusIdx]?.trim() : '';
      const descVal = descIdx !== -1 ? columns[descIdx]?.trim() : '';

      // Standardize Date (allows DD/MM/YYYY, YYYY-MM-DD, etc.)
      const standardizedDate = standardizeDate(dateVal);
      if (!standardizedDate) {
        return { success: false, error: `שגיאה בשורה ${i+1}: פורמט התאריך (${dateVal}) אינו תקין. יש להשתמש ב-DD/MM/YYYY או YYYY-MM-DD.` };
      }

      // Parse and normalize status (accepts empty, Hebrew, or English status words)
      const parsedStatus = parseStatus(statusVal, descVal);

      result.push({
        date: standardizedDate,
        hebrewDate: hebrewVal,
        status: parsedStatus,
        description: descVal
      });
    }

    return { success: true, data: result };
  },

  /**
   * Helper that splits a CSV line, respecting double quotes and dynamic separators
   */
  csvLineSplit(line, separator = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    // Clean outer quotes from values and normalize nested double quotes
    return result.map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  },

  /**
   * Sets up New School Year Reset Action Button & Modals
   */
  setupResetAction() {
    const resetBtn = document.getElementById('admin-reset-db-btn');
    const pinOverlay = document.getElementById('pin-overlay');
    const pinClose = document.getElementById('pin-close');
    const pinCancel = document.getElementById('pin-cancel');
    const pinForm = document.getElementById('pin-form');
    const pinInput = document.getElementById('admin-pin-input');

    if (!resetBtn || !pinOverlay || !pinForm || !pinInput) return;

    resetBtn.addEventListener('click', () => {
      // Clear old state and open pin verification modal
      pinInput.value = '';
      pinOverlay.classList.add('active');
      pinInput.focus();
    });

    const closeModal = () => {
      pinOverlay.classList.remove('active');
    };

    if (pinClose) pinClose.addEventListener('click', closeModal);
    if (pinCancel) pinCancel.addEventListener('click', closeModal);

    // Form submit verification
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value.trim();

      if (enteredPin === ADMIN_PIN) {
        // Execute deletion
        DB.clearEvents();
        DB.clearCalendarBase();
        
        alert('אתחול שנת הלימודים בוצע בהצלחה. לוח האירועים ולוח הבסיס נמחקו.');
        closeModal();
        
        if (this.onDatabaseReset) {
          this.onDatabaseReset(); // Refresh calendar view
        }
      } else {
        alert('PIN אבטחה שגוי! פעולת המחיקה נדחתה.');
        closeModal();
      }
    });
  },

  /**
   * Sets up Download Template button to download the demo school year CSV
   */
  setupTemplateDownload() {
    const dlBtn = document.getElementById('admin-download-template');
    if (!dlBtn) return;
    dlBtn.addEventListener('click', () => {
      const csvContent = "Date,HebrewDate,Status,Description\n" +
        "2026-09-01,י\"ט באלול תשפ\"ו,Regular,פתיחת שנת הלימודים תשפ\"ז\n" +
        "2026-09-11,כ\"ט באלול תשפ\"ו,Holiday,ערב ראש השנה\n" +
        "2026-09-12,א' בתשרי תשפ\"ז,Holiday,ראש השנה - יום א'\n" +
        "2026-09-13,ב' בתשרי תשפ\"ז,Holiday,ראש השנה - יום ב'\n" +
        "2026-09-14,ג' בתשרי תשפ\"ז,Special Day,צום גדליה\n" +
        "2026-09-20,ט' בתשרי תשפ\"ז,Holiday,ערב יום כיפור\n" +
        "2026-09-21,י' בתשרי תשפ\"ז,Holiday,יום כיפור\n" +
        "2026-09-25,י\"ד בתשרי תשפ\"ז,Holiday,ערב סוכות\n" +
        "2026-09-26,ט\"ו בתשרי תשפ\"ז,Holiday,חג סוכות\n" +
        "2026-09-27,ט\"ז בתשרי תשפ\"ז,Holiday,חול המועד סוכות\n" +
        "2026-09-28,י\"ז בתשרי תשפ\"ז,Holiday,חול המועד סוכות\n" +
        "2026-09-29,י\"ח בתשרי תשפ\"ז,Holiday,חול המועד סוכות\n" +
        "2026-09-30,י\"ט בתשרי תשפ\"ז,Holiday,חול המועד סוכות\n" +
        "2026-10-01,כ' בתשרי תשפ\"ז,Holiday,חול המועד סוכות\n" +
        "2026-10-02,כ\"א בתשרי תשפ\"ז,Holiday,הושענא רבה / ערב שמחת תורה\n" +
        "2026-10-03,כ\"ב בתשרי תשפ\"ז,Holiday,שמיני עצרת / שמחת תורה\n" +
        "2026-10-04,כ\"ג בתשרי תשפ\"ז,Holiday,אסרו חג סוכות\n" +
        "2026-10-23,י\"ב בחשוון תשפ\"ז,Special Day,יום הזיכרון ליצחק רבין\n" +
        "2026-12-04,כ\"ה בכסלו תשפ\"ז,Holiday,חנוכה - נר ראשון\n" +
        "2026-12-05,כ\"ו בכסלו תשפ\"ז,Holiday,חנוכה - יום א'\n" +
        "2026-12-06,כ\"ז בכסלו תשפ\"ז,Holiday,חנוכה - יום ב'\n" +
        "2026-12-07,כ\"ח בכסלו תשפ\"ז,Holiday,חנוכה - יום ג'\n" +
        "2026-12-08,כ\"ט בכסלו תשפ\"ז,Holiday,חנוכה - יום ד'\n" +
        "2026-12-09,א' בטבת תשפ\"ז,Holiday,חנוכה - יום ה'\n" +
        "2026-12-10,ב' בטבת תשפ\"ז,Holiday,חנוכה - יום ו'\n" +
        "2026-12-11,ג' בטבת תשפ\"ז,Holiday,חנוכה - יום ז'\n" +
        "2026-12-12,ד' בטבת תשפ\"ז,Holiday,אסרו חג חנוכה\n" +
        "2026-12-20,י\"א בטבת תשפ\"ז,Special Day,צום עשרה בטבת\n" +
        "2027-01-25,י\"ז בשבט תשפ\"ז,Regular,יום השפה העברית\n" +
        "2027-02-02,כ\"ה בשבט תשפ\"ז,Special Day,ט\"ו בשבט - חג האילנות\n" +
        "2027-03-21,י\"ב באדר ב' תשפ\"ז,Holiday,תענית אסתר / פורים שני\n" +
        "2027-03-22,י\"ג באדר ב' תשפ\"ז,Holiday,חג פורים\n" +
        "2027-03-23,י\"ד באדר ב' תשפ\"ז,Holiday,שושן פורים\n" +
        "2027-04-14,ז' בניסן תשפ\"ז,Holiday,חופשת פסח - יום א'\n" +
        "2027-04-15,ח' בניסן תשפ\"ז,Holiday,חופשת פסח - יום ב'\n" +
        "2027-04-16,ט' בניסן תשפ\"ז,Holiday,חופשת פסח - יום ג'\n" +
        "2027-04-17,י' בניסן תשפ\"ז,Holiday,חופשת פסח - יום ד'\n" +
        "2027-04-18,י\"א בניסן תשפ\"ז,Holiday,חופשת פסח - יום ה'\n" +
        "2027-04-19,י\"ב בניסן תשפ\"ז,Holiday,חופשת פסח - יום ו'\n" +
        "2027-04-20,י\"ג בניסן תשפ\"ז,Holiday,ערב פסח\n" +
        "2027-04-21,י\"ד בניסן תשפ\"ז,Holiday,פסח - יום א' (חג ראשון)\n" +
        "2027-04-22,ט\"ו בניסן תשפ\"ז,Holiday,חול המועד פסח\n" +
        "2027-04-23,ט\"ו בניסן תשפ\"ז,Holiday,חול המועד פסח\n" +
        "2027-04-24,י\"ז בניסן תשפ\"ז,Holiday,חול המועד פסח\n" +
        "2027-04-25,י\"ח בניסן תשפ\"ז,Holiday,חול המועד פסח\n" +
        "2027-04-26,י\"ט בניסן תשפ\"ז,Holiday,חול המועד פסח\n" +
        "2027-04-27,כ' בניסן תשפ\"ז,Holiday,שביעי של פסח\n" +
        "2027-04-28,כ\"א בניסן תשפ\"ז,Holiday,אסרו חג פסח\n" +
        "2027-05-04,כ\"ו בניסן תשפ\"ז,Special Day,יום הזיכרון לשואה ולגבורה\n" +
        "2027-05-11,ד' באייר תשפ\"ז,Special Day,יום הזיכרון לחללי מערכות ישראל\n" +
        "2027-05-12,ה' באייר תשפ\"ז,Holiday,יום העצמאות\n" +
        "2027-05-25,י\"ח באייר תשפ\"ז,Special Day,ל\"ג בעומר\n" +
        "2027-06-02,כ\"ו באייר תשפ\"ז,Special Day,יום ירושלים\n" +
        "2027-06-10,ה' בסיוון תשפ\"ז,Holiday,ערב שבועות\n" +
        "2027-06-11,ו' בסיוון תשפ\"ז,Holiday,חג השבועות\n" +
        "2027-06-12,ז' בסיוון תשפ\"ז,Holiday,אסרו חג שבועות\n" +
        "2027-06-20,ט\"ו בסיוון תשפ\"ז,Regular,יום שיא למדעים וטכנולוגיה\n" +
        "2027-06-30,כ\"ה בסיוון תשפ\"ז,Regular,מסיבת סיום ושנה טובה!";
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "school_calendar_demo_2026_2027.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
};

/**
 * Standardizes a date string into YYYY-MM-DD format.
 * Supports: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 */
function standardizeDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  
  // 1. Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  let match = clean.match(/^(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])$/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // 2. Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  match = clean.match(/^(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](\d{4})$/);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    const y = match[3];
    return `${y}-${m}-${d}`;
  }
  
  return null;
}

/**
 * Parses and normalizes a status string. 
 * Supports empty statuses (infers them based on description keywords), 
 * Hebrew statuses (רגיל, חופשה, מיוחד, ח, מ), and English statuses.
 */
function parseStatus(statusVal, description = '') {
  if (!statusVal) {
    const desc = (description || '').toLowerCase();
    if (!desc) return 'Regular';
    
    const holidayKeywords = ['חופש', 'חג', 'ערב', 'סוכות', 'פסח', 'פורים', 'ראש השנה', 'כיפור', 'חנוכה', 'שבועות', 'עצמאות'];
    if (holidayKeywords.some(keyword => desc.includes(keyword))) {
      return 'Holiday';
    }
    return 'Special Day';
  }
  
  const clean = statusVal.trim().toLowerCase();
  if (clean === 'regular' || clean === 'רגיל') return 'Regular';
  if (clean === 'holiday' || clean === 'חופש' || clean === 'חופשה' || clean === 'חג' || clean === 'ח') return 'Holiday';
  if (clean === 'special day' || clean === 'special' || clean === 'יום מיוחד' || clean === 'מיוחד' || clean === 'מ') return 'Special Day';
  
  return 'Regular';
}

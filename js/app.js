// App Orchestration Module for School Calendar & Gantt Application
// Coordinates state management, view switching, filter changes, and modal operations.

import { DB, convertHebrewDateStringToLetters } from './database.js';
import { Auth } from './auth.js';
import { Calendar } from './calendar.js';
import { Gantt } from './gantt.js';
import { Admin } from './admin.js';

// Application State
// TV identification must never classify a phone as a kiosk.
function isTvDevice() {
  const ua = navigator.userAgent || '';
  return /SmartTV|Tizen|Web0S|webOS|HbbTV|BRAVIA|NetCast|POV_TV|Viera|Roku|AFT|MiBox|Shield|Chromecast|GoogleTV|AppleTV|DTV|OTT|LargeScreen|Android.*TV/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua) && navigator.maxTouchPoints === 0);
}
function isPhoneLayout() {
  if (isTvDevice()) return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  const isNarrow = window.innerWidth <= 768;
  const isLandscapeMobile = (window.innerWidth <= 950 && window.innerHeight <= 500 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  return isMobileUA || isNarrow || isLandscapeMobile;
}

const state = {
  currentYear: 2026,
  currentMonth: 8, // September (0-indexed, so 8)
  activeTab: 'dashboard', // 'dashboard' | 'admin-console'
  activeView: 'calendar', // 'calendar' | 'gantt'
  filterType: 'all',
  filterGrade: 'all',
  currentUser: null,
  selectedDate: ''
};

// Initial state reset to today's date (if close to the school year)
const todayDate = new Date();
if (todayDate.getFullYear() >= 2026 && todayDate.getFullYear() <= 2027) {
  state.currentYear = todayDate.getFullYear();
  state.currentMonth = todayDate.getMonth();
}


/**
 * Helper to calculate Hebrew month name range and year for Gregorian month header
 */
function getHebrewMonthHeaderString(year, month) {
  try {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      month: 'long',
      year: 'numeric'
    });
    
    const firstHeb = convertHebrewDateStringToLetters(formatter.format(firstDay).trim());
    const lastHeb = convertHebrewDateStringToLetters(formatter.format(lastDay).trim());
    const cleanHeb = (s) => (s || '').replace(/^[בל]/, '');
    
    if (firstHeb === lastHeb) {
      return cleanHeb(firstHeb);
    }
    
    const firstParts = firstHeb.split(' ');
    const lastParts = lastHeb.split(' ');
    
    const firstYear = firstParts[firstParts.length - 1];
    const lastYear = lastParts[lastParts.length - 1];
    
    const firstMonth = cleanHeb(firstParts.slice(0, firstParts.length - 1).join(' '));
    const lastMonth = cleanHeb(lastParts.slice(0, lastParts.length - 1).join(' '));
    
    if (firstYear === lastYear) {
      return `${firstMonth} - ${lastMonth} ${firstYear}`;
    } else {
      return `${firstMonth} ${firstYear} - ${lastMonth} ${lastYear}`;
    }
  } catch (e) {
    console.error('Failed to format Hebrew month header:', e);
    return '';
  }
}

/**
 * Main application render function that refreshes the active view based on state
 */
function renderApp() {
  const isPhone = isPhoneLayout();
  const isTv = !isPhone && (document.body.classList.contains('fullscreen-mode') || document.documentElement.classList.contains('fullscreen-mode'));

  document.body.classList.toggle('phone-layout', isPhone);
  document.body.classList.toggle('desktop-mode', !isPhone && !isTv);
  document.body.classList.toggle('fullscreen-mode', isTv);
  document.documentElement.classList.toggle('fullscreen-mode', isTv);

  if (isPhone) {
    localStorage.removeItem('tv_mode');
  }

  const fullscreenBtn = document.getElementById('cal-fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.style.display = (isPhone || isTv) ? 'none' : 'flex';
  }

  const liveWidget = document.getElementById('live-datetime-widget');
  if (liveWidget) {
    liveWidget.style.display = isTv ? 'flex' : 'none';
  }

  const events = DB.getEvents();

  // Helper to format date object to YYYY-MM-DD local string
  const formatDateKey = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (!state.selectedDate) {
    if (state.currentYear === today.getFullYear() && state.currentMonth === today.getMonth()) {
      state.selectedDate = todayKey;
    } else {
      state.selectedDate = formatDateKey(state.currentYear, state.currentMonth, 1);
    }
  }

  // 1. Update Month Header Title
  const monthNameElement = document.getElementById('calendar-month-name');
  if (monthNameElement) {
    if (isTv) {
      const today = new Date();
      const currentSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const endFriday = new Date(currentSunday.getFullYear(), currentSunday.getMonth(), currentSunday.getDate() + 26);

      const startKey = formatDateKey(currentSunday.getFullYear(), currentSunday.getMonth(), currentSunday.getDate());
      const endKey = formatDateKey(endFriday.getFullYear(), endFriday.getMonth(), endFriday.getDate());

      const startInfo = DB.getHebrewDateInfo(startKey);
      const endInfo = DB.getHebrewDateInfo(endKey);

      const startParts = (startInfo.hebrewDate || '').split(' ');
      const endParts = (endInfo.hebrewDate || '').split(' ');

      const cleanHeb = (s) => (s || '').replace(/^[בל]/, '');
      const startHebMonth = cleanHeb(startParts.length >= 2 ? startParts[1] : '');
      const endHebMonth = cleanHeb(endParts.length >= 2 ? endParts[1] : '');
      const hebYear = endParts.length >= 3 ? endParts[2] : (startParts.length >= 3 ? startParts[2] : '');

      let hebRange = startHebMonth;
      if (endHebMonth && endHebMonth !== startHebMonth) {
        hebRange = `${startHebMonth} - ${endHebMonth}`;
      }
      if (hebYear) hebRange += ` ${hebYear}`;

      const gregRange = `${currentSunday.getDate()}/${currentSunday.getMonth() + 1} – ${endFriday.getDate()}/${endFriday.getMonth() + 1}/${endFriday.getFullYear()}`;

      monthNameElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span>${hebRange}</span>
          <span class="cal-header-sub" style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600;">(${gregRange})</span>
        </div>
      `;
    } else {
      const gregMonthName = Calendar.HEBREW_GREGORIAN_MONTHS[state.currentMonth];
      const hebMonthStr = getHebrewMonthHeaderString(state.currentYear, state.currentMonth);
      monthNameElement.innerHTML = `
        ${gregMonthName} ${state.currentYear}
        <span class="heb-month-header" style="margin-right: 12px; font-size: 1.1rem; color: var(--text-secondary); font-weight: 600;">(${hebMonthStr})</span>
      `;
    }
  }

  // Toggle Mobile FAB visibility based on authorization
  const fab = document.getElementById('mobile-add-event-fab');
  if (fab) {
    if (isPhone && state.currentUser && state.currentUser.isAuthorized) {
      fab.style.display = 'flex';
    } else {
      fab.style.display = 'none';
    }
  }

  // 2. Render Active View Tab
  if (state.activeTab === 'dashboard') {
    document.getElementById('dashboard-view-panel').classList.add('active');
    document.getElementById('admin-view-panel').classList.remove('active');

    if (state.activeView === 'calendar') {
      document.getElementById('calendar-grid-container').style.display = 'grid';
      document.getElementById('gantt-chart-container').style.display = 'none';
      
      Calendar.render({
        year: state.currentYear,
        month: state.currentMonth,
        containerId: 'calendar-days-grid',
        events: events,
        filterType: state.filterType,
        filterGrade: state.filterGrade,
        onDayClick: handleDayClick,
        onEventClick: handleEventClick,
        selectedDate: state.selectedDate,
        onDaySelect: (dateStr) => {
          state.selectedDate = dateStr;
          if (!isPhoneLayout()) {
            renderApp();
          }
        }
      });
      
      if (!isPhone) {
        renderTvSidePanel();
      }

    } else {
      document.getElementById('calendar-grid-container').style.display = 'none';
      document.getElementById('gantt-chart-container').style.display = 'flex';

      Gantt.render({
        year: state.currentYear,
        month: state.currentMonth,
        containerId: 'gantt-chart-container',
        events: events,
        filterType: state.filterType,
        filterGrade: state.filterGrade,
        onEventClick: handleEventClick
      });
    }
  } else if (state.activeTab === 'admin-console') {
    document.getElementById('dashboard-view-panel').classList.remove('active');
    document.getElementById('admin-view-panel').classList.add('active');
    Admin.renderUserTable();
  }
}

/**
 * Renders the active events list for mobile screen viewports
 */
function renderMobileEventsList() {
  const container = document.getElementById('mobile-events-list-content');
  const title = document.getElementById('mobile-events-list-title');
  if (!container || !title) return;

  const selDate = state.selectedDate;
  if (!selDate) return;

  const dateInfo = DB.getHebrewDateInfo(selDate);
  const parts = selDate.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const weekdayName = dateObj.toLocaleDateString('he-IL', { weekday: 'long' });
  const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  
  title.textContent = `אירועים ל${weekdayName}, ${formattedDate} (${dateInfo.hebrewDate})`;
  
  // Get active events on selected date (filtered)
  const allEvents = DB.getEvents();
  const filteredEvents = Calendar.filterEvents(allEvents, state.filterType, state.filterGrade);
  const activeEvents = filteredEvents.filter(evt => selDate >= evt.startDate && selDate <= evt.endDate);
  
  container.innerHTML = '';
  
  // Base Calendar Holiday/Special Day Notice
  if (dateInfo.status === 'Holiday' || dateInfo.status === 'Special Day') {
    const typeClass = dateInfo.status === 'Holiday' ? 'evt-trip' : 'evt-social';
    const statusHeb = dateInfo.status === 'Holiday' ? 'חופשה' : 'יום מיוחד';
    const card = document.createElement('div');
    card.className = `mobile-event-card ${typeClass}`;
    card.style.cursor = 'default';
    card.innerHTML = `
      <div class="mobile-event-info">
        <div class="mobile-event-title-text">${dateInfo.description || statusHeb}</div>
        <div class="mobile-event-meta">
          <span><i class="fas fa-calendar-alt"></i> ${statusHeb} (לוח בסיס)</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
  
  if (activeEvents.length === 0) {
    if (dateInfo.status === 'Regular') {
      container.innerHTML += `<div class="mobile-no-events">אין אירועים פדגוגיים או חברתיים ביום זה.</div>`;
    }
    return;
  }
  
  activeEvents.forEach(event => {
    let typeClass = 'evt-staff';
    switch (event.eventType) {
      case 'צוותי': typeClass = 'evt-staff'; break;
      case 'מנהלתי': typeClass = 'evt-admin'; break;
      case 'חברתי': typeClass = 'evt-social'; break;
      case 'פדגוגי': typeClass = 'evt-academic'; break;
      case 'טיול': typeClass = 'evt-trip'; break;
      case 'אחר': typeClass = 'evt-other'; break;
    }
    
    const card = document.createElement('div');
    card.className = `mobile-event-card ${typeClass}`;
    
    const gradesText = event.targetGrades && event.targetGrades.length > 0
      ? `שכבות: ${event.targetGrades.join(', ')}`
      : 'כלל בית הספר';
      
    card.innerHTML = `
      <div class="mobile-event-info">
        <div class="mobile-event-title-text">${event.title}</div>
        <div class="mobile-event-desc-text">${event.description || 'אין תיאור נוסף.'}</div>
        <div class="mobile-event-meta">
          <span><i class="fas fa-tag"></i> ${event.eventType}</span>
          <span><i class="fas fa-graduation-cap"></i> ${gradesText}</span>
        </div>
      </div>
      <i class="fas fa-chevron-left" style="color: var(--text-muted); font-size: 0.9rem;"></i>
    `;
    
    card.addEventListener('click', () => {
      openEventDetailsModal(event);
    });
    container.appendChild(card);
  });
}

/**
 * Renders the Duty Roster and Announcements on the TV side panel
 */
function renderTvSidePanel() {
  const panel = document.getElementById('tv-side-panel');
  if (!panel) return;

  const today = new Date();
  const dayIndex = today.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  const dayBadge = document.getElementById('tv-today-day-name');
  if (dayBadge) {
    dayBadge.textContent = 'יום ' + dayNames[dayIndex];
  }

  const editBtn = document.getElementById('tv-edit-roster-btn');
  if (editBtn) {
    if (state.currentUser && state.currentUser.role === 'Admin') {
      editBtn.style.display = 'inline-flex';
    } else {
      editBtn.style.display = 'none';
    }
  }

  const rosterData = DB.getDutyRoster();
  const dutiesContainer = document.getElementById('tv-duties-list');
  if (dutiesContainer) {
    dutiesContainer.innerHTML = '';
    if (dayIndex === 6) {
      dutiesContainer.innerHTML = `
        <div class="tv-empty-state">
          <i class="fas fa-heart" style="color: var(--primary-color); font-size: 1.2rem; display: block; margin-bottom: 6px;"></i>
          שבת שלום ומנוחה! אין תורנויות היום.
        </div>
      `;
    } else {
      const todayDuties = (rosterData.duties && rosterData.duties[String(dayIndex)]) || [];
      if (todayDuties.length === 0) {
        dutiesContainer.innerHTML = `<div class="tv-empty-state">לא הוגדרו תורנויות ליום זה.</div>`;
      } else {
        todayDuties.forEach(d => {
          const item = document.createElement('div');
          item.className = 'tv-duty-item';
          item.innerHTML = `
            <div class="tv-duty-role"><i class="fas fa-map-marker-alt"></i> ${d.role || 'תורנות'}</div>
            <div class="tv-duty-teacher"><i class="fas fa-user-check"></i> ${d.teacher || 'לא שובץ'}</div>
          `;
          dutiesContainer.appendChild(item);
        });
      }
    }
  }

  const annContent = document.getElementById('tv-announcements-content');
  if (annContent) {
    annContent.textContent = rosterData.announcements || 'אין הודעות מיוחדות כרגע.';
  }
}

let currentDutyModalDay = 0; // 0=Sunday
let dutyModalData = null;

function openDutyRosterModal() {
  if (!state.currentUser || state.currentUser.role !== 'Admin') {
    alert('רק מנהל מערכת יכול לערוך את לוח התורנויות וההודעות.');
    return;
  }
  const modal = document.getElementById('duty-roster-modal');
  const raw = DB.getDutyRoster();
  dutyModalData = JSON.parse(JSON.stringify(raw));
  if (!dutyModalData.duties) dutyModalData.duties = {};
  for (let i = 0; i <= 5; i++) {
    if (!dutyModalData.duties[String(i)]) dutyModalData.duties[String(i)] = [];
  }

  document.getElementById('roster-announcements-input').value = dutyModalData.announcements || '';
  currentDutyModalDay = 0;
  switchDutyModalDay(0);
  modal.classList.add('active');
}

function switchDutyModalDay(dayIdx) {
  currentDutyModalDay = dayIdx;
  document.querySelectorAll('.duty-day-tab').forEach(tab => {
    if (parseInt(tab.dataset.day, 10) === dayIdx) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  renderDutyModalRows();
}

function renderDutyModalRows() {
  const container = document.getElementById('duty-rows-container');
  if (!container) return;
  container.innerHTML = '';

  const dayDuties = dutyModalData.duties[String(currentDutyModalDay)] || [];
  if (dayDuties.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 8px 0; text-align: center;">אין עמדות תורנות ליום זה. לחץ על "הוסף עמדת תורנות" למטה.</div>';
    return;
  }

  dayDuties.forEach((d, idx) => {
    const row = document.createElement('div');
    row.className = 'duty-roster-row';
    row.innerHTML = `
      <input type="text" class="form-control roster-role-input" placeholder="מיקום/תפקיד (למשל: שער ראשי)" value="${d.role || ''}">
      <input type="text" class="form-control roster-teacher-input" placeholder="שם המורה התורן" value="${d.teacher || ''}">
      <button type="button" class="btn btn-danger remove-duty-btn" title="מחק שורה זו"><i class="fas fa-trash-alt"></i></button>
    `;

    const roleInput = row.querySelector('.roster-role-input');
    const teacherInput = row.querySelector('.roster-teacher-input');
    const removeBtn = row.querySelector('.remove-duty-btn');

    roleInput.addEventListener('input', (e) => {
      dayDuties[idx].role = e.target.value;
    });

    teacherInput.addEventListener('input', (e) => {
      dayDuties[idx].teacher = e.target.value;
    });

    removeBtn.addEventListener('click', () => {
      dayDuties.splice(idx, 1);
      renderDutyModalRows();
    });

    container.appendChild(row);
  });
}

// ----------------------------------------------------
// EVENT HANDLERS & MODAL TRIGGERS
// ----------------------------------------------------

/**
 * Handle day cell click in the calendar to open "Add Event" modal
 */
function handleDayClick(dateStr) {
  if (!state.currentUser || !state.currentUser.isAuthorized) {
    alert('אינך מורשה ליצור אירועים חדשים. פנה למנהל המערכת לאישור.');
    return;
  }
  openAddEventModal(dateStr);
}

/**
 * Handle event bar click to open "View Details" modal
 */
function handleEventClick(event) {
  openEventDetailsModal(event);
}

/**
 * Open Modal to Add Event
 */
function openAddEventModal(prefilledDate = '') {
  const modal = document.getElementById('event-modal');
  const title = document.getElementById('event-modal-title');
  const form = document.getElementById('event-form');
  
  title.textContent = 'הוספת אירוע חדש ללוח';
  form.reset();

  // Prefill values
  document.getElementById('event-id-input').value = '';
  document.getElementById('event-start-date').value = prefilledDate || new Date().toISOString().split('T')[0];
  document.getElementById('event-end-date').value = prefilledDate || new Date().toISOString().split('T')[0];
  
  // Hide grades initially
  document.getElementById('event-grades-container').classList.add('hidden');
  
  // Update submit button text
  document.getElementById('event-submit-btn').textContent = 'שמור אירוע';
  
  modal.classList.add('active');
}

/**
 * Open Modal to View/Edit Event Details
 */
function openEventDetailsModal(event) {
  const modal = document.getElementById('event-details-modal');
  const container = document.getElementById('event-details-content');
  
  const startHebrew = DB.getHebrewDateInfo(event.startDate).hebrewDate;
  const endHebrew = DB.getHebrewDateInfo(event.endDate).hebrewDate;
  
  const formattedGrades = event.targetGrades && event.targetGrades.length > 0 
    ? event.targetGrades.join(', ') 
    : 'כלל בית הספר';

  // Google Calendar URL Setup
  // Format YYYY-MM-DD to YYYYMMDD
  const startStr = event.startDate.replace(/-/g, '');
  // Exclusive end date calculation for Google Calendar all-day event
  const endDateObj = new Date(event.endDate);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endStr = endDateObj.toISOString().slice(0, 10).replace(/-/g, '');
  
  const encodedTitle = encodeURIComponent(event.title);
  const encodedDesc = encodeURIComponent(event.description || '');
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startStr}/${endStr}&details=${encodedDesc}`;

  // Build the details panel HTML
  let html = `
    <div class="event-details-layout">
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-heading"></i></span>
        <span class="details-label">שם האירוע:</span>
        <span class="details-value" style="font-weight: 700;">${event.title}</span>
      </div>
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-calendar-alt"></i></span>
        <span class="details-label">תאריך התחלה:</span>
        <span class="details-value">${event.startDate} <span style="color: var(--text-muted);">(${startHebrew})</span></span>
      </div>
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-calendar-check"></i></span>
        <span class="details-label">תאריך סיום:</span>
        <span class="details-value">${event.endDate} <span style="color: var(--text-muted);">(${endHebrew})</span></span>
      </div>
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-tags"></i></span>
        <span class="details-label">סוג אירוע:</span>
        <span class="details-value">${event.eventType}</span>
      </div>
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-graduation-cap"></i></span>
        <span class="details-label">שכבות יעד:</span>
        <span class="details-value">${formattedGrades}</span>
      </div>
      <div class="details-row">
        <span class="details-icon"><i class="fas fa-user-edit"></i></span>
        <span class="details-label">נוצר על ידי:</span>
        <span class="details-value">${event.createdBy}</span>
      </div>
      <div class="details-row" style="flex-direction: column; gap: 6px;">
        <span class="details-label" style="width: 100%;"><i class="fas fa-info-circle" style="color: var(--primary-color); margin-left: 6px;"></i>תיאור ופרטים נוספים:</span>
        <div class="details-description-box">${event.description || 'אין פירוט נוסף לאירוע זה.'}</div>
      </div>
      
      <a href="${googleCalUrl}" target="_blank" class="google-cal-link">
        <i class="fab fa-google"></i>
        הוסף ליומן גוגל שלי (Google Calendar)
      </a>
    </div>
  `;

  container.innerHTML = html;

  // Manage authorization actions (Edit/Delete buttons visibility)
  const actionsContainer = document.getElementById('details-actions-container');
  const isCreator = event.createdBy === state.currentUser?.email;
  const isAdmin = state.currentUser?.role === 'Admin';

  if (state.currentUser && state.currentUser.isAuthorized && (isAdmin || isCreator)) {
    actionsContainer.innerHTML = `
      <button id="details-edit-btn" class="btn btn-secondary"><i class="fas fa-edit"></i> ערוך אירוע</button>
      <button id="details-delete-btn" class="btn btn-danger"><i class="fas fa-trash-alt"></i> מחק אירוע</button>
    `;
    
    // Bind Delete
    document.getElementById('details-delete-btn').addEventListener('click', () => {
      const currentIsCreator = event.createdBy === state.currentUser?.email;
      const currentIsAdmin = state.currentUser?.role === 'Admin';
      if (!currentIsAdmin && !currentIsCreator) {
        alert('אין לך הרשאה למחוק אירוע זה (אירוע זה לא נוצר על ידך).');
        return;
      }
      if (confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.title}"?`)) {
        DB.deleteEvent(event.id);
        modal.classList.remove('active');
        renderApp();
      }
    });

    // Bind Edit
    document.getElementById('details-edit-btn').addEventListener('click', () => {
      modal.classList.remove('active');
      openEditEventModal(event);
    });
  } else {
    actionsContainer.innerHTML = ''; // Hide buttons for unauthorized users or other teachers' events
  }

  modal.classList.add('active');
}

/**
 * Opens event form modal in EDIT mode prefilled with event fields
 */
function openEditEventModal(event) {
  const modal = document.getElementById('event-modal');
  const title = document.getElementById('event-modal-title');
  
  title.textContent = 'עריכת אירוע קיים';
  
  document.getElementById('event-id-input').value = event.id;
  document.getElementById('event-title').value = event.title;
  document.getElementById('event-start-date').value = event.startDate;
  document.getElementById('event-end-date').value = event.endDate;
  document.getElementById('event-type').value = event.eventType;
  document.getElementById('event-description').value = event.description || '';

  // Grades show/hide based on event type
  const gradesContainer = document.getElementById('event-grades-container');
  if (event.eventType === 'חברתי' || event.eventType === 'טיול') {
    gradesContainer.classList.remove('hidden');
    
    // Pre-check grades checkboxes
    const checkboxes = document.querySelectorAll('.grade-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = event.targetGrades.includes(cb.value);
    });
  } else {
    gradesContainer.classList.add('hidden');
  }

  document.getElementById('event-submit-btn').textContent = 'עדכן אירוע';
  modal.classList.add('active');
}

// ----------------------------------------------------
// SETUP LISTENERS & ROUTING INITIALIZATION
// ----------------------------------------------------

function setupEventListeners() {
  // Navigation Menu tabs switching
  document.getElementById('nav-dashboard').addEventListener('click', () => {
    state.activeTab = 'dashboard';
    document.getElementById('nav-dashboard').parentElement.classList.add('active');
    document.getElementById('nav-admin').parentElement.classList.remove('active');
    renderApp();
  });

  document.getElementById('nav-admin').addEventListener('click', () => {
    state.activeTab = 'admin-console';
    document.getElementById('nav-admin').parentElement.classList.add('active');
    document.getElementById('nav-dashboard').parentElement.classList.remove('active');
    renderApp();
  });

  // Auth trigger (Login / Logout)
  document.getElementById('nav-logout').addEventListener('click', () => {
    if (state.currentUser) {
      Auth.logout();
    } else {
      Auth.login();
    }
  });

  const mobileLogout = document.getElementById('nav-logout-mobile');
  if (mobileLogout) {
    mobileLogout.addEventListener('click', () => {
      if (state.currentUser) {
        Auth.logout();
      } else {
        Auth.login();
      }
    });
  }

  // View Switcher (Calendar Grid vs Gantt Chart)
  document.getElementById('switch-calendar').addEventListener('click', () => {
    state.activeView = 'calendar';
    document.getElementById('switch-calendar').classList.add('active');
    document.getElementById('switch-gantt').classList.remove('active');
    renderApp();
  });

  document.getElementById('switch-gantt').addEventListener('click', () => {
    state.activeView = 'gantt';
    document.getElementById('switch-gantt').classList.add('active');
    document.getElementById('switch-calendar').classList.remove('active');
    renderApp();
  });

  // Toolbar filters dropdowns
  document.getElementById('filter-event-type').addEventListener('change', (e) => {
    state.filterType = e.target.value;
    renderApp();
  });

  document.getElementById('filter-target-grade').addEventListener('change', (e) => {
    state.filterGrade = e.target.value;
    renderApp();
  });

  // Calendar month navigation
  document.getElementById('cal-prev-btn').addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 0) {
      state.currentMonth = 11;
      state.currentYear--;
    }
    renderApp();
  });

  document.getElementById('cal-next-btn').addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 11) {
      state.currentMonth = 0;
      state.currentYear++;
    }
    renderApp();
  });

  document.getElementById('cal-today-btn').addEventListener('click', () => {
    const today = new Date();
    state.currentYear = today.getFullYear();
    state.currentMonth = today.getMonth();
    renderApp();
  });

  // Fullscreen projection toggle for staff room TV display
  const fullscreenBtn = document.getElementById('cal-fullscreen-btn');

      const setFullscreenMode = (enable) => {
        if (enable && isPhoneLayout()) return;
        if (enable) {
          document.documentElement.classList.add('fullscreen-mode');
          document.body.classList.add('fullscreen-mode');
          document.body.classList.remove('phone-layout', 'desktop-mode');
          state.activeView = 'calendar';
          localStorage.setItem('tv_mode', 'true');
          const switchCal = document.getElementById('switch-calendar');
          const switchGantt = document.getElementById('switch-gantt');
          if (switchCal) switchCal.classList.add('active');
          if (switchGantt) switchGantt.classList.remove('active');
          const calContainer = document.getElementById('calendar-grid-container');
          const ganttContainer = document.getElementById('gantt-chart-container');
          if (calContainer) calContainer.style.display = 'flex';
          if (ganttContainer) ganttContainer.style.display = 'none';

          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          if (fullscreenBtn) {
            fullscreenBtn.style.display = 'none';
          }
          renderApp();
        } else {
          document.documentElement.classList.remove('fullscreen-mode');
          document.body.classList.remove('fullscreen-mode');
          localStorage.setItem('tv_mode', 'false');
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          if (fullscreenBtn) {
            fullscreenBtn.style.display = isPhoneLayout() ? 'none' : 'flex';
            const icon = fullscreenBtn.querySelector('i');
            const text = document.getElementById('cal-fullscreen-text');
            if (icon) icon.className = 'fas fa-tv';
            if (text) text.textContent = 'מסך מלא (טלוויזיה)';
            fullscreenBtn.classList.remove('btn-fullscreen-active');
          }
          renderApp();
        }
      };

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          const isCurrentlyFs = document.body.classList.contains('fullscreen-mode') || document.documentElement.classList.contains('fullscreen-mode');
          setFullscreenMode(!isCurrentlyFs);
        });

        if (document.body.classList.contains('fullscreen-mode') || document.documentElement.classList.contains('fullscreen-mode') || isPhoneLayout()) {
          fullscreenBtn.style.display = 'none';
        }
      }

      // Check and automatically trigger TV fullscreen kiosk mode
      const checkAndTriggerTvMode = () => {
        if (isPhoneLayout()) {
          document.documentElement.classList.remove('fullscreen-mode');
          document.body.classList.remove('fullscreen-mode');
          localStorage.removeItem('tv_mode');
          if (fullscreenBtn) fullscreenBtn.style.display = 'none';
          return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const isTvParam = urlParams.has('tv') || urlParams.has('kiosk') || urlParams.has('fullscreen') || window.location.hash === '#tv';
        const isTvStored = localStorage.getItem('tv_mode') === 'true';
        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const noTouch = (navigator.maxTouchPoints === 0 || !('ontouchstart' in window));
        const notMobile = !/Mobile/i.test(ua);
        const hasTvWords = /TV|SmartTV|Tizen|Web0S|webOS|HbbTV|BRAVIA|NetCast|POV_TV|Viera|Roku|AFT|MiBox|Shield|Chromecast|GoogleTV|DTV|OTT|LargeScreen/i.test(ua);
        const isAndroidTv = isAndroid && (noTouch || notMobile || hasTvWords);

        if (isTvParam || isTvStored || isAndroidTv || hasTvWords || window.__IS_TV_INITIAL__) {
          setFullscreenMode(true);

          // If browser blocked initial programmatic requestFullscreen, trigger on first user interaction
          const onFirstInteraction = () => {
            if ((document.body.classList.contains('fullscreen-mode') || document.documentElement.classList.contains('fullscreen-mode')) && !document.fullscreenElement) {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }
            window.removeEventListener('click', onFirstInteraction);
            window.removeEventListener('keydown', onFirstInteraction);
            window.removeEventListener('touchstart', onFirstInteraction);
          };
          window.addEventListener('click', onFirstInteraction, { passive: true });
          window.addEventListener('keydown', onFirstInteraction, { passive: true });
          window.addEventListener('touchstart', onFirstInteraction, { passive: true });
        }
      };
      checkAndTriggerTvMode();
      let layoutResizeTimer;
      const handleResizeOrRotate = () => {
        clearTimeout(layoutResizeTimer);
        layoutResizeTimer = setTimeout(() => {
          if (isPhoneLayout()) {
            document.documentElement.classList.remove('fullscreen-mode');
            document.body.classList.remove('fullscreen-mode');
            localStorage.removeItem('tv_mode');
          }
          renderApp();
        }, 100);
      };
      window.addEventListener('resize', handleResizeOrRotate);
      window.addEventListener('orientationchange', handleResizeOrRotate);

      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
        const grid = document.querySelector('.calendar-days-grid');
        if (grid && document.body.classList.contains('fullscreen-mode')) Calendar.fitTvLayout(grid);
      });

      // Periodic silent auto-refresh every 3 minutes (picks up all updates seamlessly)
      const triggerSilentRefresh = async () => {
        try {
          if (typeof DB !== 'undefined' && DB.refreshFromRemote) {
            await DB.refreshFromRemote();
          }
        } catch (e) {
          console.warn('Silent refresh error:', e);
        }
        renderApp();
      };
      if (!window._silentRefreshTimer) {
        window._silentRefreshTimer = setInterval(triggerSilentRefresh, 3 * 60 * 1000);
      }

  // Add Event trigger button (+ Add Event)
  const addEventBtn = document.getElementById('add-event-btn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      if (!state.currentUser || !state.currentUser.isAuthorized) {
        alert('אינך מורשה ליצור אירועים חדשים. פנה למנהל המערכת.');
        return;
      }
      openAddEventModal();
    });
  }

  // Mobile FAB trigger button (+ Add Event)
  const mobileFab = document.getElementById('mobile-add-event-fab');
  if (mobileFab) {
    mobileFab.addEventListener('click', () => {
      if (!state.currentUser || !state.currentUser.isAuthorized) {
        alert('אינך מורשה ליצור אירועים חדשים. פנה למנהל המערכת.');
        return;
      }
      openAddEventModal(state.selectedDate);
    });
  }

  // Modals Close button triggers
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('event-modal').classList.remove('active');
  });
  document.getElementById('event-cancel-btn').addEventListener('click', () => {
    document.getElementById('event-modal').classList.remove('active');
  });

  document.getElementById('details-modal-close').addEventListener('click', () => {
    document.getElementById('event-details-modal').classList.remove('active');
  });

  // Hide/Show Target Grades field dynamically on Event Type select changes
  const eventTypeSelect = document.getElementById('event-type');
  const gradesContainer = document.getElementById('event-grades-container');
  
  eventTypeSelect.addEventListener('change', () => {
    const val = eventTypeSelect.value;
    if (val === 'חברתי' || val === 'טיול') {
      gradesContainer.classList.remove('hidden');
    } else {
      gradesContainer.classList.add('hidden');
      // Reset checkboxes
      document.querySelectorAll('.grade-checkbox').forEach(cb => cb.checked = false);
    }
  });

  // Event Add/Edit Form submission handling
  document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const eventId = document.getElementById('event-id-input').value;
    const title = document.getElementById('event-title').value.trim();
    const startDate = document.getElementById('event-start-date').value;
    const endDate = document.getElementById('event-end-date').value;
    const eventType = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value.trim();

    if (!title || !startDate || !endDate || !eventType) {
      alert('נא למלא את כל שדות החובה המסומנים בכוכבית.');
      return;
    }

    if (endDate < startDate) {
      alert('תאריך הסיום לא יכול להיות מוקדם מתאריך ההתחלה.');
      return;
    }

    // Get checked target grades if type is social/trip
    const targetGrades = [];
    if (eventType === 'חברתי' || eventType === 'טיול') {
      document.querySelectorAll('.grade-checkbox:checked').forEach(cb => {
        targetGrades.push(cb.value);
      });
    }

    const eventData = {
      title,
      startDate,
      endDate,
      eventType,
      targetGrades,
      description,
      createdBy: state.currentUser.email
    };

    if (eventId) {
      // Edit mode
      const existing = DB.getEvents().find(e => e.id === eventId);
      if (existing) {
        const isCreator = existing.createdBy === state.currentUser?.email;
        const isAdmin = state.currentUser?.role === 'Admin';
        if (!isAdmin && !isCreator) {
          alert('אין לך הרשאה לערוך אירוע זה (אירוע זה לא נוצר על ידך).');
          return;
        }
        eventData.createdBy = existing.createdBy; // Keep original creator
        DB.updateEvent(eventId, eventData);
      }
    } else {
      // Add mode
      DB.addEvent(eventData);
    }

    document.getElementById('event-modal').classList.remove('active');
    renderApp();
  });

  // Duty Roster & Announcements modal triggers
  const tvEditBtn = document.getElementById('tv-edit-roster-btn');
  if (tvEditBtn) tvEditBtn.addEventListener('click', openDutyRosterModal);

  const adminOpenRosterBtn = document.getElementById('admin-open-duty-roster-btn');
  if (adminOpenRosterBtn) adminOpenRosterBtn.addEventListener('click', openDutyRosterModal);

  const rosterModalClose = document.getElementById('duty-roster-modal-close');
  if (rosterModalClose) rosterModalClose.addEventListener('click', () => {
    document.getElementById('duty-roster-modal').classList.remove('active');
  });

  const rosterCancelBtn = document.getElementById('duty-roster-cancel-btn');
  if (rosterCancelBtn) rosterCancelBtn.addEventListener('click', () => {
    document.getElementById('duty-roster-modal').classList.remove('active');
  });

  // Duty Day Tabs
  document.querySelectorAll('.duty-day-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const dayIdx = parseInt(tab.dataset.day, 10);
      switchDutyModalDay(dayIdx);
    });
  });

  // Add Duty Row
  const addRowBtn = document.getElementById('add-duty-row-btn');
  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      if (!dutyModalData) return;
      const dayDuties = dutyModalData.duties[String(currentDutyModalDay)] || [];
      dayDuties.push({ role: '', teacher: '' });
      dutyModalData.duties[String(currentDutyModalDay)] = dayDuties;
      renderDutyModalRows();
    });
  }

  // Copy Roles Template across Sunday - Friday
  const copyRolesBtn = document.getElementById('copy-roles-template-btn');
  if (copyRolesBtn) {
    copyRolesBtn.addEventListener('click', () => {
      if (!dutyModalData) return;
      const dayDuties = dutyModalData.duties[String(currentDutyModalDay)] || [];
      const currentRoles = dayDuties.map(d => (d.role || '').trim()).filter(Boolean);
      if (currentRoles.length === 0) {
        alert('נא להגדיר לפחות תפקיד אחד ביום זה לפני שכפול.');
        return;
      }
      if (confirm(`האם לשכפל את ${currentRoles.length} עמדות התורנות של יום זה לכל שאר ימות השבוע (ראשון עד שישי)?`)) {
        for (let i = 0; i <= 5; i++) {
          if (i === currentDutyModalDay) continue;
          const existing = dutyModalData.duties[String(i)] || [];
          const newDayDuties = currentRoles.map(roleName => {
            const found = existing.find(e => (e.role || '').trim() === roleName);
            return { role: roleName, teacher: found ? found.teacher : '' };
          });
          dutyModalData.duties[String(i)] = newDayDuties;
        }
        alert('עמדות התורנות שוכפלו בהצלחה לכל ימות השבוע!');
      }
    });
  }

  // Save Duty Roster
  const rosterSaveBtn = document.getElementById('duty-roster-save-btn');
  if (rosterSaveBtn) {
    rosterSaveBtn.addEventListener('click', async () => {
      if (!dutyModalData) return;
      const annInput = document.getElementById('roster-announcements-input');
      dutyModalData.announcements = annInput ? annInput.value.trim() : '';

      for (let i = 0; i <= 5; i++) {
        if (dutyModalData.duties[String(i)]) {
          dutyModalData.duties[String(i)] = dutyModalData.duties[String(i)].filter(d => (d.role || '').trim() || (d.teacher || '').trim());
        }
      }

      rosterSaveBtn.disabled = true;
      rosterSaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שומר...';

      try {
        await DB.saveDutyRoster(dutyModalData);
        document.getElementById('duty-roster-modal').classList.remove('active');
        renderApp();
        alert('לוח התורנויות וההודעות נשמרו בהצלחה בענן!');
      } catch (err) {
        console.error('Failed to save duty roster:', err);
        alert('שגיאה בשמירת הנתונים: ' + (err.message || err));
      } finally {
        rosterSaveBtn.disabled = false;
        rosterSaveBtn.innerHTML = '<i class="fas fa-save"></i> שמור שינויים';
      }
    });
  }
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------

function updateLiveClock() {
  const timeEl = document.getElementById('live-time-display');
  const dayEl = document.getElementById('live-day-display');
  const hebDateEl = document.getElementById('live-heb-date-display');
  const gregDateEl = document.getElementById('live-greg-date-display');
  if (!timeEl) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  timeEl.textContent = `${hh}:${mm}:${ss}`;

  if (dayEl) {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    dayEl.textContent = 'יום ' + dayNames[now.getDay()];
  }

  const yyyy = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${m}-${d}`;

  if (gregDateEl) {
    gregDateEl.textContent = `${now.getDate()}.${now.getMonth() + 1}.${yyyy}`;
  }

  if (hebDateEl) {
    try {
      const info = DB.getHebrewDateInfo(dateKey);
      if (info && info.hebrewDate) {
        hebDateEl.textContent = info.hebrewDate;
      } else {
        const hFmt = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
        hebDateEl.textContent = convertHebrewDateStringToLetters(hFmt.format(now));
      }
    } catch (e) {
      hebDateEl.textContent = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  // 1. Setup Auth change listener
  Auth.onAuthChange((user) => {
    state.currentUser = user;
    
    const loginView = document.getElementById('login-view');
    const appContainer = document.getElementById('app-container');
    const adminTabWrapper = document.getElementById('admin-tab-wrapper');
    const addEventBtn = document.getElementById('add-event-btn');

    // Always hide the old login view and show the app container (direct entry)
    if (loginView) loginView.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';

    // Load user profile details in sidebar
    const avatar = document.getElementById('sidebar-user-avatar');
    const userNameEl = document.getElementById('sidebar-user-name');
    const badge = document.getElementById('sidebar-user-badge');
    const logoutBtn = document.getElementById('nav-logout');
    const logoutBtnMobile = document.getElementById('nav-logout-mobile');

    if (!user) {
      // Guest Spectator mode (unauthenticated)
      if (userNameEl) userNameEl.textContent = 'אורח במערכת';
      if (badge) {
        badge.className = 'user-role-badge guest';
        badge.textContent = 'צפייה בלבד';
      }
      if (avatar) avatar.textContent = 'א';
      
      if (adminTabWrapper) adminTabWrapper.style.display = 'none';
      if (addEventBtn) addEventBtn.style.display = 'none';
      
      // Toggle button to "Login"
      if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>התחברות צוות</span>';
        logoutBtn.style.color = 'var(--primary-color)';
      }
      if (logoutBtnMobile) {
        logoutBtnMobile.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>התחברות</span>';
        logoutBtnMobile.style.color = 'var(--primary-color)';
      }
    } else {
      // Authenticated User
      if (userNameEl) userNameEl.textContent = user.name || user.email;
      if (avatar) {
        if (user.picture) {
          avatar.innerHTML = `<img src="${user.picture}" alt="${user.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
          avatar.innerHTML = (user.name || user.email)[0].toUpperCase();
        }
      }

      // Set user role badge
      if (badge) {
        badge.className = 'user-role-badge';
        if (user.role === 'Admin') {
          badge.classList.add('admin');
          badge.textContent = 'מנהל מערכת';
        } else if (user.isAuthorized) {
          badge.classList.add('teacher');
          badge.textContent = 'מורה מורשה';
        } else {
          badge.classList.add('guest');
          badge.textContent = 'אורח צפייה';
        }
      }

      // Check tab views permissions
      if (user.role === 'Admin') {
        if (adminTabWrapper) adminTabWrapper.style.display = 'block'; // Show Admin Tab
      } else {
        if (adminTabWrapper) adminTabWrapper.style.display = 'none'; // Hide Admin Tab
        if (state.activeTab === 'admin-console') {
          state.activeTab = 'dashboard';
          document.getElementById('nav-dashboard').parentElement.classList.add('active');
          document.getElementById('nav-admin').parentElement.classList.remove('active');
        }
      }

      // Check actions write permissions (+ Add Event button)
      if (addEventBtn) {
        if (user.isAuthorized) {
          addEventBtn.style.display = 'flex';
        } else {
          addEventBtn.style.display = 'none';
        }
      }

      // Toggle button to "Logout"
      if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>התנתק מהמערכת</span>';
        logoutBtn.style.color = 'var(--danger-color)';
      }
      if (logoutBtnMobile) {
        logoutBtnMobile.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>התנתק</span>';
        logoutBtnMobile.style.color = 'var(--danger-color)';
      }
    }

    // Refresh UI
    renderApp();
  });

  // 2. Initialize Firestore database and pass callback to trigger real-time updates
  DB.init(() => {
    renderApp();
  });

  // 3. Initialize Admin controllers
  Admin.init(() => {
    renderApp();
  });

  // 4. Setup general event listeners
  setupEventListeners();
});

// Gantt Chart Module for School Calendar & Gantt Application
// Renders the RTL horizontal timeline with detailed event cards, exact dates, and Google Calendar export.

import { DB } from './database.js';
import { Calendar } from './calendar.js';

export const Gantt = {
  /**
   * Helper to format Google Calendar URL for 1-click export
   */
  getGoogleCalendarUrl(event) {
    try {
      const title = encodeURIComponent(event.title || 'אירוע בית ספרי');
      const desc = encodeURIComponent(
        (event.description || '') + 
        (event.targetGrades && event.targetGrades.length ? `\nשכבות יעד: ${event.targetGrades.join(', ')}` : '') + 
        `\nסוג אירוע: ${event.eventType || ''}`
      );
      const location = encodeURIComponent('בית הספר');
      
      const startStr = (event.startDate || '').replace(/-/g, '');
      let endStr = startStr;
      if (event.endDate) {
        const parts = event.endDate.split('-');
        const endD = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        endD.setUTCDate(endD.getUTCDate() + 1);
        const y = endD.getUTCFullYear();
        const m = String(endD.getUTCMonth() + 1).padStart(2, '0');
        const d = String(endD.getUTCDate()).padStart(2, '0');
        endStr = `${y}${m}${d}`;
      }
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${desc}&location=${location}`;
    } catch (e) {
      return '#';
    }
  },

  /**
   * Helper to calculate duration in days
   */
  getDurationDays(startDateStr, endDateStr) {
    try {
      const startParts = startDateStr.split('-');
      const endParts = endDateStr.split('-');
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch (e) {
      return 1;
    }
  },

  /**
   * Helper to format Gregorian Date range display string
   */
  formatGregorianRange(startDateStr, endDateStr) {
    try {
      const s = startDateStr.split('-');
      const e = endDateStr.split('-');
      const startFormatted = `${s[2]}/${s[1]}/${s[0]}`;
      const endFormatted = `${e[2]}/${e[1]}/${e[0]}`;
      const duration = this.getDurationDays(startDateStr, endDateStr);
      const durationStr = duration > 1 ? ` (${duration} ימים)` : '';
      
      if (startDateStr === endDateStr) {
        return `${startFormatted}`;
      }
      return `${startFormatted} - ${endFormatted}${durationStr}`;
    } catch (err) {
      return `${startDateStr} - ${endDateStr}`;
    }
  },

  /**
   * Helper to format Hebrew Date range display string
   */
  formatHebrewRange(startDateStr, endDateStr) {
    try {
      const startHeb = DB.getHebrewDateInfo(startDateStr).hebrewDate;
      const endHeb = DB.getHebrewDateInfo(endDateStr).hebrewDate;
      if (!startHeb) return '';
      if (startDateStr === endDateStr || startHeb === endHeb) {
        return startHeb;
      }
      return `${startHeb} - ${endHeb}`;
    } catch (err) {
      return '';
    }
  },

  /**
   * Main render function for the Gantt Chart view
   */
  render({
    year,
    month,
    containerId,
    events,
    filterType,
    filterGrade,
    onEventClick
  }) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Calculate dates
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // Filter events based on criteria
    const filteredEvents = Calendar.filterEvents(events, filterType, filterGrade);

    // Get active events in this month
    const activeEvents = filteredEvents.filter(event => {
      return event.startDate <= endDateStr && event.endDate >= startDateStr;
    });

    // Sort by start date, then duration
    activeEvents.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      const aDuration = new Date(a.endDate) - new Date(a.startDate);
      const bDuration = new Date(b.endDate) - new Date(b.startDate);
      return bDuration - aDuration;
    });

    if (activeEvents.length === 0) {
      container.innerHTML = `
        <div class="gantt-main-container" style="height: auto; min-height: 240px; justify-content: center; align-items: center;">
          <div class="gantt-no-data">
            <i class="fas fa-calendar-times" style="font-size: 2.2rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
            אין אירועים רלוונטיים להצגה במערכת הגאנט לחודש זה.
          </div>
        </div>
      `;
      return;
    }

    // Build the Main Gantt Container
    const ganttMain = document.createElement('div');
    ganttMain.className = 'gantt-main-container';

    // ----------------------------------------------------
    // 1. RIGHT SIDEBAR: Rich Events List
    // ----------------------------------------------------
    const sidebar = document.createElement('div');
    sidebar.className = 'gantt-events-sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'gantt-sidebar-header';
    sidebarHeader.innerHTML = `
      <div class="gantt-sidebar-title">
        <i class="fas fa-tasks"></i>
        <span>אירועי החודש (${activeEvents.length})</span>
      </div>
      <span class="gantt-sidebar-subtitle">לחץ על אירוע לפרטים וייבוא ליומן Google</span>
    `;
    sidebar.appendChild(sidebarHeader);

    const eventsList = document.createElement('div');
    eventsList.className = 'gantt-events-list';

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

      const gregDateStr = this.formatGregorianRange(event.startDate, event.endDate);
      const hebDateStr = this.formatHebrewRange(event.startDate, event.endDate);
      const gcalUrl = this.getGoogleCalendarUrl(event);

      const card = document.createElement('div');
      card.className = `gantt-event-card ${typeClass}`;
      card.title = 'לחץ להצגת פרטי האירוע, עריכה או מחיקה';
      card.innerHTML = `
        <div class="gantt-event-card-top">
          <span class="gantt-event-card-title">${event.title}</span>
          <span class="event-type-badge ${typeClass}">${event.eventType}</span>
        </div>
        <div class="gantt-event-card-dates">
          <span class="date-range"><i class="far fa-calendar-alt"></i> ${gregDateStr}</span>
          ${hebDateStr ? `<span class="hebrew-range"><i class="fas fa-star-of-david"></i> ${hebDateStr}</span>` : ''}
        </div>
        <div class="gantt-event-card-footer">
          <span class="gantt-card-details-hint"><i class="fas fa-info-circle"></i> פרטי אירוע</span>
          <a href="${gcalUrl}" target="_blank" class="gantt-gcal-quick-btn" title="ייבוא ישיר ליומן גוגל">
            <i class="fab fa-google"></i>
            <span>יומן Google</span>
          </a>
        </div>
      `;

      // Click on Google Cal button should not trigger card click
      const gcalBtn = card.querySelector('.gantt-gcal-quick-btn');
      if (gcalBtn) {
        gcalBtn.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      // Clicking the card opens Event Details Modal
      card.addEventListener('click', () => {
        onEventClick(event);
      });

      eventsList.appendChild(card);
    });

    sidebar.appendChild(eventsList);
    ganttMain.appendChild(sidebar);

    // ----------------------------------------------------
    // 2. LEFT TIMELINE: Unified Scrollable Grid
    // ----------------------------------------------------
    const timelineArea = document.createElement('div');
    timelineArea.className = 'gantt-timeline-area';

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'gantt-timeline-scroll-container';

    const contentWidth = Math.max(920, daysInMonth * 40);
    const content = document.createElement('div');
    content.className = 'gantt-timeline-content';
    content.style.width = `${contentWidth}px`;

    // 2.1 Timeline Days Header Row
    const headerRow = document.createElement('div');
    headerRow.className = 'gantt-timeline-header-row';

    const WEEKDAYS_HEBREW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDayNum = today.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCol = document.createElement('div');
      dayCol.className = 'gantt-timeline-day-col';

      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const isToday = isCurrentYearMonth && day === todayDayNum;

      if (isWeekend) dayCol.classList.add('weekend');
      if (isToday) dayCol.classList.add('today');

      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateInfo = DB.getHebrewDateInfo(dateKey);
      const hebrewDayLetter = (dateInfo.hebrewDate || '').split(' ')[0] || '';

      dayCol.innerHTML = `
        <span class="gantt-day-weekday">${WEEKDAYS_HEBREW[dayOfWeek]}</span>
        <span class="gantt-day-num">${day}</span>
        <span class="gantt-day-heb-letter">${hebrewDayLetter}</span>
      `;
      headerRow.appendChild(dayCol);
    }
    content.appendChild(headerRow);

    // 2.2 Timeline Rows Body
    const rowsBody = document.createElement('div');
    rowsBody.className = 'gantt-timeline-rows-body';

    activeEvents.forEach(event => {
      const row = document.createElement('div');
      row.className = 'gantt-timeline-row';

      // Background Grid Lines
      const gridLines = document.createElement('div');
      gridLines.className = 'gantt-row-grid-lines';
      for (let day = 1; day <= daysInMonth; day++) {
        const line = document.createElement('div');
        line.className = 'gantt-grid-column';
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) line.classList.add('weekend');
        if (isCurrentYearMonth && day === todayDayNum) line.classList.add('today');
        gridLines.appendChild(line);
      }
      row.appendChild(gridLines);

      // Calculate Event Bar Position
      const startParts = event.startDate.split('-');
      const endParts = event.endDate.split('-');
      const eventStartObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const eventEndObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      
      const monthStartObj = new Date(year, month, 1);
      const monthEndObj = new Date(year, month, daysInMonth);

      const visibleStart = new Date(Math.max(eventStartObj.getTime(), monthStartObj.getTime()));
      const visibleEnd = new Date(Math.min(eventEndObj.getTime(), monthEndObj.getTime()));

      const startDayNum = visibleStart.getDate();
      const endDayNum = visibleEnd.getDate();
      const spanDays = Math.max(1, endDayNum - startDayNum + 1);

      const dayWidthPercent = 100 / daysInMonth;
      const widthPercent = spanDays * dayWidthPercent;
      const rightOffsetPercent = (startDayNum - 1) * dayWidthPercent;

      let typeClass = 'evt-staff';
      switch (event.eventType) {
        case 'צוותי': typeClass = 'evt-staff'; break;
        case 'מנהלתי': typeClass = 'evt-admin'; break;
        case 'חברתי': typeClass = 'evt-social'; break;
        case 'פדגוגי': typeClass = 'evt-academic'; break;
        case 'טיול': typeClass = 'evt-trip'; break;
        case 'אחר': typeClass = 'evt-other'; break;
      }

      const gregDateStr = this.formatGregorianRange(event.startDate, event.endDate);
      const hebDateStr = this.formatHebrewRange(event.startDate, event.endDate);

      const bar = document.createElement('div');
      bar.className = `gantt-bar-item ${typeClass}`;
      bar.style.right = `${rightOffsetPercent}%`;
      bar.style.width = `${Math.min(100 - rightOffsetPercent, widthPercent)}%`;
      bar.title = `${event.title}\nסוג: ${event.eventType}\nתאריכים: ${gregDateStr}${hebDateStr ? ` (${hebDateStr})` : ''}\nלחץ לפתיחת פרטי האירוע`;

      bar.innerHTML = `
        <span class="gantt-bar-title">${event.title}</span>
        <span class="gantt-bar-dates">${event.startDate === event.endDate ? event.startDate.slice(5) : `${event.startDate.slice(5)} - ${event.endDate.slice(5)}`}</span>
      `;

      bar.addEventListener('click', () => {
        onEventClick(event);
      });

      row.appendChild(bar);
      rowsBody.appendChild(row);
    });

    content.appendChild(rowsBody);
    scrollContainer.appendChild(content);
    timelineArea.appendChild(scrollContainer);
    ganttMain.appendChild(timelineArea);

    container.appendChild(ganttMain);
  }
};

// Calendar Module for School Calendar & Gantt Application
// Renders the RTL Monthly Grid, day cells, and events with spanning segment styles.

import { DB } from './database.js';

export const Calendar = {
  // Hebrew month names mapping for Gregorian months
  HEBREW_GREGORIAN_MONTHS: [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ],

  /**
   * Main render function for the Monthly Grid Calendar view
   */
  render({
    year,
    month,
    containerId,
    events,
    filterType,
    filterGrade,
    onDayClick,
    onEventClick,
    selectedDate = '',
    onDaySelect = null
  }) {
    const gridContainer = document.getElementById(containerId);
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    // Calculate dates
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    // In JS: 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // Since Sunday is our first column on the far right (index 0),
    // the preceding padding days is equal to firstDayOfMonth.getDay()
    const precedingPaddingDays = firstDayOfMonth.getDay();
    
    // Total cells in grid (usually 35 or 42 to make a neat grid)
    const totalCellsNeeded = precedingPaddingDays + daysInMonth > 35 ? 42 : 35;

    // Helper to format date object to YYYY-MM-DD local string
    const formatDateKey = (y, m, d) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    // Prepare list of days to render
    const daysList = [];

    // 1. Previous Month Padding
    const prevMonthDate = new Date(year, month, 0);
    const prevMonthDaysCount = prevMonthDate.getDate();
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonthVal = prevMonthDate.getMonth();
    
    for (let i = precedingPaddingDays - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      daysList.push({
        dayNumber: d,
        dateKey: formatDateKey(prevMonthYear, prevMonthVal, d),
        isCurrentMonth: false
      });
    }

    // 2. Current Month Days
    for (let d = 1; d <= daysInMonth; d++) {
      daysList.push({
        dayNumber: d,
        dateKey: formatDateKey(year, month, d),
        isCurrentMonth: true
      });
    }

    // 3. Next Month Padding
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthVal = nextMonthDate.getMonth();
    const remainingCells = totalCellsNeeded - daysList.length;
    
    for (let d = 1; d <= remainingCells; d++) {
      daysList.push({
        dayNumber: d,
        dateKey: formatDateKey(nextMonthYear, nextMonthVal, d),
        isCurrentMonth: false
      });
    }

    // Get today's date key for highlighting
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Filter events based on criteria
    const filteredEvents = this.filterEvents(events, filterType, filterGrade);

    // Render cells to DOM
    daysList.forEach((day, index) => {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      
      if (!day.isCurrentMonth) {
        cell.classList.add('other-month');
      }
      if (day.dateKey === todayKey) {
        cell.classList.add('today');
      }
      
      const isMobile = window.innerWidth <= 768;
      
      // Highlight active selected day on mobile
      if (isMobile && day.dateKey === selectedDate) {
        cell.classList.add('active-day');
      }

      // Fetch Hebrew Date and base calendar status info
      const dateInfo = DB.getHebrewDateInfo(day.dateKey);
      
      if (dateInfo.status === 'Holiday') {
        cell.classList.add('holiday');
      } else if (dateInfo.status === 'Special Day') {
        cell.classList.add('special-day');
      }

      // Setup Date structure inside cell
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-number-wrapper';
      
      // Gematria Day (Top Right, Small)
      const hebrewLabel = document.createElement('span');
      hebrewLabel.className = 'hebrew-day-label-small';
      const hebrewDayGematria = dateInfo.hebrewDate.split(' ')[0] || '';
      hebrewLabel.textContent = hebrewDayGematria;
      
      // Gregorian Day (Top Left, Small)
      const gregNum = document.createElement('span');
      gregNum.className = 'gregorian-number-small';
      gregNum.textContent = day.dayNumber;
      
      dayHeader.appendChild(hebrewLabel);
      dayHeader.appendChild(gregNum);
      cell.appendChild(dayHeader);

      // Add Base Calendar labels if present (Holiday / Special Day description) - DESKTOP ONLY
      if (!isMobile) {
        if (dateInfo.status === 'Holiday' && dateInfo.description) {
          const holidayLabel = document.createElement('div');
          holidayLabel.className = 'holiday-cell-label';
          holidayLabel.textContent = dateInfo.description;
          holidayLabel.title = dateInfo.description;
          cell.appendChild(holidayLabel);
        } else if (dateInfo.status === 'Special Day' && dateInfo.description) {
          const specialLabel = document.createElement('div');
          specialLabel.className = 'special-cell-label';
          specialLabel.textContent = dateInfo.description;
          specialLabel.title = dateInfo.description;
          cell.appendChild(specialLabel);
        }
      }

      // Add events container
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'cell-events-container';
      cell.appendChild(eventsContainer);

      // Render events active on this day
      const dayOfWeek = index % 7; // 0 = Sunday (far right), 6 = Saturday (far left) in RTL
      this.renderEventsInCell(day.dateKey, dayOfWeek, filteredEvents, eventsContainer, onEventClick);

      // Bind cell click handler
      cell.addEventListener('click', (e) => {
        if (isMobile) {
          if (onDaySelect) onDaySelect(day.dateKey);
        } else {
          if (e.target.closest('.event-bar')) return;
          onDayClick(day.dateKey);
        }
      });

      gridContainer.appendChild(cell);
    });
  },

  /**
   * Filter events based on active dropdowns
   */
  filterEvents(events, filterType, filterGrade) {
    return events.filter(event => {
      // 1. Filter by Event Type
      if (filterType !== 'all' && event.eventType !== filterType) {
        return false;
      }
      
      // 2. Filter by Target Grade
      if (filterGrade !== 'all') {
        // If event specifies target grades, it must contain the selected grade.
        // If it specifies NO target grades (e.g. staff/admin events), it stays visible (doesn't get filtered out).
        if (event.targetGrades && event.targetGrades.length > 0) {
          return event.targetGrades.includes(filterGrade);
        }
      }
      
      return true;
    });
  },

  /**
   * Renders the event pills/bars in a single day cell
   */
  renderEventsInCell(dateKey, dayOfWeek, events, container, onEventClick) {
    const activeEvents = events.filter(event => {
      return dateKey >= event.startDate && dateKey <= event.endDate;
    });

    // Sort by start date, then duration, then ID to keep rendering order consistent across cells
    activeEvents.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      const aDuration = new Date(a.endDate) - new Date(a.startDate);
      const bDuration = new Date(b.endDate) - new Date(b.startDate);
      if (aDuration !== bDuration) return bDuration - aDuration;
      return a.id.localeCompare(b.id);
    });

    if (window.innerWidth <= 768) {
      if (activeEvents.length === 0) return;
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'mobile-dots-container';
      
      activeEvents.slice(0, 4).forEach(event => {
        const dot = document.createElement('span');
        let typeClass = 'evt-staff';
        switch (event.eventType) {
          case 'צוותי': typeClass = 'evt-staff'; break;
          case 'מנהלתי': typeClass = 'evt-admin'; break;
          case 'חברתי': typeClass = 'evt-social'; break;
          case 'פדגוגי': typeClass = 'evt-academic'; break;
          case 'טיול': typeClass = 'evt-trip'; break;
          case 'אחר': typeClass = 'evt-other'; break;
        }
        dot.className = `event-dot ${typeClass}`;
        dotsContainer.appendChild(dot);
      });
      container.appendChild(dotsContainer);
      return;
    }

    activeEvents.forEach(event => {
      const eventBar = document.createElement('div');
      
      // Determine segment types
      let segmentClass = 'single-day';
      if (event.startDate === event.endDate) {
        segmentClass = 'single-day';
      } else if (event.startDate === dateKey) {
        segmentClass = 'start-day';
      } else if (event.endDate === dateKey) {
        segmentClass = 'end-day';
      } else {
        segmentClass = 'middle-day';
      }

      // Type color class mapping
      let typeClass = 'evt-staff';
      switch (event.eventType) {
        case 'צוותי': typeClass = 'evt-staff'; break;
        case 'מנהלתי': typeClass = 'evt-admin'; break;
        case 'חברתי': typeClass = 'evt-social'; break;
        case 'פדגוגי': typeClass = 'evt-academic'; break;
        case 'טיול': typeClass = 'evt-trip'; break;
        case 'אחר': typeClass = 'evt-other'; break;
      }

      eventBar.className = `event-bar ${segmentClass} ${typeClass}`;
      eventBar.setAttribute('data-event-id', event.id);

      // Title Display Rule:
      // Show title on start day, or on Sunday (dayOfWeek === 0) so wrapped event bars repeat titles on new week rows
      if (segmentClass === 'single-day' || segmentClass === 'start-day' || dayOfWeek === 0) {
        eventBar.textContent = event.title;
        eventBar.title = `${event.title} (${event.eventType})`;
      } else {
        eventBar.textContent = '';
      }

      // Bind event click
      eventBar.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop click from triggering parent day cell click
        onEventClick(event);
      });

      container.appendChild(eventBar);
    });
  }
};

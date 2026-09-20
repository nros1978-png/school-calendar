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
    const isMobile = window.innerWidth <= 768;

    // Group days into weeks of 7 days
    const weeks = [];
    for (let i = 0; i < daysList.length; i += 7) {
      weeks.push(daysList.slice(i, i + 7));
    }

    weeks.forEach((weekDays) => {
      const weekRow = document.createElement('div');
      weekRow.className = 'calendar-week-row';

      // 1. Render 7 day background cells (grid-row: 1 / -1)
      weekDays.forEach((day, colIdx) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (colIdx === 6) cell.classList.add('is-last-col');
        cell.style.gridColumn = `${colIdx + 1}`;
        cell.style.gridRow = '1 / -1';

        if (!day.isCurrentMonth) cell.classList.add('other-month');
        if (day.dateKey === todayKey) cell.classList.add('today');
        if (isMobile && day.dateKey === selectedDate) cell.classList.add('active-day');

        const dateInfo = DB.getHebrewDateInfo(day.dateKey);
        if (dateInfo.status === 'Holiday') cell.classList.add('holiday');
        else if (dateInfo.status === 'Special Day') cell.classList.add('special-day');

        cell.addEventListener('click', () => {
          if (isMobile) {
            if (onDaySelect) onDaySelect(day.dateKey);
          } else {
            onDayClick(day.dateKey);
          }
        });

        weekRow.appendChild(cell);
      });

      // 2. Render 7 day headers (grid-row: 1)
      weekDays.forEach((day, colIdx) => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.style.gridColumn = `${colIdx + 1}`;
        header.style.gridRow = '1';

        if (!day.isCurrentMonth) header.classList.add('other-month');
        if (day.dateKey === todayKey) header.classList.add('today');

        const dateInfo = DB.getHebrewDateInfo(day.dateKey);
        if (dateInfo.status === 'Holiday') header.classList.add('holiday');
        else if (dateInfo.status === 'Special Day') header.classList.add('special-day');

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-number-wrapper';

        const hebrewLabel = document.createElement('span');
        hebrewLabel.className = 'hebrew-day-label-small';
        hebrewLabel.textContent = dateInfo.hebrewDate.split(' ')[0] || '';

        const gregNum = document.createElement('span');
        gregNum.className = 'gregorian-number-small';
        gregNum.textContent = day.dayNumber;

        dayHeader.appendChild(hebrewLabel);
        dayHeader.appendChild(gregNum);
        header.appendChild(dayHeader);

        if (!isMobile) {
          if (dateInfo.status === 'Holiday' && dateInfo.description) {
            const holidayLabel = document.createElement('div');
            holidayLabel.className = 'holiday-cell-label';
            holidayLabel.textContent = dateInfo.description;
            header.appendChild(holidayLabel);
          } else if (dateInfo.status === 'Special Day' && dateInfo.description) {
            const specialLabel = document.createElement('div');
            specialLabel.className = 'special-cell-label';
            specialLabel.textContent = dateInfo.description;
            header.appendChild(specialLabel);
          }
        } else {
          const activeDayEvents = filteredEvents.filter(e => day.dateKey >= e.startDate && day.dateKey <= e.endDate);
          if (activeDayEvents.length > 0) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'mobile-dots-container';
            activeDayEvents.slice(0, 4).forEach(evt => {
              const dot = document.createElement('span');
              let typeClass = 'evt-staff';
              switch (evt.eventType) {
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
            header.appendChild(dotsContainer);
          }
        }

        weekRow.appendChild(header);
      });

      // 3. Render Events in the week (Desktop only)
      if (!isMobile) {
        const weekStart = weekDays[0].dateKey;
        const weekEnd = weekDays[6].dateKey;

        const weekEvents = filteredEvents.filter(evt => {
          return !(evt.endDate < weekStart || evt.startDate > weekEnd);
        });

        const preparedEvents = weekEvents.map(evt => {
          const effectiveStart = evt.startDate < weekStart ? weekStart : evt.startDate;
          const effectiveEnd = evt.endDate > weekEnd ? weekEnd : evt.endDate;
          const startCol = weekDays.findIndex(d => d.dateKey === effectiveStart);
          const endCol = weekDays.findIndex(d => d.dateKey === effectiveEnd);
          const sCol = startCol !== -1 ? startCol : 0;
          const eCol = endCol !== -1 ? endCol : 6;
          const span = eCol - sCol + 1;
          return {
            event: evt,
            startCol: sCol,
            endCol: eCol,
            span: span,
            startsThisWeek: evt.startDate >= weekStart,
            endsThisWeek: evt.endDate <= weekEnd
          };
        });

        // Sort: multi-day spanning events first (longest span first), then earlier startCol, then earlier startDate
        preparedEvents.sort((a, b) => {
          if (b.span !== a.span) return b.span - a.span;
          if (a.startCol !== b.startCol) return a.startCol - b.startCol;
          if (a.event.startDate !== b.event.startDate) return a.event.startDate.localeCompare(b.event.startDate);
          return a.event.id.localeCompare(b.event.id);
        });

        // Packing into vertical slots
        const colSlots = [[], [], [], [], [], [], []];
        preparedEvents.forEach(item => {
          let slot = 0;
          while (true) {
            let conflict = false;
            for (let c = item.startCol; c <= item.endCol; c++) {
              if (colSlots[c][slot]) {
                conflict = true;
                break;
              }
            }
            if (!conflict) break;
            slot++;
          }
          for (let c = item.startCol; c <= item.endCol; c++) {
            colSlots[c][slot] = true;
          }
          item.slot = slot;
        });

        // Render event bars
        preparedEvents.forEach(item => {
          const eventBar = document.createElement('div');
          let typeClass = 'evt-staff';
          switch (item.event.eventType) {
            case 'צוותי': typeClass = 'evt-staff'; break;
            case 'מנהלתי': typeClass = 'evt-admin'; break;
            case 'חברתי': typeClass = 'evt-social'; break;
            case 'פדגוגי': typeClass = 'evt-academic'; break;
            case 'טיול': typeClass = 'evt-trip'; break;
            case 'אחר': typeClass = 'evt-other'; break;
          }

          let segmentClass = 'single-day';
          if (item.span > 1 || !item.startsThisWeek || !item.endsThisWeek) {
            segmentClass = 'multi-day-span';
            if (item.startsThisWeek && !item.endsThisWeek) segmentClass += ' continues-next';
            else if (!item.startsThisWeek && item.endsThisWeek) segmentClass += ' continues-prev';
            else if (!item.startsThisWeek && !item.endsThisWeek) segmentClass += ' continues-both';
          }

          eventBar.className = `event-bar ${segmentClass} ${typeClass}`;
          eventBar.setAttribute('data-event-id', item.event.id);
          eventBar.style.gridColumn = `${item.startCol + 1} / span ${item.span}`;
          eventBar.style.gridRow = `${item.slot + 2}`;

          const titleSuffix = (!item.startsThisWeek && item.span > 1) ? ' (המשך)' : '';
          eventBar.textContent = item.event.title + titleSuffix;
          eventBar.title = `${item.event.title} (${item.event.eventType})`;

          eventBar.addEventListener('click', (e) => {
            e.stopPropagation();
            onEventClick(item.event);
          });

          weekRow.appendChild(eventBar);
        });
      }

      gridContainer.appendChild(weekRow);
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
        if (event.targetGrades && event.targetGrades.length > 0) {
          return event.targetGrades.includes(filterGrade);
        }
      }
      
      return true;
    });
  }
};

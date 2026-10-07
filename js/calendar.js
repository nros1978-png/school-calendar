// Calendar Module for School Calendar & Gantt Application
// Renders the RTL Monthly Grid, day cells, and events with spanning segment styles.

import { DB } from './database.js';

// TV identification must never classify a phone as a kiosk.
function isTvDevice() {
  const ua = navigator.userAgent || '';
  return /SmartTV|Tizen|Web0S|webOS|HbbTV|BRAVIA|NetCast|POV_TV|Viera|Roku|AFT|MiBox|Shield|Chromecast|GoogleTV|AppleTV|DTV|OTT|LargeScreen|Android.*TV/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua) && navigator.maxTouchPoints === 0);
}
function isPhoneLayout() {
  return !isTvDevice() && (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent || '') || window.innerWidth <= 768);
}


function convertNumToGematriaDay(num) {
  const gematriaLetters = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
    10: 'י', 20: 'כ', 30: 'ל'
  };
  if (num <= 10) return gematriaLetters[num] + "'";
  if (num === 15) return 'ט"ו';
  if (num === 16) return 'ט"ז';
  const tens = Math.floor(num / 10) * 10;
  const ones = num % 10;
  if (ones === 0) return gematriaLetters[tens] + "'";
  return gematriaLetters[tens] + '"' + gematriaLetters[ones];
}

export const HebrewCalendar = {
  _cache: new Map(),

  getMonthsForYear(hebrewYear) {
    if (this._cache.has(hebrewYear)) {
      return this._cache.get(hebrewYear);
    }
    const approxGregYear = hebrewYear - 3761;
    let d = new Date(approxGregYear, 7, 15);
    const endRange = new Date(approxGregYear + 1, 9, 30);

    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const hebFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
      month: 'long'
    });

    const months = [];
    let currentMonthName = '';
    let currentMonthHebName = '';
    let currentMonthStart = null;
    let prevDate = null;

    while (d <= endRange) {
      const parts = formatter.formatToParts(d);
      let hYear = 0, hMonth = '', hDay = 0;
      for (const p of parts) {
        if (p.type === 'year') hYear = parseInt(p.value, 10);
        if (p.type === 'month') hMonth = p.value;
        if (p.type === 'day') hDay = parseInt(p.value, 10);
      }

      if (hYear === hebrewYear) {
        if (hMonth !== currentMonthName) {
          if (currentMonthStart && prevDate) {
            const daysCount = Math.round((prevDate - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1;
            months.push({
              name: currentMonthHebName,
              index: months.length,
              firstDate: new Date(currentMonthStart),
              lastDate: new Date(prevDate),
              daysCount: daysCount
            });
          }
          currentMonthName = hMonth;
          currentMonthHebName = hebFormatter.format(d).trim();
          currentMonthStart = new Date(d);
        }
        prevDate = new Date(d);
      } else if (hYear > hebrewYear && currentMonthStart && prevDate) {
        const daysCount = Math.round((prevDate - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1;
        months.push({
          name: currentMonthHebName,
          index: months.length,
          firstDate: new Date(currentMonthStart),
          lastDate: new Date(prevDate),
          daysCount: daysCount
        });
        break;
      }

      d.setDate(d.getDate() + 1);
    }

    this._cache.set(hebrewYear, months);
    return months;
  },

  getMonthGrid(hebrewYear, monthIndex) {
    const months = this.getMonthsForYear(hebrewYear);
    if (!months || months.length === 0) return { daysList: [], monthInfo: null, gregorianRangeStr: '' };
    const safeIndex = Math.max(0, Math.min(monthIndex, months.length - 1));
    const monthInfo = months[safeIndex];

    const firstDate = new Date(monthInfo.firstDate);
    const lastDate = new Date(monthInfo.lastDate);

    const startDayOfWeek = firstDate.getDay();
    const totalDays = monthInfo.daysCount;
    const totalCellsNeeded = (startDayOfWeek + totalDays > 35) ? 42 : 35;

    const formatDateKey = (dt) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const daysList = [];

    for (let i = startDayOfWeek; i > 0; i--) {
      const padDate = new Date(firstDate);
      padDate.setDate(padDate.getDate() - i);
      const dateKey = formatDateKey(padDate);
      const hebInfo = DB.getHebrewDateInfo(dateKey);
      const hebGematria = hebInfo.hebrewDate ? hebInfo.hebrewDate.split(' ')[0] : '';
      daysList.push({
        dayNumber: padDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: false
      });
    }

    for (let i = 0; i < totalDays; i++) {
      const curDate = new Date(firstDate);
      curDate.setDate(curDate.getDate() + i);
      const dateKey = formatDateKey(curDate);
      const hebGematria = convertNumToGematriaDay(i + 1);
      daysList.push({
        dayNumber: curDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: true
      });
    }

    const remainingCells = totalCellsNeeded - daysList.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      const dateKey = formatDateKey(nextDate);
      const hebInfo = DB.getHebrewDateInfo(dateKey);
      const hebGematria = hebInfo.hebrewDate ? hebInfo.hebrewDate.split(' ')[0] : '';
      daysList.push({
        dayNumber: nextDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: false
      });
    }

    const fmtDate = (dt) => `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}`;
    return {
      daysList,
      monthInfo,
      gregorianRangeStr: `${fmtDate(firstDate)} - ${fmtDate(lastDate)}`
    };
  },

  getTodayHebrewInfo() {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(today);
    let hYear = 5787;
    for (const p of parts) {
      if (p.type === 'year') hYear = parseInt(p.value, 10);
    }

    const months = this.getMonthsForYear(hYear);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let matchedIndex = 0;
    for (let i = 0; i < months.length; i++) {
      const s = new Date(months[i].firstDate.getFullYear(), months[i].firstDate.getMonth(), months[i].firstDate.getDate()).getTime();
      const e = new Date(months[i].lastDate.getFullYear(), months[i].lastDate.getMonth(), months[i].lastDate.getDate()).getTime();
      if (todayMid >= s && todayMid <= e) {
        matchedIndex = i;
        break;
      }
    }
    return {
      year: hYear,
      monthIndex: matchedIndex
    };
  },

  getHebrewMonthForDate(date) {
    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let hYear = 5787;
    for (const p of parts) {
      if (p.type === 'year') hYear = parseInt(p.value, 10);
    }
    const months = this.getMonthsForYear(hYear);
    const t = date.getTime();
    let matchedIndex = 0;
    for (let i = 0; i < months.length; i++) {
      if (t >= months[i].firstDate.getTime() && t <= months[i].lastDate.getTime()) {
        matchedIndex = i;
        break;
      }
    }
    return { year: hYear, monthIndex: matchedIndex };
  }
};

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
    calendarMode = 'hebrew',
    hebrewYear = 5787,
    hebrewMonthIndex = 0,
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

    const formatDateKey = (y, m, d) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    let daysList = [];
    const isFullscreen = document.body.classList.contains('fullscreen-mode');

    if (isFullscreen) {
      // Rolling 4-week kiosk display (current week at top + 3 weeks below, Sunday to Friday = 6 days per week, 24 days total)
      const today = new Date();
      const todayDayOfWeek = today.getDay(); // 0 is Sunday
      const currentSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayDayOfWeek);
      currentSunday.setHours(0, 0, 0, 0);

      for (let w = 0; w < 4; w++) {
        for (let dIdx = 0; dIdx < 6; dIdx++) { // 0 to 5 = Sunday to Friday (skipping Saturday)
          const d = new Date(currentSunday.getFullYear(), currentSunday.getMonth(), currentSunday.getDate() + (w * 7) + dIdx);
          const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
          const dateInfo = DB.getHebrewDateInfo(dateKey);
          const hebParts = dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ') : [];
          const dayGematria = hebParts[0] || '';
          const hebMonthName = (hebParts[1] || '').replace(/^[בל]/, '');
          const hebrewDayLabel = (dayGematria === "א'" && hebMonthName) ? `${dayGematria} ${hebMonthName}` : dayGematria;

          daysList.push({
            dayNumber: d.getDate(),
            hebrewDayGematria: hebrewDayLabel,
            dateKey: dateKey,
            isCurrentMonth: true // All 4 weeks are part of the active rolling window
          });
        }
      }
    } else if (calendarMode === 'hebrew') {
      const gridData = HebrewCalendar.getMonthGrid(hebrewYear, hebrewMonthIndex);
      daysList = gridData.daysList;
    } else {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const precedingPaddingDays = firstDayOfMonth.getDay();
      const totalCellsNeeded = precedingPaddingDays + daysInMonth > 35 ? 42 : 35;

      const prevMonthDate = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonthDate.getDate();
      const prevMonthYear = prevMonthDate.getFullYear();
      const prevMonthVal = prevMonthDate.getMonth();
      for (let i = precedingPaddingDays - 1; i >= 0; i--) {
        const d = prevMonthDaysCount - i;
        const dateKey = formatDateKey(prevMonthYear, prevMonthVal, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: false
        });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = formatDateKey(year, month, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: true
        });
      }

      const nextMonthDate = new Date(year, month + 1, 1);
      const nextMonthYear = nextMonthDate.getFullYear();
      const nextMonthVal = nextMonthDate.getMonth();
      const remainingCells = totalCellsNeeded - daysList.length;
      for (let d = 1; d <= remainingCells; d++) {
        const dateKey = formatDateKey(nextMonthYear, nextMonthVal, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: false
        });
      }
    }

    // Get today's date key for highlighting
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Filter events based on criteria
    const filteredEvents = this.filterEvents(events, filterType, filterGrade);
    const isMobile = !isFullscreen && isPhoneLayout();

    // Group days into weeks (6 days per week in fullscreen, 7 days in standard mode)
    const daysPerWeek = isFullscreen ? 6 : 7;
    const weeks = [];
    for (let i = 0; i < daysList.length; i += daysPerWeek) {
      weeks.push(daysList.slice(i, i + daysPerWeek));
    }

    weeks.forEach((weekDays) => {
      const weekRow = document.createElement('div');
      weekRow.className = 'calendar-week-row';

      const weekStart = weekDays[0].dateKey;
      const weekEnd = weekDays[weekDays.length - 1].dateKey;
      const lastColIdx = weekDays.length - 1;

      let preparedEvents = [];
      let numSlots = 0;

      if (!isMobile) {
        const weekEvents = filteredEvents.filter(evt => {
          return !(evt.endDate < weekStart || evt.startDate > weekEnd);
        });

        preparedEvents = weekEvents.map(evt => {
          const effectiveStart = evt.startDate < weekStart ? weekStart : evt.startDate;
          const effectiveEnd = evt.endDate > weekEnd ? weekEnd : evt.endDate;
          const startCol = weekDays.findIndex(d => d.dateKey === effectiveStart);
          const endCol = weekDays.findIndex(d => d.dateKey === effectiveEnd);
          const sCol = startCol !== -1 ? startCol : 0;
          const eCol = endCol !== -1 ? endCol : lastColIdx;
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
        const colSlots = Array.from({ length: daysPerWeek }, () => []);
        let maxSlot = -1;
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
          if (slot > maxSlot) maxSlot = slot;
        });
        numSlots = maxSlot + 1;
      }

      // Explicit grid rows:
      // Row 1: auto (for date numbers & holiday labels)
      // Row 2 to (numSlots + 1): slot height for each event slot
      // Last Row: bottom spacing
      const slotTrackHeight = isFullscreen ? 'minmax(0, 1fr)' : '26px';
      weekRow.dataset.eventSlots = String(numSlots);
      const bottomSpacing = isFullscreen ? '2px' : 'minmax(8px, 1fr)';
      const rowTemplates = ['auto'];
      for (let s = 0; s < numSlots; s++) {
        rowTemplates.push(slotTrackHeight);
      }
      rowTemplates.push(bottomSpacing);
      weekRow.style.gridTemplateRows = rowTemplates.join(' ');

      const totalRowTracks = numSlots + 2;

      // 1. Render day background cells (spanning row 1 to the end)
      weekDays.forEach((day, colIdx) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (colIdx === lastColIdx) cell.classList.add('is-last-col');
        cell.style.gridColumn = `${colIdx + 1}`;
        cell.style.gridRow = `1 / ${totalRowTracks + 1}`;

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

        const primaryLabel = document.createElement('span');
        primaryLabel.className = 'day-number-primary';

        const secondaryLabel = document.createElement('span');
        secondaryLabel.className = 'day-number-secondary';

        if (calendarMode === 'hebrew' || isFullscreen) {
          primaryLabel.textContent = day.hebrewDayGematria || (dateInfo.hebrewDate.split(' ')[0] || '');
          secondaryLabel.textContent = day.dayNumber;
          dayHeader.appendChild(primaryLabel);
          dayHeader.appendChild(secondaryLabel);
        } else {
          primaryLabel.textContent = day.dayNumber;
          secondaryLabel.textContent = day.hebrewDayGematria || (dateInfo.hebrewDate.split(' ')[0] || '');
          dayHeader.appendChild(secondaryLabel);
          dayHeader.appendChild(primaryLabel);
        }

        header.appendChild(dayHeader);

        if (!isMobile) {
          if (dateInfo.status === 'Holiday' && dateInfo.description) {
            const holidayLabel = document.createElement('div');
            holidayLabel.className = 'holiday-cell-label';
            holidayLabel.textContent = dateInfo.description;
            if (isFullscreen) {
              const descLen = (dateInfo.description || '').length;
              let hFont = 0.74;
              if (numSlots >= 4 || descLen > 25) hFont = 0.60;
              else if (numSlots >= 3 || descLen > 18) hFont = 0.65;
              else if (descLen > 12) hFont = 0.70;
              holidayLabel.style.fontSize = `${hFont}rem`;
              holidayLabel.style.lineHeight = '1.12';
            }
            header.appendChild(holidayLabel);
          } else if (dateInfo.status === 'Special Day' && dateInfo.description) {
            const specialLabel = document.createElement('div');
            specialLabel.className = 'special-cell-label';
            specialLabel.textContent = dateInfo.description;
            if (isFullscreen) {
              const descLen = (dateInfo.description || '').length;
              let sFont = 0.74;
              if (numSlots >= 4 || descLen > 25) sFont = 0.60;
              else if (numSlots >= 3 || descLen > 18) sFont = 0.65;
              else if (descLen > 12) sFont = 0.70;
              specialLabel.style.fontSize = `${sFont}rem`;
              specialLabel.style.lineHeight = '1.12';
            }
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

          if (isFullscreen) {
            const titleLen = (item.event.title || '').length;
            let evFont = 0.82;
            if (numSlots <= 1) evFont = titleLen > 20 ? 0.76 : 0.85;
            else if (numSlots === 2) evFont = titleLen > 20 ? 0.72 : 0.80;
            else if (numSlots === 3) evFont = titleLen > 20 ? 0.65 : 0.72;
            else if (numSlots === 4) evFont = titleLen > 20 ? 0.58 : 0.65;
            else evFont = titleLen > 20 ? 0.52 : 0.58;

            eventBar.style.fontSize = `${evFont}rem`;
            eventBar.style.lineHeight = evFont < 0.65 ? '1.05' : '1.15';
          }

          eventBar.addEventListener('click', (e) => {
            e.stopPropagation();
            onEventClick(item.event);
          });

          weekRow.appendChild(eventBar);
        });
      }

      gridContainer.appendChild(weekRow);
    });
    if (isFullscreen) requestAnimationFrame(() => this.fitTvLayout(gridContainer));
  },
fitTvLayout(container) {
    if (!document.body.classList.contains('fullscreen-mode') || !container.isConnected) return;
    const fitText = (element, initial, minimum) => {
      let size = initial;
      element.style.setProperty('font-size', size + 'px', 'important');
      element.style.setProperty('line-height', '1.08', 'important');
      while (size > minimum && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1)) {
        size -= 0.5;
        element.style.setProperty('font-size', size + 'px', 'important');
      }
    };
    container.querySelectorAll('.calendar-week-row').forEach(row => {
      const headers = Array.from(row.querySelectorAll('.calendar-day-header'));
      const count = Number(row.dataset.eventSlots || 0);
      const budget = Math.max(20, row.clientHeight * (count ? 0.38 : 0.8));
      headers.forEach(header => {
        header.style.maxHeight = budget + 'px';
        header.querySelectorAll('.holiday-cell-label, .special-cell-label').forEach(label => {
          label.style.maxHeight = Math.max(8, budget - 24) + 'px';
          fitText(label, 12, 5);
        });
      });
      const headerHeight = Math.min(budget, Math.max(24, ...headers.map(header => header.scrollHeight)));
      row.style.gridTemplateRows = [headerHeight + 'px', ...Array(count).fill('minmax(0, 1fr)'), '2px'].join(' ');
      row.querySelectorAll('.event-bar').forEach(bar => fitText(bar, 14, 4));
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

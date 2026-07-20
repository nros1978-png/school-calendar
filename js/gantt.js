// Gantt Chart Module for School Calendar & Gantt Application
// Renders the RTL horizontal timeline for events.

import { DB } from './database.js';
import { Calendar } from './calendar.js';

export const Gantt = {
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
      // Event overlaps with this month if event.startDate <= monthEnd and event.endDate >= monthStart
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
        <div class="gantt-container">
          <div class="gantt-no-data">
            <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
            אין אירועים רלוונטיים להצגה במערכת הגאנט לחודש זה.
          </div>
        </div>
      `;
      return;
    }

    // Build the Gantt structure
    const ganttContainer = document.createElement('div');
    ganttContainer.className = 'gantt-container';

    // 1. Render Header Row
    const headerRow = document.createElement('div');
    headerRow.className = 'gantt-header-row';

    const titleColHeader = document.createElement('div');
    titleColHeader.className = 'gantt-title-col';
    titleColHeader.textContent = 'שם האירוע וסוגו';
    headerRow.appendChild(titleColHeader);

    const timelineWrapper = document.createElement('div');
    timelineWrapper.className = 'gantt-timeline-wrapper';

    const timelineDays = document.createElement('div');
    timelineDays.className = 'gantt-timeline-days';
    timelineDays.style.minWidth = `${daysInMonth * 36}px`; // ensure consistent column width

    // Weekdays letters mapping in Hebrew
    const WEEKDAYS_HEBREW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'gantt-timeline-day-header';
      
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      
      // Highlight weekends (Friday/Saturday)
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        dayHeader.classList.add('weekend');
      }

      // Display weekday letter + day number
      dayHeader.innerHTML = `
        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">${WEEKDAYS_HEBREW[dayOfWeek]}</span>
        <span style="font-weight: 700; margin-top: 2px;">${day}</span>
      `;
      timelineDays.appendChild(dayHeader);
    }
    timelineWrapper.appendChild(timelineDays);
    headerRow.appendChild(timelineWrapper);
    ganttContainer.appendChild(headerRow);

    // 2. Render Event Rows
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'gantt-rows-container';

    activeEvents.forEach(event => {
      const row = document.createElement('div');
      row.className = 'gantt-row';

      // Event Name Cell
      const titleCell = document.createElement('div');
      titleCell.className = 'gantt-event-title-cell';
      titleCell.textContent = event.title;
      titleCell.title = `${event.title} (${event.eventType})`;
      row.appendChild(titleCell);

      // Event Timeline Grid Cell
      const timelineCellWrapper = document.createElement('div');
      timelineCellWrapper.className = 'gantt-timeline-wrapper';

      const gridCellContainer = document.createElement('div');
      gridCellContainer.className = 'gantt-grid-cell-container';
      gridCellContainer.style.minWidth = `${daysInMonth * 36}px`;

      // Render Grid Lines behind the Gantt bar
      const gridLines = document.createElement('div');
      gridLines.className = 'gantt-grid-lines';
      for (let day = 1; day <= daysInMonth; day++) {
        const line = document.createElement('div');
        line.className = 'gantt-grid-line';
        
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          line.classList.add('weekend');
        }
        
        gridLines.appendChild(line);
      }
      gridCellContainer.appendChild(gridLines);

      // Calculate Gantt Bar Positions (RTL layout)
      // We parse event start/end dates
      const startParts = event.startDate.split('-');
      const endParts = event.endDate.split('-');

      const eventStartObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const eventEndObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      
      const monthStartObj = new Date(year, month, 1);
      const monthEndObj = new Date(year, month, daysInMonth);

      // Clamp event dates to current month boundaries for visual plotting
      const visibleStart = new Date(Math.max(eventStartObj.getTime(), monthStartObj.getTime()));
      const visibleEnd = new Date(Math.min(eventEndObj.getTime(), monthEndObj.getTime()));

      const startDayNum = visibleStart.getDate();
      const endDayNum = visibleEnd.getDate();
      const spanDays = endDayNum - startDayNum + 1;

      // Draw Gantt Bar
      const dayWidthPercent = 100 / daysInMonth;
      const widthPercent = spanDays * dayWidthPercent;
      // In RTL, the timeline flows from right to left.
      // Day 1 is on the far right, Day 31 on the far left.
      // The offset from the right edge is proportional to (startDayNum - 1)
      const rightOffsetPercent = (startDayNum - 1) * dayWidthPercent;

      const bar = document.createElement('div');
      
      let typeClass = 'evt-staff';
      switch (event.eventType) {
        case 'צוותי': typeClass = 'evt-staff'; break;
        case 'מנהלתי': typeClass = 'evt-admin'; break;
        case 'חברתי': typeClass = 'evt-social'; break;
        case 'פדגוגי': typeClass = 'evt-academic'; break;
        case 'טיול': typeClass = 'evt-trip'; break;
        case 'אחר': typeClass = 'evt-other'; break;
      }
      
      bar.className = `gantt-bar ${typeClass}`;
      bar.style.right = `${rightOffsetPercent}%`;
      bar.style.width = `${widthPercent}%`;
      
      // Display title on the bar (only if there's enough space, otherwise it overflows gracefully)
      bar.textContent = event.title;
      bar.title = `${event.title}\nסוג: ${event.eventType}\nתאריכים: ${event.startDate} עד ${event.endDate}`;

      // Click callback
      bar.addEventListener('click', () => {
        onEventClick(event);
      });

      gridCellContainer.appendChild(bar);
      timelineCellWrapper.appendChild(gridCellContainer);
      row.appendChild(timelineCellWrapper);
      rowsContainer.appendChild(row);
    });

    ganttContainer.appendChild(rowsContainer);
    container.appendChild(ganttContainer);
  }
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  generateCalendarDays,
  calculateOccupancyForDate,
  getOccupancyColor,
  isBookingOnDate,
} from '../utils/dateUtils';
import DayCell from './DayCell';
import YearHeatmap from './YearHeatmap';
import './Calendar.css';

function Calendar({ currentDate, bookings, selectedRange, onSelectRange, filters, view, searchQuery }) {
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [focusedDate, setFocusedDate] = useState(null);
  const calendarRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const dragEndRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = generateCalendarDays(year, month);
  const rowCount = Math.ceil(days.length / 7);

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    if (filters.roomType !== 'all' && booking.roomType !== filters.roomType) {
      return false;
    }
    if (
      filters.bookingStatus !== 'all' &&
      booking.status !== filters.bookingStatus
    ) {
      return false;
    }
    if (filters.source && filters.source !== 'all' && booking.source !== filters.source) return false;
    return true;
  }), [bookings, filters]);

  const handleDayMouseDown = (dateObj) => {
    setDragging(true);
    draggingRef.current = true;
    setDragStart(dateObj);
    dragStartRef.current = dateObj;
  };

  const handleDayMouseEnter = (dateObj) => {
    if (draggingRef.current && dragStartRef.current) {
      dragEndRef.current = dateObj;
      // Sort dates to get proper range
      const start = new Date(dragStartRef.current.year, dragStartRef.current.month, dragStartRef.current.day);
      const end = new Date(dateObj.year, dateObj.month, dateObj.day);
      const [minDate, maxDate] = start <= end ? [start, end] : [end, start];

      onSelectRange({ start: minDate, end: maxDate });
    }
  };

  const handleDayMouseUp = (dateObj) => {
    const finalDate = dragEndRef.current || dateObj;

    if (dragStartRef.current) {
      const start = new Date(dragStartRef.current.year, dragStartRef.current.month, dragStartRef.current.day);
      const end = new Date(finalDate.year, finalDate.month, finalDate.day);
      const [minDate, maxDate] = start <= end ? [start, end] : [end, start];

      onSelectRange({ start: minDate, end: maxDate });
      setFocusedDate(end);
    } else {
      // Fallback for clicks that do not begin with a mousedown on a day cell.
      const date = new Date(dateObj.year, dateObj.month, dateObj.day);
      onSelectRange({ start: date, end: date });
      setFocusedDate(date);
    }
    setDragging(false);
    draggingRef.current = false;
    setDragStart(null);
    dragStartRef.current = null;
    dragEndRef.current = null;
  };

  const handleMouseUp = () => {
    setDragging(false);
    draggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    const onKey = (e) => {
      if (!focusedDate) return;
      let delta = null;
      if (e.key === 'ArrowLeft') delta = -1;
      if (e.key === 'ArrowRight') delta = 1;
      if (e.key === 'ArrowUp') delta = -7;
      if (e.key === 'ArrowDown') delta = 7;
      if (delta !== null) {
        e.preventDefault();
        const d = new Date(focusedDate);
        d.setDate(d.getDate() + delta);
        if (e.shiftKey) {
          // extend selection
          const start = new Date(selectedRange?.start || focusedDate);
          const end = d;
          const [minDate, maxDate] = start <= end ? [start, end] : [end, start];
          onSelectRange({ start: minDate, end: maxDate });
        } else {
          setFocusedDate(d);
          onSelectRange({ start: d, end: d });
        }
      }
        if (e.key === 'Escape') {
          setFocusedDate(null);
          onSelectRange(null);
        }
      if (e.key === 'Enter') {
        const d = new Date(focusedDate);
        onSelectRange({ start: d, end: d });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [focusedDate, onSelectRange, selectedRange]);

  const isDateInRange = (dateObj) => {
    if (!selectedRange) return false;
    const date = new Date(dateObj.year, dateObj.month, dateObj.day);
    const start = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  // Precompute occupancy map for visible days to avoid repeated calculations
  const occupancyMap = useMemo(() => {
    const map = new Map();
    for (const d of days) {
      const key = `${d.year}-${d.month}-${d.day}`;
      map.set(key, calculateOccupancyForDate(filteredBookings, d));
    }
    return map;
  }, [filteredBookings, days]);

  // Search highlighting: check if any booking on that date matches searchQuery guest name
  const matchesSearch = (dateObj) => {
    if (!searchQuery || searchQuery.trim() === '') return false;
    const q = searchQuery.trim().toLowerCase();
    for (const b of filteredBookings) {
      if (b.guestName && b.guestName.toLowerCase().includes(q)) {
        if (isBookingOnDate(b, dateObj)) return true;
      }
    }
    return false;
  };

  if (view === 'year') {
    return <YearHeatmap year={year} bookings={bookings} filters={filters} />;
  }

  return (
    <div className="calendar" ref={calendarRef} role="grid" aria-rowcount={rowCount} aria-colcount={7}>
      <div className="calendar-grid">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div key={dayName} className="day-header">
            {dayName}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((dateObj, index) => {
          const key = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
          const occupancy = occupancyMap.get(key) || 0;
          const isSelected = isDateInRange(dateObj);
          const bgColor = getOccupancyColor(occupancy);
          const searchHit = matchesSearch(dateObj);
          const focusedMatch = focusedDate &&
            focusedDate.getFullYear() === dateObj.year &&
            focusedDate.getMonth() === dateObj.month &&
            focusedDate.getDate() === dateObj.day;
          const tabIndex = focusedMatch || (!focusedDate && index === 0) ? 0 : -1;

          return (
            <DayCell
              key={index}
              dateObj={dateObj}
              occupancy={occupancy}
              bgColor={bgColor}
              isSelected={isSelected}
              onFocusCell={(d) => setFocusedDate(new Date(d.year, d.month, d.day))}
              tabIndex={tabIndex}
              onMouseDown={() => handleDayMouseDown(dateObj)}
              onMouseEnter={() => handleDayMouseEnter(dateObj)}
              onMouseUp={() => handleDayMouseUp(dateObj)}
              isSearchHit={searchHit}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

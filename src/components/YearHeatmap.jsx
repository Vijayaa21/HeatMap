import React, { useMemo } from 'react';
import {
  calculateOccupancyForDate,
  getOccupancyColor,
  generateCalendarDays,
} from '../utils/dateUtils';
import './YearHeatmap.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function YearHeatmap({ year, bookings, filters }) {
  const filtered = useMemo(() => bookings.filter((b) => {
    if (filters.roomType && filters.roomType !== 'all' && b.roomType !== filters.roomType) return false;
    if (filters.bookingStatus && filters.bookingStatus !== 'all' && b.status !== filters.bookingStatus) return false;
    if (filters.source && filters.source !== 'all' && b.source !== filters.source) return false;
    return true;
  }), [bookings, filters]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const days = generateCalendarDays(year, monthIndex);
      const monthDays = days.filter((day) => day.year === year && day.month === monthIndex);
      const occupancyByDate = new Map();

      for (const day of days) {
        if (day.month === monthIndex) {
          const key = `${day.year}-${day.month}-${day.day}`;
          occupancyByDate.set(key, calculateOccupancyForDate(filtered, day));
        }
      }

      return {
        monthIndex,
        monthName: MONTH_NAMES[monthIndex],
        days,
        monthDays,
        occupancyByDate,
      };
    });
  }, [filtered, year]);

  return (
    <div className="year-heatmap">
      <div className="year-header">
        <div>
          <h3>{year} Overview</h3>
          <p>Each month is shown as a compact calendar with occupancy color-coded by night.</p>
        </div>
        <div className="year-legend" aria-label="Occupancy legend">
          <span><i style={{ backgroundColor: getOccupancyColor(0) }} /> 0</span>
          <span><i style={{ backgroundColor: getOccupancyColor(3) }} /> Low</span>
          <span><i style={{ backgroundColor: getOccupancyColor(6) }} /> Medium</span>
          <span><i style={{ backgroundColor: getOccupancyColor(10) }} /> High</span>
        </div>
      </div>

      <div className="year-month-grid">
        {months.map((month) => (
          <section key={month.monthIndex} className="year-month-card">
            <div className="year-month-title">{month.monthName}</div>
            <div className="year-month-days day-labels">
              {DAY_NAMES.map((dayName) => (
                <span key={dayName}>{dayName}</span>
              ))}
            </div>
            <div className="year-month-days">
              {month.days.map((day, index) => {
                const isCurrentMonth = day.month === month.monthIndex;
                const key = `${day.year}-${day.month}-${day.day}`;
                const occ = month.occupancyByDate.get(key) ?? 0;
                const title = `${new Date(day.year, day.month, day.day).toISOString().slice(0, 10)} — ${occ}/10`;

                return (
                  <div
                    key={`${month.monthIndex}-${index}`}
                    className={`year-day ${isCurrentMonth ? '' : 'other-month'}`.trim()}
                    title={title}
                    style={{ backgroundColor: isCurrentMonth ? getOccupancyColor(occ) : '#f1f5f9' }}
                  >
                    <span>{day.day}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default YearHeatmap;

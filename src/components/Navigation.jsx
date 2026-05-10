import React from 'react';
import { getMonthLabel } from '../utils/dateUtils';
import './Navigation.css';

function Navigation({ currentDate, onPrevious, onNext, onToday, view, onChangeView }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const label = view === 'year' ? year : getMonthLabel(year, month);
  const prevTitle = view === 'year' ? 'Previous year' : 'Previous month';
  const nextTitle = view === 'year' ? 'Next year' : 'Next month';

  return (
    <div className="navigation">
      <button className="nav-button" onClick={onPrevious} title={prevTitle}>
        ← Previous
      </button>

      <button className="nav-button today-btn" onClick={onToday}>
        Today
      </button>

      <h2 className="month-label">{label}</h2>

      <button className="nav-button" onClick={onNext} title={nextTitle}>
        Next →
      </button>
      <div style={{ marginLeft: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, color: '#555' }}>View:</label>
        <select
          value={view}
          onChange={(e) => onChangeView && onChangeView(e.target.value)}
          style={{ padding: '6px', borderRadius: '6px' }}
        >
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>
    </div>
  );
}

export default Navigation;

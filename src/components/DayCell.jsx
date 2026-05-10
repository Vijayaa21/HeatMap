import React from 'react';
import { isToday } from '../utils/dateUtils';
import './DayCell.css';

function DayCellComp({
  dateObj,
  occupancy,
  bgColor,
  isSelected,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  isSearchHit,
  onFocusCell,
  tabIndex,
}) {
  const today = isToday(dateObj);
  const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(
    dateObj.day
  ).padStart(2, '0')}`;

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={tabIndex}
      onFocus={() => onFocusCell && onFocusCell(dateObj)}
      className={`day-cell ${!dateObj.isCurrentMonth ? 'other-month' : ''} ${
        isSelected ? 'selected' : ''
      } ${today ? 'today' : ''} ${isSearchHit ? 'search-hit' : ''}`}
      style={{ backgroundColor: bgColor }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      data-tooltip={`${dateStr} — ${occupancy}/10`}
    >
      <div className="day-number">{dateObj.day}</div>
      <div className="occupancy-info">
        <span className="occupancy-badge">{occupancy}/10</span>
      </div>
      {isSearchHit && <div className="search-indicator" title="Search match" />}
    </div>
  );
}

function areEqual(prev, next) {
  // shallow compare the props we care about to avoid re-renders
  return (
    prev.dateObj.day === next.dateObj.day &&
    prev.dateObj.month === next.dateObj.month &&
    prev.dateObj.year === next.dateObj.year &&
    prev.occupancy === next.occupancy &&
    prev.isSelected === next.isSelected &&
    prev.isSearchHit === next.isSearchHit &&
    prev.bgColor === next.bgColor
  );
}

const DayCell = React.memo(DayCellComp, areEqual);

export default DayCell;

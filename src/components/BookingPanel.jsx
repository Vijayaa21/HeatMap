import React, { useMemo } from 'react';
import {
  getBookingsInRange,
  formatDateDisplay,
  calculateNights,
  parseDateString,
} from '../utils/dateUtils';
import './BookingPanel.css';

function BookingPanel({ bookings, selectedRange, filters, onFilterChange, onSearchChange, searchQuery }) {
  const filteredBookings = useMemo(() => {
    if (!selectedRange) return [];

    const rangeBookings = getBookingsInRange(
      bookings,
      selectedRange.start,
      new Date(selectedRange.end.getTime() + 86400000) // Add 1 day to include end date
    );

    return rangeBookings.filter((booking) => {
      if (filters.roomType !== 'all' && booking.roomType !== filters.roomType) {
        return false;
      }
      if (
        filters.bookingStatus !== 'all' &&
        booking.status !== filters.bookingStatus
      ) {
        return false;
      }
      if (filters.source && filters.source !== 'all' && booking.source !== filters.source) {
        return false;
      }
      if (searchQuery && searchQuery.trim() !== '') {
        if (!booking.guestName || !booking.guestName.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, selectedRange, filters]);

  const roomTypes = useMemo(() => {
    const types = new Set(bookings.map((b) => b.roomType));
    return Array.from(types).sort();
  }, [bookings]);

  const statuses = useMemo(() => {
    const statusSet = new Set(bookings.map((b) => b.status));
    return Array.from(statusSet).sort();
  }, [bookings]);

  const sources = useMemo(() => {
    const s = new Set(bookings.map((b) => b.source));
    return Array.from(s).sort();
  }, [bookings]);

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const csv = [
      ['ID', 'Guest', 'Room', 'Type', 'Check-In', 'Check-Out', 'Nights', 'Amount', 'Status', 'Source'].join(','),
      ...filteredBookings.map((b) =>
        [
          b.id,
          `"${b.guestName}"`,
          b.roomNumber,
          b.roomType,
          b.checkIn,
          b.checkOut,
          calculateNights(b.checkIn, b.checkOut),
          b.totalAmount,
          b.status,
          b.source,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="booking-panel">
      <h3>Booking Details</h3>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ color: '#666', fontSize: 13 }}>Selected range details</div>
        <div>
          <button
            className="nav-button"
            onClick={() => onFilterChange && onFilterChange({ roomType: 'all', bookingStatus: 'all', source: 'all' })}
            title="Reset filters"
            style={{ marginRight: 8 }}
          >
            Reset Filters
          </button>
          <button
            className="nav-button"
            onClick={() => {
              // clear selection by emitting null through window event handled in App
              const evt = new CustomEvent('hb_clear_selection');
              window.dispatchEvent(evt);
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {selectedRange && (
        <div className="date-range-info">
          <p>
            Selected: <strong>
              {selectedRange.start.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {selectedRange.start.getTime() !== selectedRange.end.getTime() && (
                <>
                  {' '} to {' '}
                  {selectedRange.end.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </>
              )}
            </strong>
          </p>
        </div>
      )}

      <div className="filters">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Search guest name..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </label>
        <label>
          Room Type:
          <select
            value={filters.roomType}
            onChange={(e) =>
              onFilterChange({ ...filters, roomType: e.target.value })
            }
          >
            <option value="all">All Types</option>
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status:
          <select
            value={filters.bookingStatus}
            onChange={(e) =>
              onFilterChange({ ...filters, bookingStatus: e.target.value })
            }
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Source:
          <select
            value={filters.source}
            onChange={(e) => onFilterChange({ ...filters, source: e.target.value })}
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bookings-list">
        {filteredBookings.length > 0 ? (
          <>
            <p className="booking-count">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>
            {filteredBookings.map((booking) => (
              <div key={booking.id} className={`booking-item status-${booking.status}`}>
                <div className="booking-header">
                  <strong>{booking.guestName}</strong>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-details">
                  <p>
                    <span>Room:</span> {booking.roomNumber} ({booking.roomType})
                  </p>
                  <p>
                    <span>Check-in:</span> {booking.checkIn}
                  </p>
                  <p>
                    <span>Check-out:</span> {booking.checkOut}
                  </p>
                  <p>
                    <span>Nights:</span> {calculateNights(booking.checkIn, booking.checkOut)}
                  </p>
                  <p>
                    <span>Amount:</span> ₹{booking.totalAmount.toLocaleString()}
                  </p>
                  <p>
                    <span>Source:</span> {booking.source}
                  </p>
                </div>
              </div>
            ))}
            <button className="export-btn" onClick={handleExport}>
              📥 Export as CSV
            </button>
          </>
        ) : (
          <p className="no-bookings">
            {selectedRange
              ? 'No bookings in selected range'
              : 'Select a date range to view bookings'}
          </p>
        )}
      </div>
    </div>
  );
}

export default BookingPanel;

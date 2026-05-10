import React, { useMemo } from 'react';
import {
  calculateOccupancyForDate,
  generateCalendarDays,
  calculateNights,
  parseDateString,
} from '../utils/dateUtils';
import './StatsHeader.css';

function StatsHeader({ bookings, currentDate }) {
  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = generateCalendarDays(year, month);

    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const msPerDay = 24 * 60 * 60 * 1000;

    // Calculate total occupancy for the month
    let totalOccupancy = 0;
    currentMonthDays.forEach((dateObj) => {
      totalOccupancy += calculateOccupancyForDate(activeBookings, dateObj);
    });

    const avgOccupancy = currentMonthDays.length > 0
      ? ((totalOccupancy / (currentMonthDays.length * 10)) * 100)
      : 0;

    // Calculate revenue using bookings that overlap the visible month.
    // Revenue is prorated to only include nights that fall inside the month.
    const monthBookings = activeBookings.filter((booking) => {
      const bookingStart = parseDateString(booking.checkIn);
      const bookingEnd = parseDateString(booking.checkOut);
      return bookingStart < monthEnd && bookingEnd > monthStart;
    });

    const totalRevenue = monthBookings.reduce((sum, booking) => {
      const bookingStart = parseDateString(booking.checkIn);
      const bookingEnd = parseDateString(booking.checkOut);
      const bookingNights = calculateNights(booking.checkIn, booking.checkOut);
      const overlapStart = bookingStart > monthStart ? bookingStart : monthStart;
      const overlapEnd = bookingEnd < monthEnd ? bookingEnd : monthEnd;
      const overlapNights = Math.max(0, Math.round((overlapEnd - overlapStart) / msPerDay));
      const nightlyRate = bookingNights > 0 ? booking.totalAmount / bookingNights : 0;

      return sum + (nightlyRate * overlapNights);
    }, 0);

    // Find longest stay
    let longestStay = 0;
    activeBookings.forEach((b) => {
      const nights = calculateNights(b.checkIn, b.checkOut);
      if (nights > longestStay) longestStay = nights;
    });

    // Find most booked room
    const roomCounts = {};
    activeBookings.forEach((b) => {
      roomCounts[b.roomNumber] = (roomCounts[b.roomNumber] || 0) + 1;
    });

    const mostBookedRoom = Object.keys(roomCounts).length > 0
      ? Object.entries(roomCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : 'N/A';

    // Find most booked room type
    const roomTypeCounts = {};
    activeBookings.forEach((b) => {
      roomTypeCounts[b.roomType] = (roomTypeCounts[b.roomType] || 0) + 1;
    });

    const mostBookedRoomType = Object.keys(roomTypeCounts).length > 0
      ? Object.entries(roomTypeCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : 'N/A';

    return {
      avgOccupancy,
      totalRevenue,
      longestStay,
      mostBookedRoom,
      mostBookedRoomType,
      totalBookings: activeBookings.length,
    };
  }, [bookings, currentDate]);

  return (
    <div className="stats-header">
      <div className="stat-card">
        <div className="stat-value">{stats.avgOccupancy.toFixed(1)}%</div>
        <div className="stat-label">Avg Occupancy</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
        <div className="stat-label">Total Revenue</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.longestStay}</div>
        <div className="stat-label">Longest Stay (nights)</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">Room {stats.mostBookedRoom}</div>
        <div className="stat-label">Most Booked</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.mostBookedRoomType}</div>
        <div className="stat-label">Popular Type</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.totalBookings}</div>
        <div className="stat-label">Total Bookings</div>
      </div>
    </div>
  );
}

export default StatsHeader;

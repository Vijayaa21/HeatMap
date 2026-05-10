/**
 * Date utility functions for calendar operations
 * Handles month calculations, day arrangements, and occupancy logic
 */

/**
 * Get the first day of a given month (0-6, where 0=Sunday)
 */
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

/**
 * Get the number of days in a given month
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Generate all dates to display in a month view (including previous/next month padding)
 * Returns array of date objects with metadata
 */
export const generateCalendarDays = (year, month) => {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const days = [];

  // Previous month's days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push({
      date: new Date(prevYear, prevMonth, day),
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      day: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month's days
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    days.push({
      date: new Date(nextYear, nextMonth, i),
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  return days;
};

/**
 * Check if a booking overlaps with a specific date
 * IMPORTANT: checkout date is exclusive (room is free on checkout day)
 */
export const isBookingOnDate = (booking, dateObj) => {
  if (booking.status === 'cancelled') return false;

  const bookingCheckIn = new Date(booking.checkIn);
  bookingCheckIn.setHours(0, 0, 0, 0);

  const bookingCheckOut = new Date(booking.checkOut);
  bookingCheckOut.setHours(0, 0, 0, 0);

  const checkDate = new Date(dateObj.year, dateObj.month, dateObj.day);
  checkDate.setHours(0, 0, 0, 0);

  // Room is occupied from checkIn (inclusive) to checkOut (exclusive)
  return checkDate >= bookingCheckIn && checkDate < bookingCheckOut;
};

/**
 * Calculate occupancy for a specific date
 * Returns number of occupied rooms
 */
export const calculateOccupancyForDate = (bookings, dateObj) => {
  let occupiedRooms = 0;
  const bookedRoomNumbers = new Set();

  for (const booking of bookings) {
    if (isBookingOnDate(booking, dateObj)) {
      bookedRoomNumbers.add(booking.roomNumber);
    }
  }

  return bookedRoomNumbers.size;
};

/**
 * Get occupancy percentage (0-1)
 * Assumes 10 total rooms
 */
export const getOccupancyPercentage = (occupancy) => {
  const totalRooms = 10;
  return Math.min(occupancy / totalRooms, 1);
};

/**
 * Get color for occupancy level (gradient from light to dark)
 */
export const getOccupancyColor = (occupancy) => {
  const percentage = getOccupancyPercentage(occupancy);
  // Elegant slate palette: near-white → pale slate → slate → deeper slate
  if (percentage === 0) return '#fefdfe'; // near white
  if (percentage <= 0.25) return '#ecf0f1'; // pale slate
  if (percentage <= 0.5) return '#cfd8dc'; // soft slate
  if (percentage <= 0.75) return '#b0bec5'; // gentle slate
  if (percentage <= 0.9) return '#90a4ae'; // warm slate
  return '#78909c'; // deep slate (full)
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD string to Date object
 */
export const parseDateString = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calculate number of nights between check-in and check-out
 */
export const calculateNights = (checkInStr, checkOutStr) => {
  const checkIn = parseDateString(checkInStr);
  const checkOut = parseDateString(checkOutStr);
  const diffTime = checkOut - checkIn;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get bookings that overlap with a date range
 */
export const getBookingsInRange = (bookings, startDate, endDate) => {
  return bookings.filter((booking) => {
    const bookingStart = parseDateString(booking.checkIn);
    const bookingEnd = parseDateString(booking.checkOut);

    // Check if booking overlaps with the range
    return bookingStart < endDate && bookingEnd > startDate;
  });
};

/**
 * Check if date is today
 */
export const isToday = (dateObj) => {
  const today = new Date();
  return (
    dateObj.year === today.getFullYear() &&
    dateObj.month === today.getMonth() &&
    dateObj.day === today.getDate()
  );
};

/**
 * Format date object for display (e.g., "Mar 15, 2026")
 */
export const formatDateDisplay = (dateObj) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[dateObj.month]} ${dateObj.day}, ${dateObj.year}`;
};

/**
 * Get month and year label
 */
export const getMonthLabel = (year, month) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[month]} ${year}`;
};

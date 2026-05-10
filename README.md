# Hotel Occupancy Heatmap Calendar

A modern, interactive React application for visualizing hotel room occupancy across months with an intuitive calendar interface.

## Features

### Core Features (6/6 Implemented)

1. **7-Column Day Grid with Month Navigation**
   - Display all days of the current month in a 7-column grid (Sunday-Saturday)
   - Previous/next month days shown dimmed (de-emphasized)
   - Always maintains rectangular 6-row × 7-column layout
   - Smooth month navigation with Previous/Next/Today buttons

2. **Occupancy Heatmap (0-10 Room Scale)**
   - Color gradient from light green (0 rooms occupied) to red (10 rooms occupied)
   - Real-time occupancy calculation based on confirmed bookings
   - Exclusive checkout date logic (e.g., checkout on Feb 13 means Feb 12 is last occupied night)
   - Displays room count (e.g., "7/10") on each day

3. **Month Navigation & Today Button**
   - Previous/Next buttons navigate between months
   - "Today" button returns to current month instantly
   - Current month persists in browser localStorage for returning users
   - Responsive navigation bar with hover effects

4. **Drag-to-Select Date Ranges (Bi-directional)**
   - Click and drag to select any date range
   - Works both directions (forward: May 5→15 and backward: May 15→5 select same range)
   - Works across month boundaries (select from May into June)
   - Selected dates highlighted with blue border and transparent overlay

5. **Booking Detail Panel with Overlapping Booking Analysis**
   - Shows all bookings overlapping the selected date range
   - Displays booking count, guest name, room details, check-in/out dates, nights stayed, amount, status, and source
   - CSV export functionality for selected bookings
   - Filter bookings by room type and booking status

6. **Async Data Loading from JSON**
   - Loads 201 pre-configured bookings from `public/bookings.json`
   - Handles loading states gracefully
   - Error handling for failed data loads
   - Data stored in centralized App state, passed to child components via props

### Additional Features (Implemented)

7. **Statistics Dashboard**
   - Average occupancy percentage for current month
   - Total revenue generated
   - Longest stay duration
   - Most booked room number
   - Most popular room type
   - Total confirmed bookings

## Technology Stack

- **React**: 18.2.0 - UI framework with hooks
- **Vite**: 4.3.9 - Build tool and dev server
- **CSS**: Plain vanilla CSS (no Tailwind, no component libraries)
- **JavaScript**: ES6+ with native Date API for date calculations

## Project Structure

```
react.js/
├── public/
│   └── bookings.json          # 201 hotel booking records (Jan 1 - May 2, 2026)
├── src/
│   ├── components/
│   │   ├── Calendar.jsx       # Main calendar grid component
│   │   ├── Calendar.css
│   │   ├── DayCell.jsx        # Individual day cell with occupancy display
│   │   ├── DayCell.css
│   │   ├── Navigation.jsx     # Month navigation controls
│   │   ├── Navigation.css
│   │   ├── BookingPanel.jsx   # Booking details and filters
│   │   ├── BookingPanel.css
│   │   ├── StatsHeader.jsx    # Statistics dashboard
│   │   └── StatsHeader.css
│   ├── utils/
│   │   └── dateUtils.js       # Date calculations and occupancy logic
│   ├── App.jsx                # Root component with state management
│   ├── App.css                # Global styles
│   └── main.jsx               # React entry point
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── README.md                  # This file
```

## Installation & Setup

### Prerequisites
- Node.js 14+ and npm

### Steps

1. **Clone or download the project**
   ```bash
   cd react.js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The application will automatically open at `http://localhost:3000`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Key Implementation Details

### Date Logic (Critical)

The occupancy calculation uses **exclusive checkout date logic**:
- A booking with `checkIn: "2026-01-02"` and `checkOut: "2026-01-05"` occupies rooms for exactly 3 nights: Jan 2, Jan 3, and Jan 4
- **Jan 5 is NOT occupied** (room is available for checkout or next guest)
- Only bookings with `status: "confirmed"` count toward occupancy
- Cancelled/checked-out bookings don't affect occupancy numbers

### Occupancy Calculation

```javascript
// Example: Check if a booking occupies a specific date
const booking = { checkIn: "2026-01-02", checkOut: "2026-01-05", status: "confirmed" };
const date = new Date(2026, 0, 4); // Jan 4, 2026

// Room IS occupied on Jan 4 (checkIn <= date < checkOut)
// Room is NOT occupied on Jan 5
```

### Color Gradient Scheme

- **0 rooms**: `#e8f5e9` (very light green)
- **1-3 rooms**: `#c8e6c9` (light green)
- **4-5 rooms**: `#a5d6a7` (green)
- **6-7 rooms**: `#81c784` (medium green)
- **8 rooms**: `#ffeb99` (light yellow)
- **9 rooms**: `#ffcc80` (orange)
- **10 rooms**: `#ff8a80` (red)

### State Management

The App component manages all state:
- `bookings[]` - Loaded booking data
- `currentDate` - Month/year being displayed
- `selectedRange` - Date range selected by user {start, end}
- `filters` - Active filters {roomType, bookingStatus}
- `loading/error` - Data loading states

Data flows downward to child components via props. User interactions (click, drag) update state via callback functions.

## Data Format

### Booking Record Schema

```javascript
{
  "id": "BK1000",                    // Unique booking ID
  "guestName": "James Davis",        // Guest name
  "roomNumber": "102",               // Room identifier
  "roomType": "Standard",            // Room type (Standard, Deluxe, Suite, Penthouse)
  "checkIn": "2026-01-01",           // Check-in date (YYYY-MM-DD)
  "checkOut": "2026-01-04",          // Check-out date (YYYY-MM-DD, exclusive)
  "guests": 2,                       // Number of guests
  "totalAmount": 13500,              // Total amount in INR
  "currency": "INR",                 // Currency code
  "status": "confirmed",             // Status: confirmed, cancelled, checked_in, checked_out
  "source": "Expedia"                // Booking source (Expedia, Airbnb, Direct, Agoda, Booking.com, Walk-in)
}
```

### Test Data

The project includes 201 real-world bookings (BK1000-BK1200) covering:
- **Date Range**: January 1 - May 2, 2026
- **Rooms**: 10 rooms (101-103, 201-203, 301-302, 401-402)
- **Room Types**: Standard, Deluxe, Suite, Penthouse
- **Booking Status**: Mix of confirmed (70%), cancelled, checked-in, checked-out
- **Sources**: Expedia, Airbnb, Direct, Agoda, Booking.com, Walk-in

## Usage Guide

### Navigating Months
1. Click "**Previous**" to view previous month
2. Click "**Next**" to view next month
3. Click "**Today**" to jump to current month

### Selecting Date Ranges
1. **Single date**: Click any day cell
2. **Date range**: Click on a start date, then drag to an end date
3. **Multi-month range**: Drag selection can span across previous/next month days
4. **Clearing selection**: Click "Select a date range to view bookings" message resets selection

### Viewing Bookings
1. Select a date range on the calendar
2. View all overlapping bookings in the right panel
3. Filter by room type or booking status using dropdowns
4. Export bookings as CSV using "📥 Export as CSV" button

### Interpreting Heatmap
- **Light colors** = Low occupancy (few rooms booked)
- **Warm colors** (yellow/orange/red) = High occupancy (many rooms booked)
- **Number (e.g., 7/10)** = 7 rooms occupied out of 10 total

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- Calendar renders efficiently with memoized calculations
- Date calculations use native JavaScript Date API (no external libraries required)
- Occupancy recalculation only runs when bookings or date changes
- CSS Grid for responsive layout
- Smooth animations and transitions

## Known Limitations

- 10-room hotel capacity hardcoded (can be parameterized for different hotel sizes)
- Only handles confirmed bookings for occupancy (cancelled bookings excluded)
- No user authentication or booking management features
- Read-only interface (no ability to create/edit bookings from UI)
- No recurring bookings or multi-room bookings per guest

## Future Enhancements

- [ ] Room-level filtering and view (see individual room occupancy)
- [ ] Date range revenue analytics
- [ ] Booking trend charts
- [ ] Overbooking detection alerts
- [ ] Calendar export functionality (PDF/Image)
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Advanced filtering (source, guest type, etc.)

## Development

### Available Scripts

```bash
npm run dev      # Start development server (auto-reload)
npm run build    # Create production build
npm run preview  # Preview production build locally
npm lint         # Run ESLint (if configured)
```

### Debugging

1. **React DevTools**: Install React DevTools browser extension for component inspection
2. **Browser Console**: Check console for any JavaScript errors
3. **Network Tab**: Verify `bookings.json` loads correctly
4. **Application Tab**: Check localStorage for last viewed month

### Adding New Features

1. Create new component file in `src/components/`
2. Create corresponding `.css` file with same name
3. Import and add to App component
4. Update date utilities if date logic needed
5. Test with development server hot reload

## API Reference

### dateUtils.js Functions

```javascript
// Calendar display
generateCalendarDays(year, month)           // Returns array of day objects for 6-week display
getMonthLabel(year, month)                  // Returns formatted month name (e.g., "January 2026")

// Date calculations
getDaysInMonth(year, month)                 // Returns number of days in month
getFirstDayOfMonth(year, month)             // Returns 0-6 (Sunday-Saturday)
isToday(dateObj)                            // Checks if date is today

// Occupancy calculations
calculateOccupancyForDate(bookings, dateObj) // Returns number of occupied rooms (0-10)
getOccupancyColor(occupancy)                // Returns color hex code for occupancy level
getBookingsInRange(bookings, start, end)    // Returns bookings overlapping date range

// Formatting
formatDateToString(date)                    // Converts Date to "YYYY-MM-DD"
parseDateString(dateStr)                    // Converts "YYYY-MM-DD" to Date
calculateNights(checkIn, checkOut)          // Returns number of nights
formatDateDisplay(dateObj)                  // Returns formatted display (e.g., "Mar 15, 2026")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Change port in vite.config.js or kill process using port |
| Bookings not loading | Check if `public/bookings.json` exists and is valid JSON |
| Calendar not displaying | Open browser console to check for JavaScript errors |
| Dates showing wrong year | Verify bookings.json has correct date format (YYYY-MM-DD) |
| Drag selection not working | Ensure mouse events are not being intercepted by other handlers |

## License

This project is provided as-is for demonstration and hotel management purposes.

## Contact & Support

For questions or issues, please refer to the project documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Build Tool**: Vite 4.3.9  
**React Version**: 18.2.0

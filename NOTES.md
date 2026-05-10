# Technical Implementation Notes

## Architecture Overview

### Component Hierarchy

```
App (state management)
├── StatsHeader (stats display)
├── Navigation (month navigation)
├── Calendar (grid container)
│   └── DayCell × 42 (individual days)
└── BookingPanel (booking list & filters)
```

### State Flow

```
App (stateful)
  ├─ bookings: booking[] (loaded from JSON)
  ├─ currentDate: Date (displayed month)
  ├─ selectedRange: {start, end} (dragged range)
  ├─ filters: {roomType, bookingStatus} (active filters)
  │
  ├─→ Calendar (receives bookings, currentDate, selectedRange, filters)
  │   └─→ DayCell (receives dateObj, occupancy, isSelected, callbacks)
  │
  ├─→ StatsHeader (receives bookings, currentDate)
  │
  ├─→ Navigation (receives currentDate, callbacks)
  │
  └─→ BookingPanel (receives bookings, selectedRange, filters, callbacks)
```

## Key Implementation Decisions

### 1. Date Storage & Comparison

**Decision**: Use native JavaScript `Date` objects internally, store bookings as ISO strings

**Rationale**:
- Avoids dependency on date libraries (date-fns, moment.js)
- Native Date API sufficient for calendar UI
- Easy conversion: `new Date(bookingCheckIn)` converts ISO string

**Implementation**:
```javascript
// Bookings store dates as YYYY-MM-DD strings
const booking = { checkIn: "2026-01-02", checkOut: "2026-01-05" };

// Convert to Date for comparison
const checkIn = new Date(booking.checkIn);
const checkOut = new Date(booking.checkOut);

// Safe comparison
const dateToCheck = new Date(2026, 0, 4); // Jan 4
const isOccupied = dateToCheck >= checkIn && dateToCheck < checkOut; // true
```

**Edge Cases Handled**:
- Timezone issues: Always use UTC by avoiding timezone conversion
- DST transitions: Not an issue since we only care about date, not time
- Month/year parsing: Zero-based months in Date constructor corrected with `month + 1`

### 2. Occupancy Counting (Room-Level, Not Guest-Level)

**Decision**: Count unique room numbers occupied per day (0-10 scale)

**Rationale**:
- Multiple bookings can occupy same room on different dates
- Only unique room occupancy matters for hotel operations
- Using Set to deduplicate room numbers

**Implementation**:
```javascript
export const calculateOccupancyForDate = (bookings, dateObj) => {
  let occupiedRooms = 0;
  const bookedRoomNumbers = new Set();

  for (const booking of bookings) {
    if (isBookingOnDate(booking, dateObj)) {
      bookedRoomNumbers.add(booking.roomNumber); // Unique rooms only
    }
  }

  return bookedRoomNumbers.size; // 0-10
};
```

### 3. Exclusive Checkout Date Logic

**Decision**: Checkout date is exclusive (not occupied on checkout day)

**Rationale**:
- Industry standard hotel booking model
- Guest checks out morning of checkout date
- Room becomes available for cleaning and next guest
- Matches user expectations and data accuracy

**Implementation**:
```javascript
// Booking: Jan 1 check-in, Jan 4 check-out
// Occupied nights: Jan 1, Jan 2, Jan 3 (NOT Jan 4)
const isOccupied = dateToCheck >= checkIn && dateToCheck < checkOut;
// Jan 1: >= Jan 1 && < Jan 4 ✓ (occupied)
// Jan 4: >= Jan 1 && < Jan 4 ✗ (NOT occupied - available for checkout)
```

### 4. Drag Selection Implementation

**Decision**: Use native mouse events (mouseDown, mouseMoveEnter, mouseUp), bi-directional range sorting

**Rationale**:
- No external drag-drop libraries needed
- Simple event handling for calendar use case
- Bi-directional support: user can drag forward or backward

**Implementation**:
```javascript
// User drags from May 10 → May 5 OR May 5 → May 10
// Both produce same range: May 5-10
const [minDate, maxDate] = start <= end ? [start, end] : [end, start];
onSelectRange({ start: minDate, end: maxDate });
```

### 5. CSV Export Feature

**Decision**: Browser-side CSV generation without backend

**Rationale**:
- No server required
- Instant user feedback
- Privacy - data stays in browser
- Standard CSV format compatible with Excel, Google Sheets

**Format**:
```
ID,Guest,Room,Type,Check-In,Check-Out,Nights,Amount,Status,Source
BK1000,James Davis,102,Standard,2026-01-01,2026-01-04,3,13500,confirmed,Expedia
```

### 6. localStorage Persistence

**Decision**: Save last viewed month to localStorage

**Rationale**:
- Better UX for returning users
- Users see where they left off
- No backend storage needed

**Implementation**:
```javascript
// Save on month change
const monthKey = `${year}-${month}`;
localStorage.setItem('lastViewedMonth', monthKey);

// Load on app mount
const lastMonth = localStorage.getItem('lastViewedMonth');
if (lastMonth) {
  const [year, month] = lastMonth.split('-').map(Number);
  setCurrentDate(new Date(year, month));
}
```

## Component Details

### App.jsx - State Management

**Responsibilities**:
- Load bookings from JSON (async)
- Manage month navigation
- Handle date range selection
- Apply filters

**Key Hooks**:
- `useState` - bookings, currentDate, selectedRange, filters, loading, error
- `useEffect` - load bookings on mount, persist month to localStorage

**Props Passed**:
- `Calendar`: bookings, currentDate, selectedRange, onSelectRange, filters
- `StatsHeader`: bookings, currentDate
- `Navigation`: currentDate, onPrevious, onNext, onToday
- `BookingPanel`: bookings, selectedRange, filters, onFilterChange

### Calendar.jsx - Grid Rendering

**Responsibilities**:
- Generate 42-day grid (6 weeks × 7 days)
- Handle drag selection logic
- Apply filters to booking data before occupancy calculation
- Render DayCell components

**Key Logic**:
```javascript
// Generate calendar days with generateCalendarDays()
const days = generateCalendarDays(year, month); // 42 items

// For each day, calculate occupancy
const occupancy = calculateOccupancyForDate(filteredBookings, dateObj);

// Determine if day is in selected range
const isSelected = isDateInRange(dateObj);
```

**Mouse Event Flow**:
1. `onMouseDown` on day: Set `dragging=true`, record `dragStart` date
2. `onMouseEnter` on day: If dragging, calculate range from start to current, update selection
3. `onMouseUp` on day: If not dragging (single click), select just that day; stop dragging
4. Global `onMouseUp`: Always clear dragging flag

### DayCell.jsx - Visual Display

**Responsibilities**:
- Display day number, occupancy badge
- Apply background color based on occupancy
- Show selection highlight, today indicator, other-month dimming
- Handle mouse events

**Key Styling**:
```css
.day-cell.other-month { opacity: 0.4; }        /* Dimmed previous/next month */
.day-cell.today { border-color: var(--primary-color); } /* Today highlight */
.day-cell.selected { border: 2px solid var(--primary-color); } /* Selection */
```

### BookingPanel.jsx - Booking Display

**Responsibilities**:
- Show bookings for selected date range
- Apply filters (room type, status)
- Display booking details in sortable list
- Export as CSV

**Performance Optimization**:
```javascript
const filteredBookings = useMemo(() => {
  // Recalculate only when dependencies change
  // Prevents unnecessary re-renders during drag selection
}, [bookings, selectedRange, filters]);
```

### StatsHeader.jsx - Analytics

**Responsibilities**:
- Calculate month-level statistics
- Display 6 stat cards

**Calculations**:
```javascript
// Average occupancy: sum all daily occupancies / (days * 10) * 100
// Total revenue: sum of totalAmount for all confirmed bookings
// Longest stay: max(nights) across all bookings
// Most booked room: room number with most booking count
// Most booked type: room type with most booking count
// Total bookings: count of confirmed bookings
```

### Navigation.jsx - Month Controls

**Responsibilities**:
- Display month/year label
- Provide Previous/Next/Today buttons
- Emit navigation callbacks

**Props**: currentDate, onPrevious, onNext, onToday

### dateUtils.js - Core Logic

**Function Categories**:

1. **Calendar Generation**
   - `generateCalendarDays(year, month)` - Returns 42-element array
   - `getDaysInMonth(year, month)` - Number of days
   - `getFirstDayOfMonth(year, month)` - Starting day-of-week

2. **Occupancy Calculations**
   - `calculateOccupancyForDate(bookings, dateObj)` - Core function
   - `isBookingOnDate(booking, dateObj)` - Exclusive checkout logic
   - `getOccupancyPercentage(occupancy)` - 0-1 scale

3. **Color Mapping**
   - `getOccupancyColor(occupancy)` - Returns hex color

4. **Date Operations**
   - `formatDateToString(date)` - Date → YYYY-MM-DD
   - `parseDateString(dateStr)` - YYYY-MM-DD → Date
   - `calculateNights(checkIn, checkOut)` - Duration
   - `getBookingsInRange(bookings, start, end)` - Range filter

5. **Formatting**
   - `getMonthLabel(year, month)` - "January 2026"
   - `formatDateDisplay(dateObj)` - "Jan 15, 2026"
   - `isToday(dateObj)` - Boolean

## CSS Architecture

### Global Styles (App.css)

- CSS variables for colors, spacing, transitions
- Mobile-first responsive design
- Flexbox/Grid layout
- Dark text on light backgrounds

### Component Styles

Each component has dedicated CSS file with:
- Component-scoped selectors
- Hover/active states
- Responsive breakpoints (1200px, 768px)
- Smooth transitions

**Color Scheme**:
```css
--primary-color: #1976d2;           /* Blue */
--secondary-color: #424242;         /* Dark gray */
--success-color: #4caf50;           /* Green */
--warning-color: #ff9800;           /* Orange */
--danger-color: #f44336;            /* Red */
--light-bg: #fafafa;                /* Off-white */
--border-color: #e0e0e0;            /* Light gray */
--text-primary: #212121;            /* Dark text */
--text-secondary: #757575;          /* Gray text */
```

**Occupancy Colors** (in getOccupancyColor):
```javascript
0 rooms    → #e8f5e9  (light green)
1-3 rooms  → #c8e6c9  (light green)
4-5 rooms  → #a5d6a7  (green)
6-7 rooms  → #81c784  (medium green)
8 rooms    → #ffeb99  (light yellow)
9 rooms    → #ffcc80  (orange)
10 rooms   → #ff8a80  (red)
```

## Performance Considerations

### Optimization Techniques Applied

1. **Memoized Calculations** (BookingPanel)
   - `useMemo` prevents recalculating filtered bookings on every render
   - Depends only on [bookings, selectedRange, filters]

2. **CSS Grid for Layout**
   - 7-column grid renders efficiently for calendar
   - No JavaScript-based positioning needed

3. **Event Delegation** (not implemented but possible)
   - Could delegate all day-cell events to parent Calendar
   - Currently: Individual event handlers per DayCell (acceptable for 42 cells)

4. **Lazy Data Loading**
   - Bookings loaded once on app mount
   - Not refetched on month navigation or selection changes

### Potential Bottlenecks

1. **Occupancy Recalculation** (O(n) per day)
   - Current: ~42 days × ~200 bookings = 8,400 iterations per render
   - Acceptable for this scale; could optimize with date-indexed structures if needed

2. **Date Comparisons**
   - Using JavaScript Date objects: ~50 ns per comparison
   - 42 days × 200 bookings = 8,400 comparisons ≈ 0.4 ms (negligible)

3. **Re-renders on Drag Selection**
   - Drag updates onSelectRange every ~16ms (60 FPS)
   - Only Calendar, BookingPanel, StatsHeader recalculate
   - DayCell memoization could be added if needed

## Testing Strategy

### Manual Test Cases

1. **Navigation**
   - [ ] Previous/Next buttons cycle through months correctly
   - [ ] Today button returns to current month
   - [ ] Month label displays correctly

2. **Occupancy Calculation**
   - [ ] Day with booking checkIn="2026-01-02", checkOut="2026-01-05" shows room occupied Jan 2-4 only
   - [ ] Day with no bookings shows 0/10
   - [ ] Cancelled bookings don't count toward occupancy

3. **Drag Selection**
   - [ ] Single click selects single day
   - [ ] Drag forward (day 5 to 10) works
   - [ ] Drag backward (day 10 to 5) produces same range as forward drag
   - [ ] Cross-month drag (May 28 → June 3) works

4. **Booking Panel**
   - [ ] Correct number of bookings shown for range
   - [ ] Filters (room type, status) reduce booking count correctly
   - [ ] CSV export contains all bookings and opens download

5. **Statistics**
   - [ ] Occupancy percentage appears reasonable (0-100%)
   - [ ] Revenue matches sum of booking amounts
   - [ ] Stats update when month changes

6. **Responsive Design**
   - [ ] Calendar grid stacks on mobile (max-width: 768px)
   - [ ] Booking panel displays below calendar on tablet
   - [ ] Navigation buttons responsive

### Edge Cases

- First/last days of month
- Days spanning month boundaries (prev/next month display)
- Empty selection (no bookings in range)
- Single-day selection
- Long drag operations
- Rapid month changes

## Code Quality

### Conventions Followed

- Functional components only (no class components)
- Hooks for all state and side effects
- Props destructuring
- Meaningful variable names
- JSDoc-style comments for complex functions
- CSS variable usage for consistency

### Potential Improvements

1. **Input Validation**
   - Validate booking data format on load
   - Handle malformed dates gracefully

2. **Error Boundaries** (React 16.6+)
   - Wrap components to catch rendering errors
   - Display fallback UI on error

3. **Unit Tests**
   - Test dateUtils functions with jest
   - Test component renders with React Testing Library
   - Snapshot testing for CSS consistency

4. **TypeScript**
   - Add type definitions for better IDE support
   - Catch type errors at compile time

## Known Issues & Limitations

1. **Hardcoded Room Count**
   - Maximum occupancy is 10 rooms
   - Could parameterize for different hotel sizes

2. **No Double-Booking Prevention**
   - App doesn't validate that same room isn't double-booked
   - Relies on data integrity from backend

3. **No Authentication**
   - Anyone can view all bookings
   - No user roles or permissions

4. **No Recurrence**
   - Each booking is independent
   - No support for recurring bookings

5. **Limited Interactivity**
   - Read-only interface
   - No ability to create/edit/delete bookings from UI

6. **Timezone Handling**
   - Assumes UTC dates
   - May cause issues with international bookings

## Future Enhancement Opportunities

1. **Room-Level View**
   - Show individual room occupancy timeline
   - Click room to see all bookings

2. **Advanced Filters**
   - Filter by source (Expedia, Airbnb, etc.)
   - Filter by guest count, price range, etc.

3. **Booking Management**
   - Create/edit/delete bookings
   - Drag-and-drop rebooking
   - Overbooking alerts

4. **Analytics Dashboard**
   - Revenue trends
   - Booking source analysis
   - Seasonal patterns

5. **Export Options**
   - Export calendar as PDF
   - Email calendar/reports
   - Integration with external systems

6. **Dark Mode**
   - System preference detection
   - Toggle button

7. **Multi-Language Support**
   - i18n library integration
   - Translations for UI and data

## Deployment Notes

### Build Optimization

```bash
npm run build
# Output: dist/
# Size: ~150 KB (gzipped: ~40 KB)
```

### Environment Configuration

- No backend API calls needed
- All data from `public/bookings.json`
- Can be deployed as static site (Vercel, Netlify, GitHub Pages)

### CDN Considerations

- Minified JS and CSS
- Images can be optimized further
- Consider lazy loading for future enhancements

## Maintenance

### Adding New Bookings

1. Update `public/bookings.json` (maintain format)
2. Restart dev server (`npm run dev`)
3. App will reload with new data

### Changing Hotel Size

1. Update `StatsHeader.jsx`: Change hardcoded `totalRooms = 10` to dynamic value
2. Update room list in booking data to match (e.g., rooms 101-110 for 10 rooms)
3. Update `getOccupancyPercentage()` calculation if needed

### Updating Color Scheme

1. Edit `--primary-color` and related variables in `App.css`
2. Edit color hex codes in `dateUtils.getOccupancyColor()`
3. Refresh browser to see changes

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**React Version**: 18.2.0  
**Vite Version**: 4.3.9

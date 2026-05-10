# Technical Notes

## Scope

This app is a read-only hotel occupancy explorer. It focuses on one booking dataset, one occupancy model, and one workflow: inspect the calendar, drag a date range, and inspect overlapping bookings.

## Architecture

### Component Flow

```text
App
├── StatsHeader
├── Navigation
├── Calendar
│   └── DayCell x 42
└── BookingPanel
```

### State Ownership

- `App.jsx` owns the booking data, current date, selected range, filters, search query, and view mode.
- `Calendar.jsx` renders the current month or year view and handles drag selection.
- `YearHeatmap.jsx` renders the yearly overview using the same booking rules.
- `BookingPanel.jsx` filters the selected range and supports CSV export.
- `StatsHeader.jsx` computes month-level summary metrics.

## Main Decisions

### 1. Native Date APIs

I used built-in `Date` objects instead of a date library.

Why:

- The app only needs calendar math, not timezone-aware scheduling.
- Native APIs keep the bundle smaller.
- The dataset is already ISO-formatted, so parsing is straightforward.

Trade-off:

- I had to be careful with exclusive checkout logic and zero-based month indexes.

### 2. Room-Level Occupancy

Occupancy is counted by unique room number per day, not by total booking records.

Why:

- A hotel room can only be occupied once on a given night.
- Two bookings on the same room across different dates should not inflate the count.
- The heatmap is meant to show how full the hotel is, not how many reservation rows exist.

```javascript
const bookedRoomNumbers = new Set();
for (const booking of bookings) {
  if (isBookingOnDate(booking, dateObj)) {
    bookedRoomNumbers.add(booking.roomNumber);
  }
}
return bookedRoomNumbers.size;
```

### 3. Exclusive Checkout

The checkout date is treated as free, which matches hotel operations.

Why:

- Guests leave on the checkout date.
- The room is available again on that date.
- This avoids counting a room as occupied one day too long.

### 4. Drag Selection

I used mouse events plus refs for the active drag state.

Why:

- Refs update immediately and avoid stale state during fast pointer movement.
- The selection must stay responsive while the user is dragging.
- Sorting start and end dates makes reverse dragging behave correctly.

### 5. Client-Side CSV Export

Export happens entirely in the browser.

Why:

- No backend is needed for a demo or challenge environment.
- It keeps the app self-contained.
- The export is immediate and easy to verify.

### 6. localStorage Persistence

The last viewed month, view mode, filters, and search query are saved locally.

Why:

- It gives returning users continuity.
- It avoids extra infrastructure.
- It makes the app feel more polished even though it stays client-side.

## Open-Scope Feature

The open-scope feature I chose is the year view.

Reasoning:

- It expands the app from a single-month calendar into a planning tool.
- It gives a broader sense of seasonal demand.
- It shows that the occupancy logic scales beyond one month without changing the data model.

## Trade-Offs

- I optimized for clarity over density, so the UI is readable but not hyper-compact.
- I chose a fixed 10-room model because that matches the sample data.
- I kept the app front-end only, so there is no persistence beyond the browser and no server-side booking edit flow.
- I reused the same booking filters in several places instead of centralizing them into one shared selector; that is acceptable for this scope but not ideal long term.

## What I Would Refactor Next

- Extract shared filtering logic into one helper so calendar, year view, stats, and booking panel all use the exact same predicate.
- Move repeated date-range calculations into reusable utility functions.
- Add real screenshot assets to the documentation.
- Parameterize hotel capacity instead of hardcoding 10 rooms.
- Add tests around occupancy and range selection edge cases.

## Notes On Current Behavior

- Month view shows a 42-cell grid for the selected month.
- Year view shows 12 month cards for the selected year.
- Checkout dates are excluded from occupancy.
- Cancelled bookings are excluded from occupancy and most summary counts.
- The booking panel only shows bookings that overlap the currently selected range.

## Why This Project Is A Good Demo

This project shows front-end state management, date math, drag interaction, filtering, derived analytics, and layout work in one small app. It also shows a clear product decision: expose enough data to make the booking flow useful without trying to become a full booking system.

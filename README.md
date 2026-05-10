# Hotel Occupancy Heatmap

A React + Vite dashboard for exploring hotel occupancy from `public/bookings.json`. The app shows a month calendar, a year overview, drag-selection for date ranges, booking details, filters, search, CSV export, and persisted UI state.

## What This App Shows

- Month view with a 7-column calendar grid.
- Year view with 12 compact month cards.
- Occupancy heatmap on a 0-10 room scale.
- Drag selection across days, including reverse drags.
- Booking panel for overlapping bookings.
- Filters for room type, status, and source.
- Guest-name search.
- CSV export of the selected bookings.
- localStorage persistence for month, view, filters, and search.

## Screenshots

I cannot write binary screenshot files into the repo with the current workspace tools, so this section documents the exact app states to capture from the browser.

Recommended screenshots to add later:

- Month view: the calendar, stats header, and booking panel together.
- Drag selection: a highlighted date range with matching bookings listed.
- Filters active: the booking panel after narrowing by room type or status.
- Year view: the 12-month overview for the selected year.

If you want to embed them in the repo, add PNG files under something like `docs/screenshots/` and reference them here.

## How The App Works

### Data Loading

The app loads booking data from `public/bookings.json` on startup. The dataset is read once and stored in React state in `App.jsx`, then passed down to the calendar, stats header, and booking panel.

### Occupancy Calculation

Occupancy is calculated at the room level, not the booking level.

The rule is:

- a booking counts if the day is on or after check-in
- a booking stops counting on checkout day
- cancelled bookings do not count
- duplicate bookings for the same room on the same night are deduplicated with a `Set`

That means a booking from `2026-01-02` to `2026-01-05` occupies Jan 2, Jan 3, and Jan 4, but not Jan 5.

This is the correct hotel model because checkout day is when the room becomes available again.

### Drag Selection

The calendar uses mouse down, mouse enter, and mouse up events to build a range.

The important detail is that the active drag state is mirrored in refs, not only React state. That keeps range selection stable during fast mouse movement. The code sorts the start and end dates so dragging forward or backward produces the same selected range.

### Year View

The year view is the open-scope feature I chose. It reuses the same occupancy rules but renders an at-a-glance overview for all 12 months in the selected year.

I chose it because it adds planning value without needing a backend or a bigger data model. It turns the app from a month-by-month calendar into a broader decision-making tool.

## Tech Stack

- React 18
- Vite
- Plain CSS
- Native JavaScript Date APIs

## Project Structure

```text
react.js/
├── public/
│   └── bookings.json
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   ├── utils/
│   │   └── dateUtils.js
│   └── components/
│       ├── Calendar.jsx
│       ├── YearHeatmap.jsx
│       ├── BookingPanel.jsx
│       ├── Navigation.jsx
│       ├── StatsHeader.jsx
│       └── DayCell.jsx
├── index.html
├── package.json
├── vite.config.js
├── NOTES.md
└── README.md
```

## Run Instructions

### Prerequisites

- Node.js 18 or newer
- npm

### Install Dependencies

```bash
npm install
```

### Start The App

```bash
npm run dev
```

Then open the local URL shown in the terminal. In this workspace it has been running at `http://localhost:3000/`.

### Build For Production

```bash
npm run build
```

### Preview The Production Build

```bash
npm run preview
```

## Key Features In Detail

### Month Navigation

- Previous and Next move through months.
- Today returns to the current month.
- The selected month persists in localStorage.

### Booking Panel

- Shows bookings that overlap the selected date range.
- Supports room type, status, and source filters.
- Supports guest-name search.
- Exports the current filtered selection as CSV.

### Stats Header

- Average occupancy for the visible month.
- Prorated revenue for bookings that overlap the visible month.
- Longest stay.
- Most-booked room.
- Most-popular room type.
- Total active bookings.

## Trade-Offs

- The app is front-end only, so there is no backend persistence.
- I used native Date APIs instead of a date library to keep the bundle lightweight.
- I hardcoded the hotel size to 10 rooms because the sample dataset is fixed.
- I kept the layout intentionally clear rather than highly animated.

## What I Would Do With More Time

- Add real screenshot assets to this README.
- Make the room count configurable.
- Add charts for revenue and occupancy trends.
- Add tests for occupancy logic and drag selection.
- Add a backend so bookings can be edited and saved.

## Verification Checklist

Use this as a quick manual test after `npm run dev`:

- The calendar loads data from `public/bookings.json`.
- Month view renders correctly.
- Year view renders correctly.
- Drag selection highlights a range and updates the booking panel.
- Filters and search narrow the booking list.
- CSV export downloads the selected bookings.

## Notes

For a concise implementation summary, see `NOTES.md`.

import React, { useState, useEffect } from 'react';
import './App.css';
import Calendar from './components/Calendar';
import Navigation from './components/Navigation';
import BookingPanel from './components/BookingPanel';
import StatsHeader from './components/StatsHeader';

function App() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState(null);
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('hb_filters');
      return saved ? JSON.parse(saved) : { roomType: 'all', bookingStatus: 'all', source: 'all' };
    } catch {
      return { roomType: 'all', bookingStatus: 'all', source: 'all' };
    }
  });
  const [view, setView] = useState(() => {
    return localStorage.getItem('hb_view') || 'month';
  });
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('hb_search') || '');

  // Load bookings from JSON on mount
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/bookings.json');
        if (!response.ok) throw new Error('Failed to load bookings');
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err.message || 'Error loading bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Restore last viewed month from localStorage
  useEffect(() => {
    const lastMonth = localStorage.getItem('lastViewedMonth');
    if (lastMonth) {
      const [year, month] = lastMonth.split('-').map(Number);
      setCurrentDate(new Date(year, month));
    }
  }, []);

  // Save current month to localStorage
  useEffect(() => {
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    localStorage.setItem('lastViewedMonth', monthKey);
  }, [currentDate]);

  // Persist filters, view and search
  useEffect(() => {
    try {
      localStorage.setItem('hb_filters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('hb_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('hb_search', searchQuery);
  }, [searchQuery]);

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousMonth = () => {
    if (view === 'year') {
      // Navigate to previous year
      setCurrentDate(
        new Date(currentDate.getFullYear() - 1, currentDate.getMonth())
      );
    } else {
      // Navigate to previous month
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
    }
  };

  const goToNextMonth = () => {
    if (view === 'year') {
      // Navigate to next year
      setCurrentDate(
        new Date(currentDate.getFullYear() + 1, currentDate.getMonth())
      );
    } else {
      // Navigate to next month
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
      );
    }
  };

  // Listen for clear-selection events from BookingPanel
  useEffect(() => {
    const onClear = () => setSelectedRange(null);
    window.addEventListener('hb_clear_selection', onClear);
    return () => window.removeEventListener('hb_clear_selection', onClear);
  }, []);

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hotel Occupancy Heatmap</h1>
        <p>Interactive calendar view for hotel bookings</p>
      </header>

      <StatsHeader bookings={bookings} currentDate={currentDate} />

      <div className="app-container">
        <div className="calendar-section">
          <Navigation
            currentDate={currentDate}
            onPrevious={goToPreviousMonth}
            onNext={goToNextMonth}
            onToday={goToToday}
            view={view}
            onChangeView={setView}
          />

          <Calendar
            currentDate={currentDate}
            bookings={bookings}
            selectedRange={selectedRange}
            onSelectRange={setSelectedRange}
            filters={filters}
            view={view}
            searchQuery={searchQuery}
          />
        </div>

        <BookingPanel
          bookings={bookings}
          selectedRange={selectedRange}
          filters={filters}
          onFilterChange={setFilters}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

export default App;

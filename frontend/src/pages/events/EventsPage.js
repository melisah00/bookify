import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import ReaderSidebar from "../../components/sidebars/ReaderSidebar";
import AuthorSidebar from "../../components/sidebars/AuthorSidebar";
import AdminSidebar from "../../components/sidebars/AdminSidebar";
import Footer from "../../components/Footer";
import { Box, Toolbar } from "@mui/material";
import { DateUtils } from "../../utils/dateUtils";
import { useNavigate } from "react-router-dom";

// Real API Service - Updated to call backend
const ApiService = {
  baseUrl: "http://localhost:8000",

  async getEvents(filters = {}) {
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams();

      if (filters.tag) queryParams.append("tag", filters.tag);
      if (filters.format) queryParams.append("format", filters.format);
      if (filters.author) queryParams.append("author", filters.author);

      const url = `${this.baseUrl}/events/?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if you have a token
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const events = await response.json();

      // Transform the backend data to match frontend expectations
      return events.map((event) => ({
        ...event,
        // Map tag objects to tag names for frontend compatibility
        tags: event.tags ? event.tags.map((tag) => tag.name) : [],
        // Use author field if available, otherwise use organizer info
        author: event.author || "Unknown Organizer",
        // Ensure cover_image has a default if null
        cover_image:
          event.cover_image ||
          `https://source.unsplash.com/800x400/?event&sig=${event.id}`,
      }));
    } catch (error) {
      console.error("Error fetching events:", error);

      // Fallback to mock data if API fails (for development)
      console.log("Falling back to mock data...");
      return this.getMockEvents();
    }
  },

  getMockEvents() {
    const now = DateTime.now();

    // Generate mock events for fallback
    const events = [];
    const eventTypes = [
      "Conference",
      "Workshop",
      "Meetup",
      "Hackathon",
      "Webinar",
    ];
    const locations = [
      "Berlin",
      "San Francisco",
      "Tokyo",
      "London",
      "New York",
    ];
    const rsvpStatuses = ["going", "interested", "not_going", null];

    // Create some events in the past
    for (let i = 1; i <= 5; i++) {
      const startDate = now.minus({ days: Math.floor(Math.random() * 10) + 1 });
      events.push({
        id: `past-${i}`,
        title: `${
          eventTypes[Math.floor(Math.random() * eventTypes.length)]
        } in ${locations[Math.floor(Math.random() * locations.length)]}`,
        start_date: startDate.toISO(),
        end_date: startDate
          .plus({ hours: Math.floor(Math.random() * 3) + 1 })
          .toISO(),
        description: "Join us for this exciting event!",
        location: locations[Math.floor(Math.random() * locations.length)],
        cover_image: `https://source.unsplash.com/random/800x400?event&sig=${i}`,
        rsvp_status:
          rsvpStatuses[Math.floor(Math.random() * rsvpStatuses.length)],
        tags: ["tech", "innovation"],
        author: "Event Team",
        format: Math.random() > 0.5 ? "in_person" : "virtual",
      });
    }

    // Create some events in the future
    for (let i = 1; i <= 15; i++) {
      const startDate = now.plus({ days: Math.floor(Math.random() * 30) });
      events.push({
        id: `future-${i}`,
        title: `${
          eventTypes[Math.floor(Math.random() * eventTypes.length)]
        } in ${locations[Math.floor(Math.random() * locations.length)]}`,
        start_date: startDate.toISO(),
        end_date: startDate
          .plus({ hours: Math.floor(Math.random() * 3) + 1 })
          .toISO(),
        description: "Join us for this exciting event!",
        location: locations[Math.floor(Math.random() * locations.length)],
        cover_image: `https://source.unsplash.com/random/800x400?event&sig=${
          i + 10
        }`,
        rsvp_status:
          rsvpStatuses[Math.floor(Math.random() * rsvpStatuses.length)],
        tags: ["tech", "innovation"],
        author: "Event Team",
        format: Math.random() > 0.5 ? "in_person" : "virtual",
      });
    }

    return events;
  },

  getCalendarFeedUrl() {
    return `${this.baseUrl}/events/calendar/feed.ics`;
  },
};

// IO Connect Style Event Card Component (Fixed Styling)
function IOEventCard({ event, onClick }) {
  const startDate = DateUtils.DateTime.fromISO(event.start_date);
  const isPast = DateUtils.isPast(startDate);

  const getRsvpBadgeClass = (rsvpStatus) => {
    switch (rsvpStatus) {
      case "going":
        return "badge-going";
      case "interested":
        return "badge-interested";
      case "not_going":
        return "badge-not-going";
      default:
        return "bg-gray-200";
    }
  };

  const getRsvpText = (rsvpStatus) => {
    switch (rsvpStatus) {
      case "going":
        return "Going";
      case "interested":
        return "Interested";
      case "not_going":
        return "Not Going";
      default:
        return "RSVP";
    }
  };

  const formatEventFormat = (format) => {
    switch (format) {
      case "in_person":
        return "In-Person";
      case "virtual":
        return "Virtual";
      case "hybrid":
        return "Hybrid";
      default:
        return format;
    }
  };

  return (
    <div
      className="io-card bg-white shadow-md cursor-pointer"
      onClick={() => onClick(event.id)}
    >
      <div className="io-card-image">
        <img src={event.cover_image} alt={event.title} />
      </div>
      <div className="io-card-content">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="io-badge"
            style={{
              backgroundColor: "var(--light-bg)",
              color: "var(--primary)",
            }}
          >
            {formatEventFormat(event.format)}
          </span>
          {isPast && (
            <span
              className="io-badge"
              style={{ backgroundColor: "#e5e7eb", color: "#6b7280" }}
            >
              Past
            </span>
          )}
        </div>

        <h3 className="io-title">{event.title}</h3>

        <div className="io-info">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
          <span>
            {DateUtils.formatDateRange(event.start_date, event.end_date)}
          </span>
        </div>

        <div className="io-info">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <span>{event.location}</span>
        </div>

        <div className="io-tags">
          {event.tags &&
            event.tags.map((tag, index) => (
              <span key={index} className="io-tag">
                #{tag}
              </span>
            ))}
        </div>

        <div className="io-action">
          <button className="io-button io-button-secondary">Details</button>
          <button
            className={`io-button io-button-primary ${getRsvpBadgeClass(
              event.rsvp_status
            )}`}
          >
            {getRsvpText(event.rsvp_status)}
          </button>
        </div>
      </div>
    </div>
  );
}

// Filter Bar Component (Google I/O Connect style) - Fixed Spacing
function FilterBar({ filters, onFilterChange }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const filterOptions = {
    tags: [
      "conference",
      "workshop",
      "social",
      "meetup",
      "hackathon",
      "webinar",
      "rip",
      "murat",
      "dogs",
    ],
    formats: ["in_person", "virtual", "hybrid"],
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 rounded-full text-white hover:bg-moss-green-dark transition-colors"
          style={{ backgroundColor: "var(--moss-green)" }}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            ></path>
          </svg>
          Filters
        </button>

        {Object.keys(localFilters).length > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-full transition-colors"
            style={{
              backgroundColor: "var(--gray-nurse)",
              color: "var(--como)",
            }}
          >
            Clear all
          </button>
        )}

        {localFilters.tag && (
          <div className="filter-chip active px-3 py-1 rounded-full text-sm flex items-center">
            Tag: {localFilters.tag}
            <button
              onClick={() => handleFilterChange("tag", "")}
              className="ml-1 focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}

        {localFilters.format && (
          <div className="filter-chip active px-3 py-1 rounded-full text-sm flex items-center">
            Format: {localFilters.format.replace("_", "-")}
            <button
              onClick={() => handleFilterChange("format", "")}
              className="ml-1 focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}

        {localFilters.author && (
          <div className="filter-chip active px-3 py-1 rounded-full text-sm flex items-center">
            Author: {localFilters.author}
            <button
              onClick={() => handleFilterChange("author", "")}
              className="ml-1 focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-3" style={{ color: "var(--como)" }}>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {filterOptions.tags.map((tag) => (
                  <button
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                      localFilters.tag === tag ? "font-semibold" : ""
                    }`}
                    style={{
                      backgroundColor:
                        localFilters.tag === tag
                          ? "var(--moss-green-darker)"
                          : "var(--moss-green)",
                      color: "white",
                    }}
                    onClick={() =>
                      handleFilterChange(
                        "tag",
                        localFilters.tag === tag ? "" : tag
                      )
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3" style={{ color: "var(--como)" }}>
                Format
              </h3>
              <div className="flex flex-wrap gap-2">
                {filterOptions.formats.map((format) => (
                  <button
                    key={format}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                      localFilters.format === format ? "font-semibold" : ""
                    }`}
                    style={{
                      backgroundColor:
                        localFilters.format === format
                          ? "var(--moss-green-darker)"
                          : "var(--moss-green)",
                      color: "white",
                    }}
                    onClick={() =>
                      handleFilterChange(
                        "format",
                        localFilters.format === format ? "" : format
                      )
                    }
                  >
                    {format.replace("_", "-")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3" style={{ color: "var(--como)" }}>
                Author
              </h3>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--gray-nurse)",
                  "--tw-ring-color": "var(--moss-green)",
                }}
                value={localFilters.author || ""}
                onChange={(e) => handleFilterChange("author", e.target.value)}
                placeholder="Search by author"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Month View Component (Google I/O Connect style) - Fixed Styling
function MonthView({ events, currentDate, onEventClick }) {
  const days = DateUtils.getMonthDays(currentDate.year, currentDate.month);

  // Group events by day
  const eventsByDay = {};
  events.forEach((event) => {
    const eventDate = DateUtils.DateTime.fromISO(event.start_date);
    const dayKey = eventDate.toISODate();

    if (!eventsByDay[dayKey]) {
      eventsByDay[dayKey] = [];
    }

    eventsByDay[dayKey].push(event);
  });

  return (
    <div className="month-view bg-white rounded-xl shadow-md overflow-hidden">
      <div
        className="grid grid-cols-7 gap-0 text-center py-4 text-white"
        style={{ backgroundColor: "var(--como)" }}
      >
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {days.map((day, index) => {
          const dayKey = day.date.toISODate();
          const dayEvents = eventsByDay[dayKey] || [];
          const isToday = DateUtils.isToday(day.date);
          const isCurrentMonth = day.isCurrentMonth;

          return (
            <div
              key={index}
              className={`day p-2 ${
                !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
              } ${isToday ? "bg-blue-50" : ""}`}
              style={{ minHeight: "8rem", borderColor: "var(--gray-nurse)" }}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? "text-blue-600" : ""
                }`}
              >
                {day.date.day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-white p-1 rounded cursor-pointer transition-colors"
                    style={{ backgroundColor: "var(--moss-green)" }}
                    onClick={() => onEventClick(event.id)}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor =
                        "var(--moss-green-dark)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "var(--moss-green)")
                    }
                  >
                    {event.title.length > 15
                      ? event.title.substring(0, 15) + "..."
                      : event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component (Google I/O Connect style) - Fixed Styling
function WeekView({ events, currentDate, onEventClick }) {
  const startOfWeek = currentDate.startOf("week");
  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    weekDays.push(startOfWeek.plus({ days: i }));
  }

  // Group events by day
  const eventsByDay = {};
  events.forEach((event) => {
    const eventDate = DateUtils.DateTime.fromISO(event.start_date);
    const dayKey = eventDate.toISODate();

    if (!eventsByDay[dayKey]) {
      eventsByDay[dayKey] = [];
    }

    eventsByDay[dayKey].push(event);
  });

  return (
    <div className="week-view bg-white rounded-xl shadow-md overflow-hidden">
      <div className="grid grid-cols-8 gap-0">
        <div
          className="text-white p-4 font-medium"
          style={{ backgroundColor: "var(--como)" }}
        >
          Time
        </div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-white p-4 text-center"
            style={{ backgroundColor: "var(--como)" }}
          >
            <div className="font-medium">{day.toFormat("EEE")}</div>
            <div className="text-sm">{day.toFormat("d")}</div>
          </div>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="grid grid-cols-8 gap-0 hour-slot">
            <div
              className="p-2 text-sm text-gray-500 border-r"
              style={{ borderColor: "var(--gray-nurse)" }}
            >
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayKey = day.toISODate();
              const dayEvents = eventsByDay[dayKey] || [];
              const hourEvents = dayEvents.filter((event) => {
                const eventDate = DateUtils.DateTime.fromISO(event.start_date);
                return eventDate.hour === hour;
              });

              return (
                <div
                  key={dayIndex}
                  className="p-1 border-r border-b"
                  style={{ borderColor: "var(--gray-nurse)" }}
                >
                  {hourEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-white p-1 rounded cursor-pointer mb-1 transition-colors"
                      style={{ backgroundColor: "var(--moss-green)" }}
                      onClick={() => onEventClick(event.id)}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor =
                          "var(--moss-green-dark)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "var(--moss-green)")
                      }
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Agenda View Component - Fixed for responsive single event layout
function AgendaView({ events, onEventClick }) {
  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  // Group events by date
  const eventsByDate = {};
  sortedEvents.forEach((event) => {
    const eventDate = DateUtils.DateTime.fromISO(event.start_date).toISODate();
    if (!eventsByDate[eventDate]) {
      eventsByDate[eventDate] = [];
    }
    eventsByDate[eventDate].push(event);
  });

  // Helper function to determine grid layout based on event count
  const getGridClass = (eventCount) => {
    if (eventCount === 1) return "flex justify-center"; // Center single event
    if (eventCount === 2) return "grid grid-cols-1 md:grid-cols-2 gap-6";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  };

  const getEventContainerClass = (eventCount) => {
    if (eventCount === 1) return "w-full max-w-md"; // Limit width for single event
    return "";
  };

  return (
    <div className="agenda-view space-y-6 pb-12">
      {Object.entries(eventsByDate).map(([date, dayEvents]) => (
        <div
          key={date}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div
            className="text-white p-4"
            style={{ backgroundColor: "var(--moss-green)" }}
          >
            <h3 className="font-medium">
              {DateUtils.DateTime.fromISO(date).toFormat("EEEE, LLLL d, yyyy")}
            </h3>
          </div>
          <div className="p-6">
            <div className={getGridClass(dayEvents.length)}>
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={getEventContainerClass(dayEvents.length)}
                >
                  <IOEventCard event={event} onClick={onEventClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {sortedEvents.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500">
            No events found. Try adjusting your filters or create a new event!
          </p>
        </div>
      )}
    </div>
  );
}

// Hero Section Component (Google I/O Connect style) - Fixed Styling
function HeroSection() {
  return (
    <div
      className="hero-section text-white py-16"
      style={{
        background: `linear-gradient(135deg, var(--moss-green), var(--como))`,
      }}
    >
      <div className="hero-content container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Events</h1>
        <p className="text-xl md:text-2xl opacity-90">
          Discover, connect, and engage with amazing events in your community
        </p>
      </div>
    </div>
  );
}

const getSidebarComponent = (user) => {
  if (!user || !user.roles) return ReaderSidebar;

  const roleNames = user.roles;
  if (roleNames.includes("admin")) return AdminSidebar;
  if (roleNames.includes("author")) return AuthorSidebar;
  return ReaderSidebar;
};

function EventsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("agenda");
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [filters, setFilters] = useState({});

  // Fetch events on component mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    setError(null);

    try {
      console.log("Fetching events with filters:", filters);
      const eventsData = await ApiService.getEvents(filters);
      console.log("Received events:", eventsData);
      setEvents(eventsData);
    } catch (err) {
      setError("Failed to load events. Please try again later.");
      console.error("Error: Failed to load events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    console.log("Event clicked:", eventId);
    navigate(`/app/events/${eventId}`);
  };

  const handleFilterChange = (newFilters) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(currentDate.minus({ months: 1 }));
    } else if (viewMode === "week") {
      setCurrentDate(currentDate.minus({ weeks: 1 }));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(currentDate.plus({ months: 1 }));
    } else if (viewMode === "week") {
      setCurrentDate(currentDate.plus({ weeks: 1 }));
    }
  };

  const handleToday = () => {
    setCurrentDate(DateTime.now());
  };

  const handleDownloadCalendar = () => {
    window.open(ApiService.getCalendarFeedUrl(), "_blank");
  };

  const renderCalendarView = () => {
    if (eventsLoading) {
      return (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "var(--moss-green)" }}
          ></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: "var(--moss-green)" }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "var(--moss-green-dark)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "var(--moss-green)")
            }
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (viewMode) {
      case "month":
        return (
          <MonthView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        );
      case "week":
        return (
          <WeekView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        );
      case "agenda":
        return <AgendaView events={events} onEventClick={handleEventClick} />;
      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You must be logged in.</div>;

  const SidebarComponent = getSidebarComponent(user);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Toolbar />
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <SidebarComponent
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              width: "100%",
              px: 0,
              py: 0,
            }}
          >
            {/* Events Page Content - Fixed layout and spacing */}
            <div
              style={{
                backgroundColor: "var(--spring-wood)",
                minHeight: "calc(100vh - 64px)",
              }}
            >
              <HeroSection />

              <div className="container mx-auto px-4 max-w-6xl">
                {/* Calendar header with proper spacing from hero section */}
                <div className="calendar-header rounded-xl p-6 shadow-lg mb-6 mt-8">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <button
                        className="nav-btn p-2 rounded-full"
                        onClick={handlePrevious}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                          ></path>
                        </svg>
                      </button>
                      <button
                        className="nav-btn px-4 py-2 rounded-lg text-sm font-medium"
                        onClick={handleToday}
                      >
                        Today
                      </button>
                      <button
                        className="nav-btn p-2 rounded-full"
                        onClick={handleNext}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          ></path>
                        </svg>
                      </button>
                      <h2 className="text-xl font-semibold text-white">
                        {viewMode === "month" &&
                          currentDate.toFormat("LLLL yyyy")}
                        {viewMode === "week" &&
                          `${currentDate
                            .startOf("week")
                            .toFormat("LLL d")} - ${currentDate
                            .endOf("week")
                            .toFormat("LLL d, yyyy")}`}
                        {viewMode === "agenda" && "Upcoming Events"}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div
                        className="p-1 rounded-lg flex"
                        style={{ backgroundColor: "rgba(134, 182, 151, 0.3)" }}
                      >
                        <button
                          className={`view-toggle-btn px-4 py-2 rounded-lg text-sm ${
                            viewMode === "month" ? "active" : ""
                          }`}
                          onClick={() => setViewMode("month")}
                        >
                          Month
                        </button>
                        <button
                          className={`view-toggle-btn px-4 py-2 rounded-lg text-sm ${
                            viewMode === "week" ? "active" : ""
                          }`}
                          onClick={() => setViewMode("week")}
                        >
                          Week
                        </button>
                        <button
                          className={`view-toggle-btn px-4 py-2 rounded-lg text-sm ${
                            viewMode === "agenda" ? "active" : ""
                          }`}
                          onClick={() => setViewMode("agenda")}
                        >
                          Agenda
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          className="action-btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                          onClick={handleDownloadCalendar}
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            ></path>
                          </svg>
                          iCal
                        </button>
                        <button
                          className="action-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                          onClick={() => navigate("/app/events/create")}
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            ></path>
                          </svg>
                          Create Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters with proper spacing */}
                <FilterBar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />

                {/* Calendar Views */}
                {renderCalendarView()}
              </div>
            </div>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

export default EventsPage;

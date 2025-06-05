import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import ReaderSidebar from "../../components/sidebars/ReaderSidebar";
import AuthorSidebar from "../../components/sidebars/AuthorSidebar";
import AdminSidebar from "../../components/sidebars/AdminSidebar";
import Footer from "../../components/Footer";
import RSVPButton from "../../components/events/RSVPButton";
import EventParticipantStats from "./EventParticipantStats";
import { Box, Toolbar } from "@mui/material";
import { DateTime } from "luxon";
import eventService from "../../services/eventService";

const getSidebar = (user) => {
  if (!user) return null;

  switch (user.role) {
    case "admin":
      return AdminSidebar;
    case "author":
      return AuthorSidebar;
    case "reader":
      return ReaderSidebar;
    default:
      return ReaderSidebar;
  }
};

// API Service
const EventDetailsService = {
  async getEventById(id, userId = null) {
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const url = userId
        ? `http://localhost:8000/events/${id}?user_id=${userId}`
        : `http://localhost:8000/events/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching event details:", error);

      // Return mock data for development
      return {
        id: id,
        title: "Google I/O Extended 2023",
        description:
          "Join us for an exciting day exploring the latest innovations from Google I/O. We'll cover new developments in AI, mobile development, web technologies, and cloud services. This is a perfect opportunity to network with fellow developers and learn about cutting-edge technologies that are shaping the future of software development.",
        start_date: "2023-05-14T09:00:00Z",
        end_date: "2023-05-15T18:00:00Z",
        location: "Shoreline Amphitheatre, Mountain View, CA",
        format: "in-person",
        cover_image:
          "https://source.unsplash.com/1200x600/?conference,technology",
        organizer_id: 1,
        guest_limit: 500,
        tags: [
          { name: "Technology" },
          { name: "AI" },
          { name: "Mobile" },
          { name: "Web" },
        ],
        organizer: {
          first_name: "Google",
          last_name: "Developer Relations",
        },
      };
    }
  },
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const Sidebar = getSidebar(user);

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await EventDetailsService.getEventById(id, user?.id);
      setEvent(eventData);
    } catch (error) {
      setError("Failed to load event details");
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (activeTab === "participants") {
      try {
        setParticipantsLoading(true);
        const participantsData = await eventService.getEventParticipants(id);
        setParticipants(participantsData);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setParticipantsLoading(false);
      }
    }
  };

  // Fetch participants when tab changes to participants
  useEffect(() => {
    fetchParticipants();
  }, [activeTab, id]);

  // Helper function to extract first sentence
  const getFirstSentence = (text) => {
    if (!text) return "";

    // Split by period, exclamation mark, or question mark followed by space or end of string
    const sentences = text.split(/[.!?](?:\s|$)/);

    // Return first sentence with proper punctuation
    const firstSentence = sentences[0].trim();
    if (firstSentence && !firstSentence.match(/[.!?]$/)) {
      return firstSentence + ".";
    }
    return firstSentence;
  };

  const formatDate = (dateString) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat("MMM dd, yyyy");
  };

  const formatTime = (dateString) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat("h:mm a");
  };

  const formatDateTime = (startDate, endDate) => {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);

    if (start.hasSame(end, "day")) {
      return `${start.toFormat("MMM dd, yyyy")} • ${start.toFormat(
        "h:mm a"
      )} - ${end.toFormat("h:mm a")}`;
    }
    return `${start.toFormat("MMM dd")} - ${end.toFormat("MMM dd, yyyy")}`;
  };

  const formatEventFormat = (format) => {
    switch (format) {
      case "in-person":
        return "In-person";
      case "virtual":
        return "Virtual";
      case "hybrid":
        return "Hybrid";
      default:
        return format;
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    const start = DateTime.fromISO(event.start_date).toFormat(
      "yyyyMMdd'T'HHmmss"
    );
    const end = DateTime.fromISO(event.end_date).toFormat("yyyyMMdd'T'HHmmss");

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${start}/${end}&details=${encodeURIComponent(
      event.description || ""
    )}&location=${encodeURIComponent(event.location || "")}`;

    window.open(calendarUrl, "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "Event",
          text: event?.description || "Check out this event!",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Event link copied to clipboard!");
    }
  };

  const handleRSVPChange = (response) => {
    console.log("RSVP updated:", response);
    // Refresh event data to update participant count
    fetchEventDetails();
  };

  // Organizer panel navigation
  const handleOrganizerPanel = () => {
    navigate(`/app/events/${id}/organizer`);
  };

  const renderParticipantsByStatus = (status, title, participants) => {
    const statusParticipants = participants.filter((p) => p.status === status);

    if (statusParticipants.length === 0) return null;

    return (
      <div className="mb-6">
        <h4
          className="text-lg font-semibold mb-3 flex items-center space-x-2"
          style={{ color: "var(--primary)" }}
        >
          <span>{eventService.formatStatus(status).icon}</span>
          <span>
            {title} ({statusParticipants.length})
          </span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {statusParticipants.map((participant) => (
            <div
              key={participant.user_id}
              className="bg-white rounded-lg p-4 border flex items-center space-x-3"
              style={{ borderColor: "var(--light-bg)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{
                  backgroundColor: eventService.formatStatus(participant.status)
                    .color,
                }}
              >
                {participant.user_name
                  ? participant.user_name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {participant.user_name || `User ${participant.user_id}`}
                </div>
                <div className="text-sm text-gray-500">
                  Joined{" "}
                  {new Date(participant.registered_at).toLocaleDateString()}
                </div>
              </div>
              {user && user.role === "admin" && (
                <div className="text-sm">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        eventService.formatStatus(participant.status).color +
                        "20",
                      color: eventService.formatStatus(participant.status)
                        .color,
                    }}
                  >
                    {eventService.formatStatus(participant.status).label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--spring-wood)" }}
      >
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <div className="flex items-center justify-center h-64">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: "var(--como)" }}
              ></div>
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--spring-wood)" }}
      >
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <div className="text-center py-12">
              <div className="text-red-600 text-xl mb-4">{error}</div>
              <button
                onClick={() => navigate("/app/events")}
                className="btn-primary"
              >
                Back to Events
              </button>
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--spring-wood)" }}
      >
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <div className="text-center py-12">Event not found</div>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  // Check if user is organizer - try both string and number comparison
  const isOrganizer =
    user &&
    (user.id === event.organizer_id ||
      user.id == event.organizer_id ||
      parseInt(user.id) === parseInt(event.organizer_id));

  return (
    <>
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--spring-wood)" }}
      >
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Toolbar />

            {/* Hero Section */}
            <div className="relative">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${event.cover_image})`,
                  filter: "brightness(0.7)",
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40" />

              {/* Content */}
              <div className="relative z-10 container mx-auto max-w-5xl px-4 py-16">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                  <div className="text-white mb-6 md:mb-0 max-w-3xl">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                        {formatDate(event.start_date)}
                      </span>
                      <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                        {formatEventFormat(event.format)}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {event.title}
                    </h1>
                    <p className="text-lg mb-4">
                      {getFirstSentence(event.description)}
                    </p>
                    <div className="flex items-center space-x-4">
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <svg
                            className="h-5 w-5"
                            style={{ color: "var(--primary)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                          <span style={{ color: "var(--primary)" }}>
                            {event.location}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-5 w-5"
                          style={{ color: "var(--primary)" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <span style={{ color: "var(--primary)" }}>
                          {formatTime(event.start_date)} -{" "}
                          {formatTime(event.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                    {/* Organizer Manage Button */}
                    {isOrganizer && (
                      <button
                        onClick={handleOrganizerPanel}
                        className="py-2 px-6 rounded-full flex items-center justify-center space-x-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                        <span>Manage Event</span>
                      </button>
                    )}

                    {/* RSVP Button - Only show if user is logged in and not the organizer */}
                    {user && !isOrganizer && (
                      <RSVPButton
                        eventId={parseInt(id)}
                        userId={user.id}
                        onRSVPChange={handleRSVPChange}
                      />
                    )}

                    <button
                      onClick={handleAddToCalendar}
                      className="btn-primary py-2 px-6 rounded-full flex items-center justify-center space-x-2"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span>Add to Calendar</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="py-2 px-6 rounded-full flex items-center justify-center space-x-2 border border-primary bg-white text-primary hover:bg-primary/10 hover:text-primary shadow transform transition-all duration-500 ease-out hover:-translate-y-1"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        ></path>
                      </svg>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto max-w-5xl px-4 py-8">
              {/* Navigation Tabs */}
              <div className="flex space-x-8 border-b border-gray-200 mb-8">
                <div
                  className={`tab py-2 ${
                    activeTab === "overview" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </div>
                <div
                  className={`tab py-2 ${
                    activeTab === "agenda" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("agenda")}
                >
                  Agenda
                </div>
                <div
                  className={`tab py-2 ${
                    activeTab === "participants" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("participants")}
                >
                  Participants
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="tab-content">
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <h2
                        className="text-2xl font-bold mb-4"
                        style={{ color: "var(--primary)" }}
                      >
                        About This Event
                      </h2>
                      <div className="prose max-w-none text-gray-700">
                        <p>{event.description}</p>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-6">
                          <h3
                            className="text-lg font-semibold mb-3"
                            style={{ color: "var(--primary)" }}
                          >
                            Topics
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                  backgroundColor: "var(--light-bg)",
                                  color: "var(--primary)",
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Event Details Card */}
                      <div
                        className="bg-white rounded-lg p-6 border"
                        style={{ borderColor: "var(--light-bg)" }}
                      >
                        <h3
                          className="text-lg font-semibold mb-4"
                          style={{ color: "var(--primary)" }}
                        >
                          Event Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <svg
                              className="h-5 w-5 mt-0.5"
                              style={{ color: "var(--secondary)" }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                              ></path>
                            </svg>
                            <div>
                              <p className="font-medium">Date & Time</p>
                              <p className="text-gray-600 text-sm">
                                {formatDateTime(
                                  event.start_date,
                                  event.end_date
                                )}
                              </p>
                            </div>
                          </div>

                          {event.location && (
                            <div className="flex items-start space-x-3">
                              <svg
                                className="h-5 w-5 mt-0.5"
                                style={{ color: "var(--secondary)" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                              <div>
                                <p className="font-medium">Location</p>
                                <p className="text-gray-600 text-sm">
                                  {event.location}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start space-x-3">
                            <svg
                              className="h-5 w-5 mt-0.5"
                              style={{ color: "var(--secondary)" }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              ></path>
                            </svg>
                            <div>
                              <p className="font-medium">Format</p>
                              <p className="text-gray-600 text-sm">
                                {formatEventFormat(event.format)}
                              </p>
                            </div>
                          </div>

                          {event.organizer && (
                            <div className="flex items-start space-x-3">
                              <svg
                                className="h-5 w-5 mt-0.5"
                                style={{ color: "var(--secondary)" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                ></path>
                              </svg>
                              <div>
                                <p className="font-medium">Organizer</p>
                                <p className="text-gray-600 text-sm">
                                  {event.organizer.first_name}{" "}
                                  {event.organizer.last_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Participant Stats */}
                      <EventParticipantStats
                        eventId={parseInt(id)}
                        isOrganizer={isOrganizer}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "agenda" && (
                <div className="tab-content">
                  <h2
                    className="text-2xl font-bold mb-6"
                    style={{ color: "var(--primary)" }}
                  >
                    Event Agenda
                  </h2>
                  <div
                    className="bg-white rounded-lg p-6 border"
                    style={{ borderColor: "var(--light-bg)" }}
                  >
                    <p className="text-gray-600">
                      Agenda details will be available soon.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "participants" && (
                <div className="tab-content">
                  <div className="flex justify-between items-center mb-6">
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      Event Participants
                    </h2>
                    {participants.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Total: {participants.length} participants
                      </div>
                    )}
                  </div>

                  {participantsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2"
                        style={{ borderColor: "var(--como)" }}
                      ></div>
                      <span className="ml-3 text-gray-600">
                        Loading participants...
                      </span>
                    </div>
                  ) : participants.length === 0 ? (
                    <div
                      className="bg-white rounded-lg p-8 border text-center"
                      style={{ borderColor: "var(--light-bg)" }}
                    >
                      <div className="text-gray-400 text-6xl mb-4">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No participants yet
                      </h3>
                      <p className="text-gray-600">
                        Be the first to RSVP to this event!
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Confirmed Participants */}
                      {renderParticipantsByStatus(
                        "confirmed",
                        "Confirmed Attendees",
                        participants
                      )}

                      {/* Registered Participants */}
                      {renderParticipantsByStatus(
                        "registered",
                        "Going",
                        participants
                      )}

                      {/* Cancelled Participants (only show to organizers) */}
                      {isOrganizer &&
                        renderParticipantsByStatus(
                          "cancelled",
                          "Not Going",
                          participants
                        )}

                      {/* Summary for organizers */}
                      {isOrganizer && (
                        <div className="mt-8 bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <h4 className="font-semibold text-orange-800 mb-2">
                            Organizer Summary
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-orange-600">
                                Total Responses:
                              </span>
                              <span className="font-medium ml-1">
                                {participants.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-green-600">Confirmed:</span>
                              <span className="font-medium ml-1">
                                {
                                  participants.filter(
                                    (p) => p.status === "confirmed"
                                  ).length
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-600">Going:</span>
                              <span className="font-medium ml-1">
                                {
                                  participants.filter(
                                    (p) => p.status === "registered"
                                  ).length
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default EventDetailsPage;

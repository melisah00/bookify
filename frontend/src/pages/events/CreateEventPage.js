import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import ReaderSidebar from "../../components/sidebars/ReaderSidebar";
import AuthorSidebar from "../../components/sidebars/AuthorSidebar";
import AdminSidebar from "../../components/sidebars/AdminSidebar";
import Footer from "../../components/Footer";
import { Box, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const getSidebarComponent = (user) => {
  if (!user || !user.roles) return ReaderSidebar;

  const roleNames = user.roles.map((role) => role.name);
  if (roleNames.includes("admin")) return AdminSidebar;
  if (roleNames.includes("author")) return AuthorSidebar;
  return ReaderSidebar;
};

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    duration: "2",
    location: "",
    format: "in-person", // Updated to match backend enum (with hyphen)
    meeting_link: "",
    cover_image: "",
    guest_limit: "",
    tag_names: [],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tag_names.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tag_names: [...prev.tag_names, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tag_names: prev.tag_names.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.event_date) {
      newErrors.event_date = "Event date is required";
    }

    if (!formData.start_time) {
      newErrors.start_time = "Start time is required";
    }

    if (!formData.duration || parseFloat(formData.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (formData.format === "virtual" && !formData.meeting_link.trim()) {
      newErrors.meeting_link = "Meeting link is required for virtual events";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDateTimes = () => {
    const eventDate = formData.event_date;
    const startTime = formData.start_time;
    const duration = parseFloat(formData.duration);

    // Create start datetime
    const startDateTime = new Date(`${eventDate}T${startTime}`);

    // Create end datetime by adding duration hours
    const endDateTime = new Date(
      startDateTime.getTime() + duration * 60 * 60 * 1000
    );

    return {
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if user is available
    if (!user || !user.id) {
      alert(
        "User information not available. Please refresh the page and try again."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate start_date and end_date
      const { start_date, end_date } = calculateDateTimes();

      // Format data for API - MUST include organizer_id and correct format
      const formattedData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date,
        end_date,
        location: formData.location.trim() || null,
        format: formData.format, // This should be 'in-person', 'virtual', or 'hybrid'
        meeting_link: formData.meeting_link.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        guest_limit: formData.guest_limit
          ? parseInt(formData.guest_limit)
          : null,
        organizer_id: user.id, // REQUIRED: Must always be included
        tag_names: formData.tag_names.length > 0 ? formData.tag_names : [],
      };

      // Only remove fields that are truly null/empty, but NEVER remove organizer_id or tag_names
      const finalData = {};
      Object.keys(formattedData).forEach((key) => {
        if (key === "organizer_id" || key === "tag_names") {
          // Always include these fields
          finalData[key] = formattedData[key];
        } else if (formattedData[key] !== null && formattedData[key] !== "") {
          // Include non-null, non-empty values
          finalData[key] = formattedData[key];
        }
      });

      // Debug logging
      console.log("User object:", user);
      console.log("Final data to submit:", finalData);

      const response = await fetch("http://localhost:8000/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if you have a token
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        credentials: "include",
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server response:", errorData);

        // Show detailed error message
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join("\n");
          throw new Error(`Validation errors:\n${errorMessages}`);
        }

        throw new Error(errorData.detail || "Failed to create event");
      }

      const createdEvent = await response.json();
      console.log("Event created successfully:", createdEvent);

      // Show success message and navigate back to events page
      alert("Event created successfully!");
      navigate("/app/events");
    } catch (error) {
      console.error("Error creating event:", error);
      alert(`Error creating event:\n${error.message}`);
    } finally {
      setIsSubmitting(false);
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
              overflowY: "auto",
              width: "100%",
              px: 0,
              py: 0,
            }}
          >
            {/* Create Event Form Content */}
            <div
              style={{
                backgroundColor: "#f8f6f1",
                minHeight: "calc(100vh - 64px)",
              }}
            >
              <div className="container mx-auto px-4 max-w-4xl py-8">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => navigate("/app/events")}
                      className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow mr-4"
                    >
                      <svg
                        className="w-5 h-5 text-como"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        ></path>
                      </svg>
                    </button>
                    <div>
                      <h1 className="text-3xl font-bold text-como">
                        Create New Event
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Share your event with the community
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                  <form onSubmit={handleSubmit} className="p-8">
                    {/* Basic Information */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-como mb-6">
                        Basic Information
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green ${
                              errors.title
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="Enter event title"
                          />
                          {errors.title && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.title}
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green resize-none"
                            placeholder="Describe your event..."
                          />
                        </div>

                        {/* Event Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Date *
                          </label>
                          <input
                            type="date"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green ${
                              errors.event_date
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.event_date && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.event_date}
                            </p>
                          )}
                        </div>

                        {/* Start Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green ${
                              errors.start_time
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.start_time && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.start_time}
                            </p>
                          )}
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (hours) *
                          </label>
                          <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            min="0.5"
                            step="0.5"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green ${
                              errors.duration
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="2"
                          />
                          {errors.duration && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.duration}
                            </p>
                          )}
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                            placeholder="Enter event location"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-como mb-6">
                        Event Details
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Format - Updated with correct enum values */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Format *
                          </label>
                          <select
                            name="format"
                            value={formData.format}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                          >
                            <option value="in-person">In-Person</option>
                            <option value="virtual">Virtual</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>

                        {/* Guest Limit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Limit
                          </label>
                          <input
                            type="number"
                            name="guest_limit"
                            value={formData.guest_limit}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                            placeholder="Max number of attendees"
                          />
                        </div>

                        {/* Meeting Link (for virtual events) */}
                        {(formData.format === "virtual" ||
                          formData.format === "hybrid") && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Meeting Link{" "}
                              {formData.format === "virtual" ? "*" : ""}
                            </label>
                            <input
                              type="url"
                              name="meeting_link"
                              value={formData.meeting_link}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green ${
                                errors.meeting_link
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="https://zoom.us/j/..."
                            />
                            {errors.meeting_link && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.meeting_link}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Cover Image */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Image URL
                          </label>
                          <input
                            type="url"
                            name="cover_image"
                            value={formData.cover_image}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-como mb-6">
                        Tags
                      </h2>

                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addTag())
                            }
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                            placeholder="Add a tag"
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="px-6 py-3 bg-moss-green text-white rounded-lg hover:bg-moss-green-dark transition-colors"
                          >
                            Add
                          </button>
                        </div>

                        {formData.tag_names.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tag_names.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-moss-green text-white rounded-full text-sm flex items-center gap-1"
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-white hover:text-gray-200"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => navigate("/app/events")}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-como text-white rounded-lg hover:bg-tradewind transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Creating..." : "Create Event"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

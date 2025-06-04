import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import eventService from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import ReaderSidebar from '../../components/sidebars/ReaderSidebar';
import AuthorSidebar from '../../components/sidebars/AuthorSidebar';
import AdminSidebar from '../../components/sidebars/AdminSidebar';

const getSidebarComponent = (user) => {
  if (!user) return ReaderSidebar;
  
  switch (user.role) {
    case 'admin':
      return AdminSidebar;
    case 'author':
      return AuthorSidebar;
    case 'reader':
    default:
      return ReaderSidebar;
  }
};

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    duration: '',
    location: '',
    format: 'in-person',
    meeting_link: '',
    cover_image: '',
    guest_limit: '',
    tag_names: [],
    current_tag: ''
  });

  useEffect(() => {
    if (user && id) {
      fetchEventData();
    }
  }, [id, user]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const event = await eventService.getEventById(id);
      
      // Check if user is the organizer
      if (event.organizer_id !== user.id) {
        alert('You are not authorized to edit this event.');
        navigate('/app/events');
        return;
      }

      // Convert event data to form format
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const duration = (endDate - startDate) / (1000 * 60 * 60); // Convert to hours

      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        duration: duration.toString(),
        location: event.location || '',
        format: event.format || 'in-person',
        meeting_link: event.meeting_link || '',
        cover_image: event.cover_image || '',
        guest_limit: event.guest_limit ? event.guest_limit.toString() : '',
        tag_names: event.tags ? event.tags.map(tag => tag.name) : [],
        current_tag: ''
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event data.');
      navigate('/app/events');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addTag = () => {
    if (formData.current_tag.trim() && !formData.tag_names.includes(formData.current_tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tag_names: [...prev.tag_names, prev.current_tag.trim()],
        current_tag: ''
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tag_names: prev.tag_names.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    } else if (parseFloat(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDateTimes = () => {
    const eventDateTime = new Date(`${formData.event_date}T${formData.start_time}:00`);
    const durationMs = parseFloat(formData.duration) * 60 * 60 * 1000;
    const endDateTime = new Date(eventDateTime.getTime() + durationMs);
    
    return {
      start_date: eventDateTime.toISOString(),
      end_date: endDateTime.toISOString()
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user || !user.id) {
      alert('User information not available. Please refresh the page and try again.');
      return;
    }

    setSubmitting(true);

    try {
      const { start_date, end_date } = calculateDateTimes();

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date,
        end_date,
        location: formData.location.trim() || null,
        format: formData.format,
        meeting_link: formData.meeting_link.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        guest_limit: formData.guest_limit ? parseInt(formData.guest_limit) : null,
        tag_names: formData.tag_names
      };

      console.log('Updating event with data:', updateData);

      await eventService.updateEvent(id, updateData);
      alert('Event updated successfully!');
      navigate(`/app/events/${id}`);
      
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Error updating event:\n${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <div>Loading...</div>;
  if (!user) return <div>You must be logged in.</div>;

  const SidebarComponent = getSidebarComponent(user);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toolbar />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <SidebarComponent 
          open={sidebarOpen} 
          onToggle={() => setSidebarOpen(o => !o)} 
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#f8f9fa',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              width: '100%',
              px: 0,
              py: 0,
            }}
          >
            {/* Edit Event Form Content */}
            <div style={{ backgroundColor: '#f8f6f1', minHeight: 'calc(100vh - 64px)' }}>
              <div className="container mx-auto px-4 max-w-4xl py-8">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <button 
                      onClick={() => navigate(`/app/events/${id}`)}
                      className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow mr-4"
                    >
                      <svg className="w-5 h-5 text-como" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </button>
                    <div>
                      <h1 className="text-3xl font-bold text-como">Edit Event</h1>
                      <p className="text-gray-600 mt-1">Update your event details</p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                  <form onSubmit={handleSubmit} className="p-8">
                    {/* Basic Information */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-como mb-6">Basic Information</h2>
                      
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
                              errors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter event title"
                          />
                          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
                              errors.event_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
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
                              errors.start_time ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
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
                              errors.duration ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="2"
                          />
                          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
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
                      <h2 className="text-xl font-semibold text-como mb-6">Event Details</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Format */}
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
                            placeholder="Leave empty for unlimited"
                          />
                        </div>

                        {/* Meeting Link */}
                        {(formData.format === 'virtual' || formData.format === 'hybrid') && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Meeting Link
                            </label>
                            <input
                              type="url"
                              name="meeting_link"
                              value={formData.meeting_link}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                              placeholder="https://zoom.us/j/..."
                            />
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
                      <h2 className="text-xl font-semibold text-como mb-6">Tags</h2>
                      
                      <div className="flex gap-3 mb-4">
                        <input
                          type="text"
                          name="current_tag"
                          value={formData.current_tag}
                          onChange={handleInputChange}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
                          placeholder="Add a tag..."
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-6 py-3 bg-moss-green text-white rounded-lg hover:bg-moss-green-dark transition-colors font-medium"
                        >
                          Add Tag
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {formData.tag_names.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-moss-green text-white"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:bg-red-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/events/${id}`)}
                        className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-como text-white rounded-lg hover:bg-como-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Updating Event...' : 'Update Event'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EditEventPage;
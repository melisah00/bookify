import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import ReaderSidebar from '../../components/sidebars/ReaderSidebar';
import AuthorSidebar from '../../components/sidebars/AuthorSidebar';
import AdminSidebar from '../../components/sidebars/AdminSidebar';
import Footer from '../../components/Footer';
import { Box, Toolbar } from '@mui/material';
import { DateTime } from 'luxon';

const getSidebar = (user) => {
  if (!user) return null;
  
  switch (user.role) {
    case 'admin':
      return AdminSidebar;
    case 'author':
      return AuthorSidebar;
    case 'reader':
      return ReaderSidebar;
    default:
      return ReaderSidebar;
  }
};

// API Service
const EventDetailsService = {
  async getEventById(id) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/events/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      
      // Return mock data for development
      return {
        id: id,
        title: "Google I/O Extended 2023",
        description: "",
        start_date: "2023-05-14T09:00:00Z",
        end_date: "2023-05-15T18:00:00Z",
        location: "Shoreline Amphitheatre, Mountain View, CA",
        format: "in-person",
        cover_image: "https://source.unsplash.com/1200x600/?conference,technology",
        tags: [
          { name: "Technology" },
          { name: "AI" },
          { name: "Mobile" },
          { name: "Web" }
        ],
        organizer: {
          first_name: "Google",
          last_name: "Developer Relations"
        }
      };
    }
  }
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const Sidebar = getSidebar(user);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await EventDetailsService.getEventById(id);
      setEvent(eventData);
    } catch (error) {
      setError('Failed to load event details');
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract first sentence
  const getFirstSentence = (text) => {
    if (!text) return '';
    
    // Split by period, exclamation mark, or question mark followed by space or end of string
    const sentences = text.split(/[.!?](?:\s|$)/);
    
    // Return first sentence with proper punctuation
    const firstSentence = sentences[0].trim();
    if (firstSentence && !firstSentence.match(/[.!?]$/)) {
      return firstSentence + '.';
    }
    return firstSentence;
  };

  const formatDate = (dateString) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat('MMM dd, yyyy');
  };

  const formatTime = (dateString) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat('h:mm a');
  };

  const formatDateTime = (startDate, endDate) => {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    
    if (start.hasSame(end, 'day')) {
      return `${start.toFormat('MMM dd, yyyy')} • ${start.toFormat('h:mm a')} - ${end.toFormat('h:mm a')}`;
    }
    return `${start.toFormat('MMM dd')} - ${end.toFormat('MMM dd, yyyy')}`;
  };

  const formatEventFormat = (format) => {
    switch(format) {
      case 'in-person': return 'In-person';
      case 'virtual': return 'Virtual';
      case 'hybrid': return 'Hybrid';
      default: return format;
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    const start = DateTime.fromISO(event.start_date).toFormat("yyyyMMdd'T'HHmmss");
    const end = DateTime.fromISO(event.end_date).toFormat("yyyyMMdd'T'HHmmss");
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
    
    window.open(calendarUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Event',
          text: event?.description || 'Check out this event!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--como)' }}></div>
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>Event Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The event you\'re looking for doesn\'t exist.'}</p>
              <button 
                onClick={() => navigate('/app/events')}
                className="text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
                style={{ backgroundColor: 'var(--como)' }}
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

  return (
    <>
      <style>
        {`
          :root {
            --spring-wood: #f8f6f1;
            --gray-nurse: #e1eae5;
            --moss-green: #a7d7b8;
            --moss-green-dark: #86b697;
            --moss-green-darker: #76a687;
            --tradewind: #66b2a0;
            --como: #4e796b;
            --primary: var(--como);
            --secondary: var(--tradewind);
            --accent: var(--moss-green);
            --background: var(--spring-wood);
            --light-bg: var(--gray-nurse);
          }
          
          .btn-primary {
            background-color: var(--primary);
            color: white;
            transition: all 0.2s ease;
          }
          
          .btn-primary:hover {
            background-color: var(--secondary);
          }
          
          .btn-outline {
            border: 1px solid var(--primary);
            color: var(--primary);
            transition: all 0.2s ease;
          }
          
          .btn-outline:hover {
            background-color: var(--primary);
            color: white;
          }
          
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .badge-going {
            background-color: var(--accent);
            color: var(--primary);
          }
          
          .event-header {
            background-color: var(--moss-green);
            color: var(--primary);
          }
          
          .tab {
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .tab.active {
            color: var(--primary);
            font-weight: 500;
          }
          
          .tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: var(--primary);
            border-radius: 3px 3px 0 0;
          }
          
          .tab:not(.active) {
            color: #666;
          }
          
          .tab:hover:not(.active) {
            color: var(--secondary);
          }
          
          .speaker-card {
            transition: all 0.3s ease;
          }
          
          .speaker-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          .related-event-card {
            border-left: 4px solid var(--accent);
            transition: all 0.3s ease;
          }
          
          .related-event-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          .avatar {
            background-color: var(--light-bg);
            color: var(--primary);
          }
          
          .tab-content {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Toolbar />
            
            {/* Event Header */}
            <div className="event-header py-12 px-4">
              <div className="container mx-auto max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="badge badge-going">
                        {formatEventFormat(event.format)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
                    <p className="text-lg mb-4">{getFirstSentence(event.description)}</p>
                    <div className="flex items-center space-x-4">
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <svg className="h-5 w-5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span style={{ color: 'var(--primary)' }}>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span style={{ color: 'var(--primary)' }}>
                          {formatTime(event.start_date)} - {formatTime(event.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                    <button 
                      onClick={handleAddToCalendar}
                      className="btn-primary py-2 px-6 rounded-full flex items-center justify-center space-x-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>Add to Calendar</span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="btn-outline py-2 px-6 rounded-full flex items-center justify-center space-x-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                      </svg>
                      <span>Share Event</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-5xl px-4 py-8">
              <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
                <div className="md:w-2/3">
                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <div className="flex space-x-8">
                      {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'schedule', label: 'Schedule' },
                        { id: 'speakers', label: 'Speakers' },
                        { id: 'faq', label: 'FAQ' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`tab py-4 px-1 ${activeTab === tab.id ? 'active' : ''}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content py-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-8">
                        {/* Event Image */}
                        {event.cover_image && (
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={event.cover_image} 
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* About Event */}
                        <div>
                          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>About this event</h2>
                          <div className="prose max-w-none">
                            <p className="text-gray-600 leading-relaxed mb-4">
                              {event.description || 'No description available for this event.'}
                            </p>
                            <p className="text-gray-600 leading-relaxed mb-4">
                              This year's event will focus on the latest advancements in AI and machine learning, with sessions on how to leverage these technologies in your applications. You'll also learn about the newest features in Android, Flutter, Firebase, and Google Cloud.
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                              Whether you're a beginner or an experienced developer, there's something for everyone at this event. Join us for an unforgettable experience of learning, networking, and fun!
                            </p>
                          </div>
                        </div>

                        {/* Event Highlights */}
                        <div>
                          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>Event Highlights</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                                <svg className="h-6 w-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-lg" style={{ color: 'var(--como)' }}>Keynote Sessions</h3>
                                <p className="text-gray-600">Hear from industry leaders about the latest innovations and product announcements.</p>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                                <svg className="h-6 w-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-lg" style={{ color: 'var(--como)' }}>Networking Opportunities</h3>
                                <p className="text-gray-600">Connect with fellow developers, experts, and industry leaders.</p>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                                <svg className="h-6 w-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-lg" style={{ color: 'var(--como)' }}>Hands-on Labs</h3>
                                <p className="text-gray-600">Get practical experience with the latest technologies through guided workshops.</p>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                                <svg className="h-6 w-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-lg" style={{ color: 'var(--como)' }}>Product Demos</h3>
                                <p className="text-gray-600">See the latest products and services in action with live demonstrations.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Event Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--como)' }}>Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {event.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: 'var(--moss-green)', color: 'var(--como)' }}
                                >
                                  #{typeof tag === 'object' ? tag.name : tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'schedule' && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>Event Schedule</h2>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-600">Schedule details will be available soon.</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'speakers' && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>Featured Speakers</h2>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-600">Speaker information will be available soon.</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'faq' && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--como)' }}>Frequently Asked Questions</h2>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-600">FAQ section will be available soon.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="md:w-1/3">
                  {/* Event Details Card */}
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--como)' }}>Event Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <svg className="h-5 w-5 mt-0.5" style={{ color: 'var(--como)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--como)' }}>Date & Time</p>
                          <p className="text-gray-600">{formatDateTime(event.start_date, event.end_date)}</p>
                        </div>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-start space-x-3">
                          <svg className="h-5 w-5 mt-0.5" style={{ color: 'var(--como)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--como)' }}>Location</p>
                            <p className="text-gray-600">{event.location}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <svg className="h-5 w-5 mt-0.5" style={{ color: 'var(--como)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--como)' }}>Organizer</p>
                          <p className="text-gray-600">
                            {event.organizer ? 
                              `${event.organizer.first_name} ${event.organizer.last_name}` : 
                              'Event Organizer'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <svg className="h-5 w-5 mt-0.5" style={{ color: 'var(--como)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--como)' }}>Format</p>
                          <p className="text-gray-600 capitalize">
                            {formatEventFormat(event.format)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      <button className="btn-primary w-full py-2 px-4 rounded-full flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        <span>Register Now</span>
                      </button>
                      
                      <button className="btn-outline w-full py-2 px-4 rounded-full flex items-center justify-center space-x-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        <span>I'm Interested</span>
                      </button>
                    </div>
                  </div>

                  {/* Back to Events */}
                  <div className="text-center">
                    <button 
                      onClick={() => navigate('/app/events')}
                      className="inline-flex items-center space-x-1 hover:opacity-80"
                      style={{ color: 'var(--tradewind)' }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                      </svg>
                      <span>Back to Events</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default EventDetailsPage;
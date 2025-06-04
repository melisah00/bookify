import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import eventService from '../../services/eventService';
import Header from '../../components/Header';
import ReaderSidebar from '../../components/sidebars/ReaderSidebar';
import AuthorSidebar from '../../components/sidebars/AuthorSidebar';
import AdminSidebar from '../../components/sidebars/AdminSidebar';
import Footer from '../../components/Footer';
import { Box, Toolbar } from '@mui/material';

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

const OrganizerPanel = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventId, setEventId] = useState(id || null);
  const [returnPath, setReturnPath] = useState('/app/events');

  const Sidebar = getSidebar(user);

  useEffect(() => {
    if (id) {
      setEventId(id);
    } else if (location.state) {
      setEventId(location.state.eventId);
      setReturnPath(location.state.returnPath || '/app/events');
    }
  }, [id, location.state]);

  const handleEditEvent = () => {
    navigate(`/app/events/${eventId}/edit`);
  };

  const handleViewAnalytics = () => {
    navigate(`/app/events/${eventId}/analytics`);
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(eventId);
        alert('Event deleted successfully!');
        navigate('/app/events');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleBackToEvent = () => {
    if (eventId) {
      navigate(`/app/events/${eventId}`);
    } else {
      navigate(returnPath);
    }
  };

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

          .organizer-panel {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }

          .panel-header {
            text-align: center;
            margin-bottom: 3rem;
          }

          .panel-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 0.5rem;
          }

          .panel-subtitle {
            color: #666;
            font-size: 1.1rem;
          }

          .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
          }

          .benefit-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            border: 2px solid var(--light-bg);
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .benefit-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(78, 121, 107, 0.15);
            border-color: var(--accent);
          }

          .benefit-card.delete-card {
            border-color: #ffcdd2;
          }

          .benefit-card.delete-card:hover {
            border-color: #f44336;
            box-shadow: 0 12px 24px rgba(244, 67, 54, 0.15);
          }

          .benefit-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          .benefit-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 0.5rem;
          }

          .benefit-title.delete-title {
            color: #f44336;
          }

          .benefit-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }

          .benefit-button {
            background: linear-gradient(135deg, var(--accent), var(--secondary));
            color: var(--primary);
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
          }

          .benefit-button:hover {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            transform: translateY(-1px);
          }

          .benefit-button.delete-button {
            background: linear-gradient(135deg, #ffcdd2, #f44336);
            color: #f44336;
          }

          .benefit-button.delete-button:hover {
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: white;
          }

          .back-button {
            background: var(--light-bg);
            color: var(--primary);
            border: 2px solid var(--primary);
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: block;
            margin: 0 auto;
          }

          .back-button:hover {
            background: var(--primary);
            color: white;
          }
        `}
      </style>

      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Toolbar />
            
            <div className="organizer-panel">
              <div className="panel-header">
                <h1 className="panel-title">🎯 Organizer Benefits</h1>
                <p className="panel-subtitle">
                  Manage your event like a pro with powerful organizer tools
                </p>
              </div>

              <div className="benefits-grid">
                <div className="benefit-card" onClick={handleEditEvent}>
                  <div className="benefit-icon">✏️</div>
                  <h3 className="benefit-title">Edit Event</h3>
                  <p className="benefit-description">
                    Update event details, change date & time, modify description, 
                    and manage all aspects of your event in real-time.
                  </p>
                  <button className="benefit-button">Edit Event Details</button>
                </div>

                <div className="benefit-card" onClick={handleViewAnalytics}>
                  <div className="benefit-icon">📊</div>
                  <h3 className="benefit-title">View Analytics</h3>
                  <p className="benefit-description">
                    Get detailed insights about your event performance, participant 
                    engagement, registration trends, and comprehensive reports.
                  </p>
                  <button className="benefit-button">View Event Analytics</button>
                </div>

                <div className="benefit-card delete-card" onClick={handleDeleteEvent}>
                  <div className="benefit-icon">🗑️</div>
                  <h3 className="benefit-title delete-title">Delete Event</h3>
                  <p className="benefit-description">
                    Permanently remove this event from the system. This action 
                    cannot be undone and will cancel all registrations.
                  </p>
                  <button className="benefit-button delete-button">Delete Event</button>
                </div>
              </div>

              <button className="back-button" onClick={handleBackToEvent}>
                ← Back to Event
              </button>
            </div>
          </Box>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default OrganizerPanel;
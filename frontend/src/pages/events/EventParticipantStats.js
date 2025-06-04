import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import './EventParticipantStats.css';

const EventParticipantStats = ({ eventId, isOrganizer = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  const fetchStats = async () => {
    try {
      const statsData = await eventService.getEventStats(eventId);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-loading">Loading participant stats...</div>;
  }

  if (!stats) {
    return <div className="stats-error">Unable to load participant stats</div>;
  }

  const formatStatus = (status) => eventService.formatStatus(status);

  return (
    <div className="participant-stats">
      <div className="stats-header">
        <h3>Event Participation</h3>
        {isOrganizer && (
          <span className="organizer-badge">Organizer View</span>
        )}
      </div>

      <div className="stats-summary">
        <div className="total-count">
          <span className="count">{stats.total_participants}</span>
          <span className="label">Total Responses</span>
        </div>
      </div>

      <div className="stats-breakdown">
        {Object.entries(stats.status_breakdown).map(([status, count]) => {
          if (count === 0) return null;
          
          const statusInfo = formatStatus(status);
          return (
            <div key={status} className={`stat-item ${status}`}>
              <div className="stat-icon">{statusInfo.icon}</div>
              <div className="stat-details">
                <div className="stat-label">{statusInfo.label}</div>
                <div className="stat-count">{count}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventParticipantStats;
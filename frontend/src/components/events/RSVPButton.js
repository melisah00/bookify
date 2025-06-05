import React, { useState, useEffect } from "react";
import eventService from "../../services/eventService";
import "./RSVPButton.css";

const RSVPButton = ({ eventId, userId, onRSVPChange, disabled = false }) => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    fetchRSVPStatus();
  }, [eventId, userId]);

  const fetchRSVPStatus = async () => {
    try {
      const response = await eventService.getUserRSVPStatus(eventId, userId);
      setCurrentStatus(response.status);
    } catch (error) {
      console.error("Error fetching RSVP status:", error);
    }
  };

  const handleRSVP = async (status) => {
    if (disabled) return;

    setLoading(true);
    try {
      const response = await eventService.rsvpToEvent(eventId, status, userId);
      if (response.success) {
        setCurrentStatus(status);
        setShowOptions(false);
        if (onRSVPChange) {
          onRSVPChange(response);
        }
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRSVPOptions = () => eventService.getRSVPOptions();
  const formatStatus = (status) => eventService.formatStatus(status);

  const currentStatusInfo = currentStatus ? formatStatus(currentStatus) : null;

  return (
    <div className="rsvp-container">
      <div className="rsvp-button-group">
        {currentStatus ? (
          <button
            className={`rsvp-button current-status ${currentStatus}`}
            onClick={() => setShowOptions(!showOptions)}
            disabled={disabled || loading}
          >
            <span className="status-icon">{currentStatusInfo.icon}</span>
            <span className="status-text">{currentStatusInfo.label}</span>
            <span className="dropdown-arrow">{showOptions ? "▲" : "▼"}</span>
          </button>
        ) : (
          <button
            className="rsvp-button rsvp-primary"
            onClick={() => setShowOptions(!showOptions)}
            disabled={disabled || loading}
          >
            <span>RSVP</span>
            <span className="dropdown-arrow">{showOptions ? "▲" : "▼"}</span>
          </button>
        )}

        {showOptions && (
          <div className="rsvp-options">
            {getRSVPOptions().map((option) => (
              <button
                key={option.value}
                className={`rsvp-option ${option.value} ${
                  currentStatus === option.value ? "selected" : ""
                }`}
                onClick={() => handleRSVP(option.value)}
                disabled={loading}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-text">{option.label}</span>
                {currentStatus === option.value && (
                  <span className="check-mark">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="rsvp-loading">Updating...</div>}
    </div>
  );
};

export default RSVPButton;

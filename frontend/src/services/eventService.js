import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

class EventService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/events`;
    
    // Set up axios defaults
    axios.defaults.withCredentials = true;
  }

  async createEvent(eventData) {
    try {
      const response = await axios.post(this.baseUrl, eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async getAllEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.format) params.append('format', filters.format);
      if (filters.author) params.append('author', filters.author);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEventById(eventId, userId = null) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await axios.get(`${this.baseUrl}/${eventId}${params}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      const response = await axios.put(`${this.baseUrl}/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  }

  async getMyEvents() {
    try {
      const response = await axios.get(`${this.baseUrl}/my-events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my events:', error);
      throw error;
    }
  }

  async getMyRegistrations() {
    try {
      const response = await axios.get(`${this.baseUrl}/my-registrations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my registrations:', error);
      throw error;
    }
  }

  async getEventParticipants(eventId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/participants`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching participants for event ${eventId}:`, error);
      throw error;
    }
  }

  async addParticipant(eventId, participantData) {
    try {
      const response = await axios.post(`${this.baseUrl}/${eventId}/participants`, participantData);
      return response.data;
    } catch (error) {
      console.error(`Error adding participant to event ${eventId}:`, error);
      throw error;
    }
  }

  async rsvpToEvent(eventId, status, userId) {
    try {
      const response = await axios.post(`${this.baseUrl}/${eventId}/rsvp?user_id=${userId}`, {
        status: status
      });
      return response.data;
    } catch (error) {
      console.error(`Error RSVPing to event ${eventId}:`, error);
      throw error;
    }
  }

  async getUserRSVPStatus(eventId, userId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/rsvp-status?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching RSVP status for event ${eventId}:`, error);
      throw error;
    }
  }

  async getEventStats(eventId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for event ${eventId}:`, error);
      throw error;
    }
  }

  async getEventAttendees(eventId, status = null, organizerId = null) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (organizerId) params.append('organizer_id', organizerId);
      
      const response = await axios.get(`${this.baseUrl}/${eventId}/attendees?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching attendees for event ${eventId}:`, error);
      throw error;
    }
  }

  async bulkUpdateAttendees(eventId, updates, organizerId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${eventId}/bulk-update-attendees?organizer_id=${organizerId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error(`Error bulk updating attendees for event ${eventId}:`, error);
      throw error;
    }
  }

  getCalendarFeedUrl() {
    return `${API_BASE_URL}/calendar/feed.ics`;
  }

  // Helper method to get RSVP options
  getRSVPOptions() {
    // Only return values that exist in the database
    return [
      { value: 'registered', label: 'Going', icon: '📝' },
      { value: 'confirmed', label: 'Confirmed', icon: '✅' },
      { value: 'cancelled', label: 'Not Going', icon: '🚫' }
    ];
  }
  
  // Update formatStatus to handle only existing values
  formatStatus(status) {
    const statusMap = {
      'registered': { label: 'Going', color: '#2196F3', icon: '📝' },
      'confirmed': { label: 'Confirmed', color: '#4CAF50', icon: '✅' },
      'cancelled': { label: 'Not Going', color: '#F44336', icon: '🚫' }
    };
    
    return statusMap[status] || { label: status, color: '#757575', icon: '❓' };
  }

  async getOrganizerAnalytics() {
    try {
      const response = await axios.get(`${this.baseUrl}/analytics/organizer`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer analytics:', error);
      throw error;
    }
  }

  async getEventAnalytics(eventId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event analytics for ${eventId}:`, error);
      throw error;
    }
  }

  async exportEventData(eventId, format) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/export/${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting event data for ${eventId}:`, error);
      throw error;
    }
  }

  async downloadEventIcal(eventId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/ical`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading iCal for event ${eventId}:`, error);
      throw error;
    }
  }
}

const eventService = new EventService();
export default eventService;
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class EventService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/events`;
  }

  async getEvents(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      
      const url = `${this.baseUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEvent(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
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

  async updateEvent(id, eventData) {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      await axios.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
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

  async getEventParticipants(eventId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${eventId}/participants`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching participants for event ${eventId}:`, error);
      throw error;
    }
  }

  getCalendarFeedUrl() {
    return `${API_BASE_URL}/calendar/feed.ics`;
  }
}

export default new EventService();
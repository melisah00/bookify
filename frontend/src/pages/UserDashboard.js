import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Event as EventIcon, 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/eventService';
import './UserDashboard.css';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-dashboard-tabpanel-${index}`}
      aria-labelledby={`user-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [myEvents, setMyEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, registrationsResponse] = await Promise.all([
        eventService.getMyEvents(),
        eventService.getMyRegistrations()
      ]);
      
      setMyEvents(eventsResponse);
      setMyRegistrations(registrationsResponse);
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/app/events/${eventId}/edit`);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/app/events/${eventId}`);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await eventService.deleteEvent(eventToDelete.id);
      setMyEvents(myEvents.filter(event => event.id !== eventToDelete.id));
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      setSnackbar({
        open: true,
        message: 'Event deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete event. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDownloadCalendar = async (type) => {
    try {
      const response = await fetch(`http://localhost:8000/events/calendar/${type}.ics`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type.replace('-', '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSnackbar({
          open: true,
          message: 'Calendar downloaded successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error downloading calendar:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download calendar',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'registered': 'primary',
      'confirmed': 'success',
      'cancelled': 'error',
      'interested': 'warning'
    };
    return colors[status] || 'default';
  };

  const isEventPast = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const EventCard = ({ event, showActions = false, showRSVPStatus = false }) => {
    const isPast = isEventPast(event.end_date);
    
    return (
      <Card className="event-card" sx={{ mb: 2, opacity: isPast ? 0.7 : 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" component="h3">
                  {event.title}
                </Typography>
                {isPast && (
                  <Chip label="Past Event" size="small" color="default" />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(event.start_date)}
                </Typography>
              </Box>
              
              {event.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                {event.description && event.description.length > 100 
                  ? `${event.description.substring(0, 100)}...`
                  : event.description
                }
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                {event.tags && event.tags.map((tag) => (
                  <Chip 
                    key={tag.id} 
                    label={tag.name} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    {event.participant_count} participant{event.participant_count !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                {event.guest_limit && (
                  <Typography variant="body2" color="text.secondary">
                    Limit: {event.guest_limit}
                  </Typography>
                )}
                
                <Chip 
                  label={event.format || 'in-person'} 
                  size="small" 
                  variant="outlined"
                  color="primary"
                />
              </Box>
              
              {showRSVPStatus && event.rsvp_status && (
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Status: ${event.rsvp_status}`}
                    color={getStatusColor(event.rsvp_status)}
                    size="small"
                  />
                </Box>
              )}
            </Box>
            
            {showActions && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                <IconButton 
                  onClick={() => handleEditEvent(event.id)}
                  color="primary"
                  size="small"
                  title="Edit Event"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  onClick={() => {
                    setEventToDelete(event);
                    setDeleteDialogOpen(true);
                  }}
                  color="error"
                  size="small"
                  title="Delete Event"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => handleViewEvent(event.id)}
            >
              View Details
            </Button>
            
            {showActions && (
              <>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate(`/app/events/${event.id}/attendees`)}
                >
                  Manage Attendees
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<GetAppIcon />}
                  onClick={() => window.open(`http://localhost:8000/events/${event.id}/ical`)}
                >
                  Download iCal
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Events Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate('/app/events/analytics')}
            sx={{ bgcolor: '#4e796b', '&:hover': { bgcolor: '#66b2a0' } }}
          >
            View Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleDownloadCalendar('my-events')}
          >
            Download My Calendar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/app/events/create')}
            sx={{ bgcolor: '#66b2a0', '&:hover': { bgcolor: '#4e796b' } }}
          >
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f8f6f1' }}>
            <CardContent>
              <EventIcon sx={{ fontSize: 40, color: '#66b2a0', mb: 1 }} />
              <Typography variant="h4" component="div">
                {myEvents.length}
              </Typography>
              <Typography color="text.secondary">
                Events Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f8f6f1' }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: '#4e796b', mb: 1 }} />
              <Typography variant="h4" component="div">
                {myEvents.reduce((total, event) => total + (event.participant_count || 0), 0)}
              </Typography>
              <Typography color="text.secondary">
                Total Participants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f8f6f1' }}>
            <CardContent>
              <CalendarIcon sx={{ fontSize: 40, color: '#a7d7b8', mb: 1 }} />
              <Typography variant="h4" component="div">
                {myRegistrations.length}
              </Typography>
              <Typography color="text.secondary">
                Events Registered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f8f6f1' }}>
            <CardContent>
              <ScheduleIcon sx={{ fontSize: 40, color: '#e1eae5', mb: 1 }} />
              <Typography variant="h4" component="div">
                {myEvents.filter(event => new Date(event.start_date) > new Date()).length}
              </Typography>
              <Typography color="text.secondary">
                Upcoming Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user dashboard tabs">
          <Tab 
            icon={<EventIcon />} 
            label={`My Events (${myEvents.length})`} 
            id="user-dashboard-tab-0"
            aria-controls="user-dashboard-tabpanel-0"
          />
          <Tab 
            icon={<PeopleIcon />} 
            label={`My Registrations (${myRegistrations.length})`}
            id="user-dashboard-tab-1"
            aria-controls="user-dashboard-tabpanel-1"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Events I Organize
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/app/events/create')}
            sx={{ bgcolor: '#66b2a0', '&:hover': { bgcolor: '#4e796b' } }}
          >
            Create New Event
          </Button>
        </Box>
        
        {myEvents.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Events Created Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by creating your first event to connect with your community.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/app/events/create')}
                sx={{ bgcolor: '#66b2a0', '&:hover': { bgcolor: '#4e796b' } }}
              >
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {myEvents.map((event) => (
              <Grid item xs={12} key={event.id}>
                <EventCard event={event} showActions={true} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Events I'm Attending
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleDownloadCalendar('my-registrations')}
          >
            Download Calendar
          </Button>
        </Box>
        
        {myRegistrations.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Event Registrations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Browse available events and register for ones that interest you.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/app/events')}
                sx={{ bgcolor: '#66b2a0', '&:hover': { bgcolor: '#4e796b' } }}
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {myRegistrations.map((event) => (
              <Grid item xs={12} key={event.id}>
                <EventCard event={event} showRSVPStatus={true} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Event Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{eventToDelete?.title}"? 
            This action cannot be undone and all participants will be notified.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteEvent} color="error" variant="contained">
            Delete Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserDashboard;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import eventService from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import ReaderSidebar from '../../components/sidebars/ReaderSidebar';
import AuthorSidebar from '../../components/sidebars/AuthorSidebar';
import AdminSidebar from '../../components/sidebars/AdminSidebar';
import Footer from '../../components/Footer';
import { Toolbar } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

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

const EventSpecificAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Sidebar = getSidebar(user);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Fetch event details, analytics, and attendees in parallel
      const [eventData, analyticsData, attendeesData] = await Promise.all([
        eventService.getEventById(id),
        eventService.getEventAnalytics(id),
        eventService.getEventAttendees(id, null, user.id)
      ]);

      // Check if user is organizer
      if (eventData.organizer_id !== user.id) {
        setError('You are not authorized to view analytics for this event.');
        return;
      }

      setEvent(eventData);
      setAnalytics(analyticsData);
      setAttendees(attendeesData);
    } catch (error) {
      console.error('Error fetching event analytics:', error);
      setError('Failed to load event analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format) => {
    try {
      await eventService.exportEventData(id, format);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleDownloadIcal = async () => {
    try {
      await eventService.downloadEventIcal(id);
    } catch (error) {
      console.error('Error downloading calendar:', error);
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
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Container>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Container maxWidth="lg">
              <Typography variant="h6" color="error" sx={{ textAlign: 'center', mt: 4 }}>
                {error}
              </Typography>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(-1)}
                  variant="outlined"
                >
                  Go Back
                </Button>
              </Box>
            </Container>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  // Chart data
  const rsvpStatusData = {
    labels: analytics?.rsvp_breakdown?.map(item => item.status) || [],
    datasets: [
      {
        data: analytics?.rsvp_breakdown?.map(item => item.count) || [],
        backgroundColor: [
          '#66b2a0', // Going
          '#4e796b', // Confirmed 
          '#f44336', // Not Going
          '#ff9800', // Maybe
          '#9e9e9e'  // No Response
        ],
        borderWidth: 1
      }
    ]
  };

  const registrationTrendData = {
    labels: analytics?.registration_timeline?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Daily Registrations',
        data: analytics?.registration_timeline?.map(item => item.count) || [],
        backgroundColor: '#66b2a0',
        borderColor: '#4e796b',
        borderWidth: 1
      }
    ]
  };

  const formatStatus = (status) => eventService.formatStatus(status);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
      {Sidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/app/events/${id}`)}
                sx={{ mb: 2 }}
              >
                Back to Event
              </Button>
              
              <Typography variant="h4" component="h1" gutterBottom>
                Event Analytics
              </Typography>
              
              {event && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {event.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip
                      icon={<EventIcon />}
                      label={new Date(event.start_date).toLocaleDateString()}
                      variant="outlined"
                    />
                    <Chip
                      icon={<LocationIcon />}
                      label={event.location || 'Virtual'}
                      variant="outlined"
                    />
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${analytics?.total_participants || 0} Participants`}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Summary Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Total Registrations
                        </Typography>
                        <Typography variant="h4">
                          {analytics?.total_participants || 0}
                        </Typography>
                      </Box>
                      <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Confirmed Attendees
                        </Typography>
                        <Typography variant="h4">
                          {analytics?.confirmed_count || 0}
                        </Typography>
                      </Box>
                      <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Response Rate
                        </Typography>
                        <Typography variant="h4">
                          {analytics?.response_rate ? `${analytics.response_rate}%` : '0%'}
                        </Typography>
                      </Box>
                      <ScheduleIcon color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Guest Limit
                        </Typography>
                        <Typography variant="h4">
                          {event?.guest_limit || 'Unlimited'}
                        </Typography>
                      </Box>
                      <EventIcon color="secondary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      RSVP Status Breakdown
                    </Typography>
                    {analytics?.rsvp_breakdown?.length > 0 ? (
                      <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                        <Pie 
                          data={rsvpStatusData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom'
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No RSVP data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Registration Timeline
                    </Typography>
                    {analytics?.registration_timeline?.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <Bar 
                          data={registrationTrendData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No registration timeline data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Export Actions */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Options
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportData('csv')}
                    variant="outlined"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportData('xlsx')}
                    variant="outlined"
                  >
                    Export as Excel
                  </Button>
                  <Button
                    startIcon={<EventIcon />}
                    onClick={handleDownloadIcal}
                    variant="outlined"
                  >
                    Download Calendar
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Attendees List */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Attendees
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Registration Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendees.length > 0 ? (
                        attendees.map((attendee) => {
                          const statusInfo = formatStatus(attendee.status);
                          return (
                            <TableRow key={attendee.id}>
                              <TableCell>
                                {attendee.first_name} {attendee.last_name}
                              </TableCell>
                              <TableCell>{attendee.email}</TableCell>
                              <TableCell>
                                <Chip
                                  label={statusInfo.label}
                                  size="small"
                                  style={{
                                    backgroundColor: statusInfo.color,
                                    color: 'white'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(attendee.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="Send Email">
                                  <IconButton size="small">
                                    <EmailIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No attendees registered yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Container>
        </Box>
        <Footer />
      </div>
    </div>
  );
};

export default EventSpecificAnalytics;
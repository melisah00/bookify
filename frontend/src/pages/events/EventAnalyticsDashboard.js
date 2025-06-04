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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Toolbar
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  FileDownload as FileDownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import eventService from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import ReaderSidebar from '../../components/sidebars/ReaderSidebar';
import AuthorSidebar from '../../components/sidebars/AuthorSidebar';
import AdminSidebar from '../../components/sidebars/AdminSidebar';
import Footer from '../../components/Footer';
import './EventAnalyticsDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
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

const EventAnalyticsDashboard = () => {
  const { id: eventId } = useParams(); // Get event ID from URL if it exists
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const Sidebar = getSidebar(user);

  // Determine if this is event-specific or general analytics
  const isEventSpecific = Boolean(eventId);

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      if (isEventSpecific) {
        // Fetch event-specific analytics
        const data = await eventService.getEventAnalytics(eventId);
        setAnalytics(data);
        setEventInfo(data.event_info);
      } else {
        // Fetch general organizer analytics
        const data = await eventService.getOrganizerAnalytics();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
        a.download = `${type}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading calendar:', error);
    }
  };

  const handleExportEvent = async (eventId, format) => {
    try {
      const response = await fetch(`http://localhost:8000/events/${eventId}/export/${format}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_${eventId}_data.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting event data:', error);
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

  if (!analytics) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
        {Sidebar && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Header />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Container maxWidth="lg">
              <Typography>No analytics data available.</Typography>
            </Container>
          </Box>
          <Footer />
        </div>
      </div>
    );
  }

  // Chart data for event-specific analytics
  const getEventSpecificCharts = () => {
    if (!isEventSpecific) return null;

    const statusChartData = {
      labels: analytics.status_breakdown?.map(item => item.status) || [],
      datasets: [
        {
          data: analytics.status_breakdown?.map(item => item.count) || [],
          backgroundColor: [
            '#66b2a0',
            '#4e796b',
            '#a7d7b8',
            '#f44336',
            '#ff9800'
          ],
          borderWidth: 1
        }
      ]
    };

    const timelineChartData = {
      labels: analytics.registration_timeline?.map(item => item.date) || [],
      datasets: [
        {
          label: 'Daily Registrations',
          data: analytics.registration_timeline?.map(item => item.registrations) || [],
          backgroundColor: '#66b2a0',
          borderColor: '#4e796b',
          borderWidth: 1
        }
      ]
    };

    return { statusChartData, timelineChartData };
  };

  // Chart data for general organizer analytics
  const getGeneralCharts = () => {
    if (isEventSpecific) return null;

    const participationChartData = {
      labels: analytics.participation_stats?.map(stat => stat.status) || [],
      datasets: [
        {
          label: 'Participants by Status',
          data: analytics.participation_stats?.map(stat => stat.count) || [],
          backgroundColor: [
            '#66b2a0',
            '#4e796b',
            '#a7d7b8',
            '#e1eae5',
            '#f8f6f1'
          ]
        }
      ]
    };

    const monthlyTrendData = {
      labels: analytics.monthly_trends?.map(trend => trend.month) || [],
      datasets: [
        {
          label: 'Events',
          data: analytics.monthly_trends?.map(trend => trend.events) || [],
          borderColor: '#66b2a0',
          backgroundColor: 'rgba(102, 178, 160, 0.1)',
          yAxisID: 'y'
        },
        {
          label: 'Participants',
          data: analytics.monthly_trends?.map(trend => trend.participants) || [],
          borderColor: '#4e796b',
          backgroundColor: 'rgba(78, 121, 107, 0.1)',
          yAxisID: 'y1'
        }
      ]
    };

    return { participationChartData, monthlyTrendData };
  };

  const eventCharts = getEventSpecificCharts();
  const generalCharts = getGeneralCharts();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: isEventSpecific ? {} : {
      y: {
        type: 'linear',
        display: true,
        position: 'left'
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--spring-wood)' }}>
      {Sidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isEventSpecific && (
                  <IconButton 
                    onClick={() => navigate(`/app/events/${eventId}`)}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                )}
                <Box>
                  <Typography variant="h4" component="h1">
                    {isEventSpecific ? 'Event Analytics' : 'Analytics Dashboard'}
                  </Typography>
                  {isEventSpecific && eventInfo && (
                    <Typography variant="h6" color="text.secondary">
                      {eventInfo.title}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isEventSpecific ? (
                  // Event-specific export buttons
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={() => handleExportEvent(eventId, 'csv')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={() => handleExportEvent(eventId, 'json')}
                    >
                      Export JSON
                    </Button>
                  </>
                ) : (
                  // General analytics buttons
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CalendarIcon />}
                      onClick={() => handleDownloadCalendar('my-events')}
                    >
                      Download My Events Calendar
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CalendarIcon />}
                      onClick={() => handleDownloadCalendar('my-registrations')}
                    >
                      Download Registered Events
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {isEventSpecific ? (
                // Event-specific summary cards
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PeopleIcon sx={{ fontSize: 40, color: '#66b2a0', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {eventInfo?.total_participants || 0}
                            </Typography>
                            <Typography color="text.secondary">
                              Total Participants
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ fontSize: 40, color: '#4e796b', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {eventInfo?.capacity_percentage ? `${Math.round(eventInfo.capacity_percentage)}%` : 'N/A'}
                            </Typography>
                            <Typography color="text.secondary">
                              Capacity Filled
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EventIcon sx={{ fontSize: 40, color: '#a7d7b8', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {eventInfo?.guest_limit || 'Unlimited'}
                            </Typography>
                            <Typography color="text.secondary">
                              Guest Limit
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AnalyticsIcon sx={{ fontSize: 40, color: '#e1eae5', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {analytics.registration_timeline?.length || 0}
                            </Typography>
                            <Typography color="text.secondary">
                              Registration Days
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                // General analytics summary cards
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card className="analytics-card">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EventIcon sx={{ fontSize: 40, color: '#66b2a0', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {analytics.summary?.total_events || 0}
                            </Typography>
                            <Typography color="text.secondary">
                              Total Events
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card className="analytics-card">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PeopleIcon sx={{ fontSize: 40, color: '#4e796b', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {analytics.summary?.total_participants || 0}
                            </Typography>
                            <Typography color="text.secondary">
                              Total Participants
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card className="analytics-card">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ fontSize: 40, color: '#a7d7b8', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {analytics.summary?.upcoming_events || 0}
                            </Typography>
                            <Typography color="text.secondary">
                              Upcoming Events
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card className="analytics-card">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AnalyticsIcon sx={{ fontSize: 40, color: '#e1eae5', mr: 2 }} />
                          <Box>
                            <Typography variant="h4" component="div">
                              {Math.round(analytics.summary?.average_participants_per_event || 0)}
                            </Typography>
                            <Typography color="text.secondary">
                              Avg Participants
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {isEventSpecific && eventCharts ? (
                // Event-specific charts
                <>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Registration Status Breakdown
                        </Typography>
                        {analytics.status_breakdown?.length > 0 ? (
                          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                            <Pie data={eventCharts.statusChartData} options={chartOptions} />
                          </Box>
                        ) : (
                          <Typography color="text.secondary">No registration data available</Typography>
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
                        {analytics.registration_timeline?.length > 0 ? (
                          <Box sx={{ height: 300 }}>
                            <Bar data={eventCharts.timelineChartData} options={chartOptions} />
                          </Box>
                        ) : (
                          <Typography color="text.secondary">No timeline data available</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                generalCharts && (
                  // General analytics charts
                  <>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Participation Statistics
                          </Typography>
                          {analytics.participation_stats?.length > 0 ? (
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                              <Pie data={generalCharts.participationChartData} options={chartOptions} />
                            </Box>
                          ) : (
                            <Typography color="text.secondary">No participation data available</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Monthly Trends
                          </Typography>
                          {analytics.monthly_trends?.length > 0 ? (
                            <Box sx={{ height: 300 }}>
                              <Line data={generalCharts.monthlyTrendData} options={chartOptions} />
                            </Box>
                          ) : (
                            <Typography color="text.secondary">No trend data available</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )
              )}
            </Grid>

            {/* Additional event-specific data */}
            {isEventSpecific && analytics.demographics && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Participant Demographics
                  </Typography>
                  <Typography>Total Participants: {analytics.demographics.total_participants}</Typography>
                  {/* Add more demographic data as needed */}
                </CardContent>
              </Card>
            )}
          </Container>
        </Box>
        <Footer />
      </div>
    </div>
  );
};

export default EventAnalyticsDashboard;
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stack,
  Paper,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import {
  LibraryBooksOutlined,
  PeopleOutline,
  StarOutline,
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ChatBot from "../components/ChatBot";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#66B2A0", contrastText: "#F8F6F1" },
    secondary: { main: "#BDE0C3", contrastText: "#2F3E46" },
    background: { default: "#FAF9F4", paper: "#E2E8E2" },
    text: { primary: "#2F3E46", secondary: "#52796F" },
  },
});

const features = [
  { icon: <LibraryBooksOutlined fontSize="large" color="primary" />, title: 'Vast Collection', desc: 'Search books across various genres.' },
  { icon: <PeopleOutline fontSize="large" color="primary" />, title: 'Community', desc: 'Connect with fellow book lovers and share recommendations.' },
  { icon: <StarOutline fontSize="large" color="primary" />, title: 'Ratings & Reviews', desc: 'Leave your feedback and read others’ experiences.' },
];

const steps = [
  { step: 'Search', desc: 'Find the books you love.' },
  { step: 'Add', desc: 'Add your own books to your collection.' },
  { step: 'Review', desc: 'Write and read reviews.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', color: 'primary.contrastText' }}>
            <Box component="img" src="/Book.png" alt="Bookify Logo" sx={{ width: 40, height: 40, mr: 1 }} />
            BOOKIFY
          </Typography>
          <Box>
            <Button variant="outlined" color="inherit" sx={{ mr: 2 }} onClick={() => navigate("/login")}>Login</Button>
            <Button variant="contained" color="secondary" onClick={() => navigate("/register")}>Sign Up</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: { xs: 8, md: 10 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center" justifyContent="center">
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Bookify – Your Digital Library
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Find, share, and rate books with a community of fellow book lovers.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button variant="contained" color="primary" sx={{ px: 4, py: 1.5, fontSize: '1rem' }} onClick={() => navigate("/login")}>Get Started</Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, mx: 'auto', textAlign: 'center' }}>
            <Box
              component="img"
              src="/Book.png"
              alt="Reading"
              sx={{
                width: { xs: '100%', md: 500 },
                height: { xs: 300, md: 400 },
                objectFit: 'cover',
                clipPath: 'inset(5% 5% 5% 5%)',
                borderRadius: 3,
              }}
            />
            <Typography variant="h6" color="text.primary" sx={{ mt: 2, fontWeight: 'medium' }}>
              Discover • Read • Grow
            </Typography>
          </Box>
        </Stack>
      </Container>

      <Box component="section" sx={{ py: { xs: 6, md: 8 }, px: 2, backgroundColor: '#eef7f5' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
          Why Bookify?
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
          {features.map((item, idx) => (
            <Paper
              key={idx}
              elevation={2}
              sx={{
                flex: 1,
                maxWidth: 280,
                mx: 'auto',
                textAlign: 'center',
                p: 4,
                borderRadius: 3,
                '&:hover': { boxShadow: 6 },
              }}
            >
              <Box sx={{ mb: 2 }}>{item.icon}</Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {item.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box component="section" sx={{ py: { xs: 6, md: 8 }, px: 2 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          How It Works?
        </Typography>
        <Stack
          direction="column"
          spacing={4}
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          {steps.map((item, idx) => (
            <Stack
              key={item.step}
              direction={{ xs: 'column', md: idx % 2 === 0 ? 'row' : 'row-reverse' }}
              spacing={2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {idx + 1}
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {item.step}
                </Typography>
                <Typography color="text.secondary">
                  {item.desc}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Footer />
      
      {/* ChatBot Component */}
      <ChatBot />
    </ThemeProvider>
  );
}
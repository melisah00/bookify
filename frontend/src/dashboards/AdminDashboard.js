import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AdminSidebar from '../components/sidebars/AdminSidebar';
import { Box, Toolbar } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import Profile from '../components/Profile';
import Footer from '../components/Footer';
import AdminHomePage from '../pages/AdminHomePage';
import ProtectedLayout from '../ProtectedLayout';


export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Toolbar />
      <Box>
        <Box sx={{ display: 'flex', flexGrow: 1, minHeight: '100vh' }}>
          <AdminSidebar open={open} onToggle={() => setOpen(o => !o)} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                // overflowY: 'auto',
                width: '100%',
                height: '100%',
                px: 0,
                py: 0,
              }}
            >
              <Routes element={<ProtectedLayout />}>
                <Route index element={<AdminHomePage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>

            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

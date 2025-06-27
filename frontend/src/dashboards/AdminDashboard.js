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
import ForumAdmin from '../components/forum/ForumAdmin';
import TopicDetail from '../components/forum/TopicDetail';

import AdminUserManagementPage from "../pages/AdminUserManagementPage";
import AdminAnalyticsPage from "../pages/AdminAnalyticsPage";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Toolbar />
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <AdminSidebar open={open} onToggle={() => setOpen((o) => !o)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 0
            }}
          >
            <Routes element={<ProtectedLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="" replace />} />

              <Route path="forum" element={<ForumAdmin />} />
              <Route path="forums/topics/:topicId" element={<TopicDetail />} />
              <Route path="*" element={<Navigate to="" replace />} />

              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />

            </Routes>
          </Box>
          <Footer sx={{ mt: 'auto' }} />
        </Box>
      </Box>
    </Box>
  );
}
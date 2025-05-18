import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AuthorSidebar from '../components/sidebars/AuthorSidebar';
import { Box, Toolbar } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import BookListPage from '../components/BookListPage';
import BookDetailPage from '../components/BookDetailPage';
import AuthorHomePage from '../pages/AuthorHomePage';
import Profile from '../components/Profile';

export default function AuthorDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      <Header />
      <Toolbar />


      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

        <AuthorSidebar open={open} onToggle={() => setOpen(o => !o)} />


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
              overflowY: 'auto',
              width: '100%',
              height: '100%',
              px: 0,
              py: 0,
            }}
          >
            <Routes>
              <Route index element={<AuthorHomePage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="books" element={<BookListPage />} />
              <Route path="books/:bookId" element={<BookDetailPage />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}

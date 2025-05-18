import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ReaderSidebar from '../components/sidebars/ReaderSidebar';
import { Box, Toolbar } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import BookListPage from '../components/BookListPage';
import SingleBookDisplayPage from '../components/SingleBookDisplayPage';
import ReaderHomePage from '../pages/ReaderHomePage';
import Profile from '../components/Profile';
import SubmitReviewPage from '../pages/SubmitReviewPage';


export default function ReaderDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      <Header />
      <Toolbar />


      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

        <ReaderSidebar open={open} onToggle={() => setOpen(o => !o)} />


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
              <Route path="/" element={<ReaderHomePage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="books" element={<BookListPage />} />
              <Route path="books/:bookId" element={<SingleBookDisplayPage />} />
              <Route
                path="books/:bookId/submit-review"
                element={<SubmitReviewPage />}
              />
              <Route path="*" element={<Navigate to="books" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

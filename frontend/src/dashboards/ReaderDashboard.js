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
import Footer from '../components/Footer';
import ProtectedLayout from '../ProtectedLayout';
import FavouriteBooksPage from '../components/FavouriteBooksPage'
import UserProfile from '../components/UserProfile'
import StudentCornerChat from '../components/StudentCornerChat';
import StudentCornerScripts from '../components/StudentCornerScripts';
import EditScriptPage from '../components/EditScriptPage'
import PrivateChat from "../components/PrivateChat"

export default function ReaderDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Toolbar />
      <Box display="flex"
        flexDirection="column"
        minHeight="100vh">
        <Box sx={{ display: 'flex', flexGrow: 1 }}>

          <ReaderSidebar open={open} onToggle={() => setOpen(o => !o)} />
          <Box
            component="main"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#f8f9fa',
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
              <Routes element={<ProtectedLayout />}>
                <Route path="/" element={<ReaderHomePage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="books" element={<BookListPage />} />
                <Route path="books/:bookId" element={<SingleBookDisplayPage />} />
                <Route
                  path="books/:bookId/submit-review"
                  element={<SubmitReviewPage />}
                />
                <Route path="*" element={<Navigate to="books" replace />} />
                <Route path="favourites" element={<FavouriteBooksPage />} />
                <Route path="/user/:id" element={<UserProfile />} />

                <Route path="student-corner" element={<StudentCornerChat username={user.username} />} />
                <Route path="student-corner/scripts" element={<StudentCornerScripts />} /> 
                <Route path="/student-corner/scripts/edit/:id" element={<EditScriptPage />} />
                <Route
                  path="/chat/private/:receiverId"
                  element={<PrivateChat senderId={user.id} currentUsername={user.username} />}
                />
              </Routes>
            </Box>
          </Box>
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

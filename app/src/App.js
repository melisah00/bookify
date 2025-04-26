import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ReaderDashboard from './pages/dashboards/ReaderDashboard';  
import AuthorDashboard from './pages/dashboards/Author';
import ForumAdminDashboard from './pages/dashboards/ForumAdmin';  
import ForumModeratorDashboard from './pages/dashboards/ForumModerator';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
import NotAuthorized from './components/NotAuthorized';

function App() {
  return (
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reader"
        element={
          <ProtectedRoute allowedRoles={['reader']}>
            <ReaderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author"
        element={
          <ProtectedRoute allowedRoles={['author']}>
            <AuthorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forum-admin"
        element={
          <ProtectedRoute allowedRoles={['forum_admin']}>
            <ForumAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forum-moderator"
        element={
          <ProtectedRoute allowedRoles={['forum_moderator']}>
            <ForumModeratorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<NotAuthorized />} />

      </Routes>
  );
}

export default App;

import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedLayout from "./ProtectedLayout";
import DashboardSwitcher from "./components/DashboardSwitcher";
import AuthorDashboard from "./dashboards/AuthorDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import ReaderDashboard from "./dashboards/ReaderDashboard";
import LandingPage from "./pages/LandingPage";
import EventsPage from "./pages/events/EventsPage";
import CreateEventPage from "./pages/events/CreateEventPage";
import EditEventPage from "./pages/events/EditEventPage";
import EventDetailsPage from "./pages/events/EventDetailsPage.js";
import UserDashboard from "./pages/UserDashboard";
import EventAnalyticsDashboard from "./pages/events/EventAnalyticsDashboard";
import OrganizerPanel from "./pages/events/OrganizerPanel";
import ForumCategoryList from "./components/forum/ForumCategoryList.js"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<DashboardSwitcher />} />
        <Route path="/app/events" element={<EventsPage />} />
        <Route path="/app/events/create" element={<CreateEventPage />} /> 
        <Route path="/app/events/:id" element={<EventDetailsPage />} />
        <Route path="/app/events/:id/edit" element={<EditEventPage />} /> 
        <Route path="/app/events/:id/organizer" element={<OrganizerPanel />} />
        <Route path="/app/events/:id/analytics" element={<EventAnalyticsDashboard />} />
        <Route path="/app/my-events" element={<UserDashboard />} />
        <Route path="/app/events/analytics" element={<EventAnalyticsDashboard />} />
        <Route path="/app/admin/*" element={<AdminDashboard />} />
        <Route path="/app/author/*" element={<AuthorDashboard />} />
        <Route path="/app/reader/*" element={<ReaderDashboard />} />

        {/* <Route path="/app/forums" element={<ForumCategoryList/>}/> */}
      </Route>

      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}
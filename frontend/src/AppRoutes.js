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
import EventDetailsPage from "./pages/events/EventDetailsPage.js"; // Add this import

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
        <Route path="/app/admin/*" element={<AdminDashboard />} />
        <Route path="/app/author/*" element={<AuthorDashboard />} />
        <Route path="/app/reader/*" element={<ReaderDashboard />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}
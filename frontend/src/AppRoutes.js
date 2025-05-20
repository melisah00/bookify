import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import BookListPage from "./components/BookListPage";
import BookDetailPage from "./components/BookDetailPage";
import ProtectedLayout from "./ProtectedLayout";
import MainAppLayout from "./MainAppLayout";
import DashboardSwitcher from "./components/DashboardSwitcher";
import AuthorDashboard from "./dashboards/AuthorDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import ReaderDashboard from "./dashboards/ReaderDashboard";
import LandingPage from "./pages/LandingPage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<DashboardSwitcher />} />

        <Route path="/app/admin/*" element={<AdminDashboard />} />
        <Route path="/app/author/*" element={<AuthorDashboard />} />
        <Route path="/app/reader/*" element={<ReaderDashboard />} />
      </Route>
      
      {/* <Route path="/app/books" element={<BookListPage />} />
      <Route path="/app/books/:bookId" element={<SingleBookDisplayPage />} /> {/* Nova ruta */}

      {/* <Route path="/app/books/:bookId/submit-review" element={<SubmitReviewPage />} /> */} 


      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}

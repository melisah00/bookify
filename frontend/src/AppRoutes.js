import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import BookListPage from "./components/BookListPage";
import BookDetailPage from "./components/BookDetailPage";
import ProtectedLayout from "./ProtectedLayout";
import MainAppLayout from "./MainAppLayout";
import SingleBookDisplayPage from './components/SingleBookDisplayPage';
import SubmitReviewPage from './pages/SubmitReviewPage'; 

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected layout with internal routing */}
      <Route element={<ProtectedLayout />}>
        <Route path="/app/*" element={<MainAppLayout />} />
      </Route>
      
      <Route path="/app/books" element={<BookListPage />} />
      <Route path="/app/books/:bookId" element={<SingleBookDisplayPage />} /> {/* Nova ruta */}

      <Route path="/app/books/:bookId/submit-review" element={<SubmitReviewPage />} />

      {/* Default route */}
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

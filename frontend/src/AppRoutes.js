import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import BookListPage from "./components/BookListPage";
import BookDetailPage from "./components/BookDetailPage";
import ProtectedLayout from "./ProtectedLayout";
import MainAppLayout from "./MainAppLayout";

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

      {/* Default route */}
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

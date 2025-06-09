import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import AuthorSidebar from "../components/sidebars/AuthorSidebar";
import { Box, Toolbar } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";

import BookListPage from "../components/BookListPage";
import AuthorHomePage from "../pages/AuthorHomePage";
import Profile from "../components/Profile";
import SingleBookDisplayPage from "../components/SingleBookDisplayPage";
import SubmitReviewPage from "../pages/SubmitReviewPage";
import BookUploadForm from "../components/BookUploadForm";
import Footer from "../components/Footer";
import ProtectedLayout from "../ProtectedLayout";
import FavouriteBooksPage from "../components/FavouriteBooksPage";
import UserProfile from "../components/UserProfile";
import MyBooksPage from "../components/MyBooksPage";
import AuthorAnalyticsPage from "../components/AuthorAnalyticsPage";
import TopPerformingBooksPage from "../pages/TopPerformingBooksPage";
import ForumCategoryList from '../components/forum/ForumCategoryList';
import TopicDetail from '../components/forum/TopicDetail';


export default function AuthorDashboard() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />
      <Toolbar />

      <Box>
        <Box sx={{ display: "flex", flexGrow: 1, minHeight: "100vh" }}>
          <AuthorSidebar open={open} onToggle={() => setOpen((o) => !o)} />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,

                width: "100%",
                height: "100%",
                px: 0,
                py: 0,
              }}
            >
              <Routes element={<ProtectedLayout />}>
                <Route index element={<AuthorHomePage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="books" element={<BookListPage />} />
                <Route
                  path="books/:bookId"
                  element={<SingleBookDisplayPage />}
                />
                <Route
                  path="books/:bookId/submit-review"
                  element={<SubmitReviewPage />}
                />
                <Route path="upload" element={<BookUploadForm />} />
                <Route path="favourites" element={<FavouriteBooksPage />} />
                <Route path="/user/:id" element={<UserProfile />} />

                {/* <Route path="*" element={<Navigate to="" replace />} /> */}

                <Route path="my-books" element={<MyBooksPage />} />
                <Route path="analytics" element={<AuthorAnalyticsPage />} />
                <Route
                  path="analytics/top-books"
                  element={<TopPerformingBooksPage />}
                />

                <Route path="forums" element={<ForumCategoryList />} />
                <Route path="forums/topics/:topicId" element={<TopicDetail />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

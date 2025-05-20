"use client";
import React from "react";
import { Routes, Route, Link, Outlet } from "react-router-dom"; 
import BookListPage from "./components/BookListPage";
import BookDetailPage from "./components/BookDetailPage";
import LogoutButton from "./components/LogoutButton";
import BookUploadForm from "./components/BookUploadForm"; 
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

export default function MainAppLayout() {
  const { user } = useAuth(); 

  console.log("MainAppLayout RENDER - User object:", user);

  const isUserDefinitelyAuthor = 
    user && 
    user.roles && 
    Array.isArray(user.roles) && 
    user.roles.includes('author');

  console.log("MainAppLayout RENDER - Is user author (simplified check)?", isUserDefinitelyAuthor);

  const styles = {
    navbar: {
      display: "flex",
      justifyContent: "space-between", 
      alignItems: "center",
      padding: "15px 30px",
      backgroundColor: "#66b2a0", 
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    navLinksContainer: { 
      display: "flex",
      justifyContent: "center",
      flexGrow: 1, 
    },
    navLinks: {
      display: "flex",
      gap: "30px",
    },
    navLink: {
      color: "white", 
      textDecoration: "none",
      fontSize: "1.1rem",
      fontWeight: "bold",
      borderBottom: "2px solid transparent",
      paddingBottom: "2px",
      transition: "border-bottom 0.2s",
    },
    navActions: { 
      display: "flex",
      alignItems: "center",
      minWidth: "120px", 
      justifyContent: "flex-end",
    },
    placeholderLeft: { 
        minWidth: "120px", 
    },
    pageContent: { 
        padding: "20px",
    }
  };

  return (
    <div className="App">
      <nav style={styles.navbar}>
        <div style={styles.placeholderLeft} /> 
        
        <div style={styles.navLinksContainer}>
          <div style={styles.navLinks}>
            <Link 
              to="/app" 
              style={styles.navLink}
              onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              Home
            </Link>
            <Link 
              to="/app/books" 
              style={styles.navLink}
              onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              All Books
            </Link>
            {/* Uslovno prikazivanje linka za upload knjige */}
            {isUserDefinitelyAuthor && (
              <Link 
                to="/app/upload" 
                style={styles.navLink}
                onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
                onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
              >
                Upload Knjige {/* Tekst linka */}
              </Link>
            )}
          </div>
        </div>

        <div style={styles.navActions}> 
          <LogoutButton />
        </div>
      </nav>

      <div style={styles.pageContent}>
        <Routes>
          <Route
            index
            element={
              <div> 
                <h1>Welcome to Bookify</h1>
                <p>Browse books and leave a review.</p>
                <Link to="/app/books">Browse Books</Link>
              </div>
            }
          />
          <Route path="books" element={<BookListPage />} />
          <Route path="books/:bookId" element={<BookDetailPage />} />
          {/* Nova ruta za upload formu */}
          {isUserDefinitelyAuthor && <Route path="upload" element={<BookUploadForm />} />}
        </Routes>
      </div>

      {/* Outlet je sada ispravno importovan */}
      <Outlet /> 
    </div>
  );
}

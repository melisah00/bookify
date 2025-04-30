import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import BookListPage from "./components/BookListPage";
import BookDetailPage from "./components/BookDetailPage";
import "./App.css";

function App() {
  const styles = {
    navbar: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "15px 30px",
      backgroundColor: "#66b2a0",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
  };
  return (
    <div className="App">
      <nav style={styles.navbar}>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.navLink}>
            Početna
          </Link>
          <Link to="/books" style={styles.navLink}>
            Sve Knjige
          </Link>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div style={{ padding: "20px" }}>
              <h1>Dobrodošli na Bookify</h1>
              <p>Pregledajte knjige i ostavite recenziju.</p>
              <Link to="/books">Pregled knjiga</Link>
            </div>
          }
        />

        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/:bookId" element={<BookDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;

"use client";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
};

function BookListPage() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/books");
        if (!response.ok) {
          throw new Error(
            `Greška ${response.status}: Ne mogu da dobavim knjige.`
          );
        }
        const data = await response.json();
        setBooks(data);
      } catch (err) {
        setError(err.message || "Došlo je do greške.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const styles = {
    page: {
      padding: "20px",
      backgroundColor: colors.backgroundLight,
      minHeight: "100vh",
      color: colors.textDark,
    },
    heading: {
      color: colors.textDark,
      borderBottom: `2px solid ${colors.accentMedium}`,
      paddingBottom: "10px",
      marginBottom: "20px",
    },
    list: {
      listStyle: "none",
      padding: 0,
    },
    listItem: {
      backgroundColor: colors.backgroundMedium,
      margin: "10px 0",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.2s ease-in-out",
      "&:hover": {
        transform: "scale(1.02)",
      },
    },
    link: {
      textDecoration: "none",
      color: colors.textDark,
      fontWeight: "bold",
      display: "block",
      transition: "color 0.2s",
    },
    linkHover: {
      color: colors.accentMedium,
    },
    author: {
      fontSize: "0.9em",
      color: `rgba(${colors.textDark.match(/\d+/g).join(",")}, 0.8)`,
      marginTop: "5px",
    },
    loading: {
      textAlign: "center",
      fontSize: "1.2em",
      color: colors.accentMedium,
    },
    error: {
      textAlign: "center",
      color: colors.errorRed,
      fontWeight: "bold",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginTop: "30px",
    },
    card: {
      backgroundColor: colors.backgroundMedium,
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      transition: "transform 0.2s ease-in-out",
      textAlign: "center",
    },
    link: {
      marginTop: "10px",
      display: "inline-block",
      color: colors.accentMedium,
      textDecoration: "none",
      fontWeight: "bold",
      borderBottom: "1px solid transparent",
      transition: "border-color 0.3s",
    },
  };

  const handleMouseEnter = (e) => (e.target.style.color = colors.accentMedium);
  const handleMouseLeave = (e) => (e.target.style.color = colors.textDark);

  if (isLoading) {
    return (
      <div style={styles.page}>
        <p style={styles.loading}>Učitavanje knjiga...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <p style={styles.error}>Greška: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Sve Knjige</h1>
      {books.length === 0 ? (
        <p>Nema dostupnih knjiga.</p>
      ) : (
        <div style={styles.grid}>
          {books.map((book) => (
            <div key={book.id} style={styles.card}>
              <h3>{book.title}</h3>
              {book.author && (
                <p style={styles.author}>Autor: {book.author.username}</p>
              )}
              <Link to={`/books/${book.id}`} style={styles.link}>
                Detalji
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookListPage;

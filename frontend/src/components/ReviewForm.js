// src/components/ReviewForm.js
"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppHeader from './AppHeader'; // Import je već tu, što je odlično!

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
  successGreen: "#5cb85c",
};

// Komponenta Star ostaje ista
function Star({ filled, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <span
      style={{
        cursor: "pointer",
        color: filled ? colors.accentMedium : colors.accentLight,
        fontSize: "2rem",
        marginRight: "5px",
        transition: "color 0.2s",
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      ★
    </span>
  );
}

function ReviewForm() {
  const { bookId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/user-info", {
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user info");

        const data = await res.json();
        setUserId(data.id);
      } catch (err) {
        setError("Could not retrieve user information.");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    setError(null);
    setSuccessMessage("");
    setRating(0);
    setComment("");
  }, [bookId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (authLoading) {
      setError("Autentifikacija je još u toku. Molimo sačekajte.");
      return;
    }

    if (!userId) {
      setError("User ID not found. Are you logged in?");
      return;
    }

    setIsLoading(true);

    const reviewData = {
      rating: rating,
      comment: comment || null,
      user_id: userId,
    };

    try {
      const apiUrl = `http://localhost:8000/reviews/${bookId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: Dodajte Authorization header ako je potreban, npr.
          // 'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(reviewData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
          `Greška ${response.status}: Nešto je pošlo po zlu.`
        );
      }

      setSuccessMessage("Recenzija uspješno poslana! Bićete preusmjereni...");
      setRating(0);
      setComment("");

      setTimeout(() => {
        navigate(`/app/books/${bookId}`);
      }, 2500);

    } catch (err) {
      setError(err.message || "Neočekivana greška prilikom slanja.");
    } finally {
      setIsLoading(false);
    }
  };

  // Prikazujemo AppHeader čak i dok se podaci o korisniku učitavaju
  if (authLoading) {
    return (
      <>
        <AppHeader />
        <div style={{
          textAlign: 'center',
          padding: '50px',
          color: colors.textDark,
          fontSize: '1.2em',
          backgroundColor: colors.backgroundLight, // Dodajemo pozadinu za konzistentnost
          minHeight: 'calc(100vh - 60px)', // Prilagodite visinu headera ako je drugačija
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Učitavanje podataka o korisniku...
        </div>
      </>
    );
  }

  // Glavni return za formu, sada unutar React Fragmenta koji uključuje AppHeader
  return (
    <>
      <AppHeader />
      <div style={{ // Dodajemo omotač za celu stranicu forme ispod headera
          backgroundColor: colors.backgroundLight, // Pozadina za celu stranicu
          paddingTop: "20px", // Razmak od headera
          paddingBottom: "40px",
          minHeight: "calc(100vh - 60px)", // Prilagodite visinu headera ako je drugačija
        }}
      >
        Leave a Review for Book ID: {bookId}
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              color: colors.textDark,
              fontWeight: "500",
            }}
          >
            Rating:
          </label>
          <div>
            {[1, 2, 3, 4, 5].map((starValue) => (
              <Star
                key={starValue}
                filled={starValue <= (hoverRating || rating)}
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        <div style={{ marginBottom: "25px" }}>
          <label
            htmlFor="commentInput"
            style={{
              display: "block",
              marginBottom: "5px",
              color: colors.textDark,
              fontWeight: "500",
            }}
          >
            Comment (optional):
          </label>
          <textarea
            id="commentInput"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            placeholder="Your thoughts about the book..."
            style={{
              width: "calc(100% - 20px)",
              padding: "10px",
              border: `1px solid ${colors.accentLight}`,
              borderRadius: "5px",
              backgroundColor: colors.backgroundLight,
              color: colors.textDark,
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
        </div>

        {error && (
          <p
            style={{
              color: colors.errorRed,
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            Error: {error}
          </p>
        )}
        {successMessage && (
          <p
            style={{
              color: colors.successGreen,
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {successMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: colors.backgroundMedium,
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            maxWidth: "500px",
            margin: "0 auto", // Centriranje forme, gornja margina je sada od paddingTop gornjeg diva
          }}
        >
          <h3
            style={{
              color: colors.textDark,
              marginBottom: "25px",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "1.5rem",
              borderBottom: `2px solid ${colors.accentLight}`,
              paddingBottom: "10px",
            }}
          >
            Ostavite recenziju
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: colors.textDark,
                  fontWeight: "500",
                }}
              >
                Ocjena:
              </label>
              <div>
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    filled={starValue <= (hoverRating || rating)}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                htmlFor="commentInput"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: colors.textDark,
                  fontWeight: "500",
                }}
              >
                Komentar (opcionalno):
              </label>
              <textarea
                id="commentInput"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="5"
                placeholder="Vaša razmišljanja o knjizi..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.accentLight}`,
                  borderRadius: "5px",
                  backgroundColor: colors.backgroundLight,
                  color: colors.textDark,
                  fontSize: "1rem",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  color: colors.errorRed,
                  marginBottom: "15px",
                  textAlign: "center",
                  fontWeight: "500",
                  padding: "10px",
                  backgroundColor: "rgba(217, 83, 79, 0.1)",
                  borderRadius: "5px",
                }}
              >
                Greška: {error}
              </p>
            )}
            {successMessage && (
              <p
                style={{
                  color: colors.successGreen,
                  marginBottom: "15px",
                  textAlign: "center",
                  fontWeight: "500",
                  padding: "10px",
                  backgroundColor: "rgba(92, 184, 92, 0.1)",
                  borderRadius: "5px",
                }}
              >
                {successMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              style={{
                width: "100%",
                padding: "12px 15px",
                backgroundColor: isLoading
                  ? colors.accentLight
                  : colors.accentMedium,
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s ease, opacity 0.3s ease",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Slanje..." : "Pošalji recenziju"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ReviewForm;
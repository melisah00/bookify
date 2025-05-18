"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
  successGreen: "#5cb85c",
};

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

function ReviewForm({ bookId, onReviewSubmitted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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

    if (rating === 0) {
      setError("Please select a rating (1-5).");
      return;
    }

    if (!user || !user.id) {
      setError("Korisnik nije autentifikovan.");
      return;
    }

    setIsLoading(true);

    const reviewData = {
      rating,
      comment: comment || null,
      user_id: user.id,
    };

    try {
      const apiUrl = `http://localhost:8000/reviews/${bookId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.detail || `Error ${response.status}`);
      }

      setSuccessMessage("Review submitted successfully!");
      setRating(0);
      setComment("");

      if (onReviewSubmitted) onReviewSubmitted(responseData);
    } catch (err) {
      setError(err.message || "Došlo je do greške pri slanju recenzije.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.backgroundMedium,
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        maxWidth: "500px",
        margin: "20px auto",
      }}
    >
      <h3
        style={{
          color: colors.textDark,
          marginBottom: "20px",
          textAlign: "center",
          fontWeight: "600",
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
            Ocjena:
          </label>
          <div>
            {[1, 2, 3, 4, 5].map((val) => (
              <Star
                key={val}
                filled={val <= (hoverRating || rating)}
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoverRating(val)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label
            htmlFor="commentInput"
            style={{ display: "block", marginBottom: "5px", color: colors.textDark, fontWeight: "500" }}
          >
            Komentar (opcionalno):
          </label>
          <textarea
            id="commentInput"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            placeholder="Tvoji utisci o knjizi..."
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
          <p style={{ color: colors.errorRed, marginBottom: "15px", textAlign: "center", fontWeight: "500" }}>
            Greška: {error}
          </p>
        )}
        {successMessage && (
          <p style={{ color: colors.successGreen, marginBottom: "15px", textAlign: "center", fontWeight: "500" }}>
            {successMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 15px",
            backgroundColor: isLoading ? colors.accentLight : colors.accentMedium,
            color: colors.backgroundLight,
            border: "none",
            borderRadius: "5px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Slanje..." : "Pošalji recenziju"}
        </button>
      </form>
    </div>
  );
}

export default ReviewForm;

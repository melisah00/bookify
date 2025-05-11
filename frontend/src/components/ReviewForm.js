"use client";
import React, { useState, useEffect } from "react";

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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setError(null);
    setSuccessMessage("");
    setRating(0);
    setComment("");
    setUserId("");
  }, [bookId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (rating === 0) {
      setError("Please select a rating (1-5).");
      return;
    }

    if (!userId || isNaN(parseInt(userId, 10))) {
      setError("Please enter a valid user ID (temporary).");
      return;
    }

    setIsLoading(true);

    const reviewData = {
      rating: rating,
      comment: comment || null,
      user_id: parseInt(userId, 10),
    };

    try {
      const apiUrl = `http://localhost:8000/reviews/${bookId}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            `Error ${response.status}: Something went wrong.`
        );
      }

      setSuccessMessage("Review submitted successfully!");
      setRating(0);
      setComment("");
      setUserId("");

      if (onReviewSubmitted) {
        onReviewSubmitted(responseData);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred while submitting.");
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
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="userIdInput"
            style={{
              display: "block",
              marginBottom: "5px",
              color: colors.textDark,
              fontWeight: "500",
            }}
          >
            User ID (Temporary):
          </label>
          <input
            type="number"
            id="userIdInput"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            required
            style={{
              width: "calc(100% - 20px)",
              padding: "10px",
              border: `1px solid ${colors.accentLight}`,
              borderRadius: "5px",
              backgroundColor: colors.backgroundLight,
              color: colors.textDark,
              fontSize: "1rem",
            }}
          />
          <small style={{ color: colors.textDark, opacity: 0.8 }}>
            *This field will be removed after login is implemented.
          </small>
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
            width: "100%",
            padding: "12px 15px",
            backgroundColor: isLoading
              ? colors.accentLight
              : colors.accentMedium,
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
          {isLoading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

export default ReviewForm;

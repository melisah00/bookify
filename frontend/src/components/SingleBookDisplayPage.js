"use client";

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppHeader from "./Header";

const colors = {
  backgroundLight: "#f8f9fa",
  backgroundMedium: "#e9ecef",
  accentLight: "#c3fae8",
  accentMedium: "#12b886",
  textDark: "#2b2d42",
  errorRed: "#dc3545",
  successGreen: "#2b8a3e",
};

const pageStyles = {
  page: {
    backgroundColor: colors.backgroundLight,
    minHeight: "100vh",
    color: colors.textDark,
    padding: "0 20px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    backgroundColor: colors.backgroundLight,
  },
  heading: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: "20px",
    position: "relative",
    paddingBottom: "15px",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "60px",
      height: "4px",
      backgroundColor: colors.accentMedium,
    },
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    marginTop: "40px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },
  bookInfoSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e0e0e0",
  },
  reviewSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e0e0e0",
  },
  authorInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },
  authorAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: colors.accentMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
  },
  description: {
    lineHeight: "1.8",
    fontSize: "1.1rem",
    color: "#495057",
    marginBottom: "30px",
  },
  downloadButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: colors.accentMedium,
    color: "white",
    padding: "12px 25px",
    borderRadius: "8px",
    textDecoration: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 5px 15px rgba(18, 184, 134, 0.3)",
    },
  },
  ratingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "30px",
  },
  starRating: {
    color: "#ffd43b",
    display: "flex",
    gap: "3px",
  },
  reviewCard: {
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "white",
    marginBottom: "20px",
    transition: "transform 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    "&:hover": {
      transform: "translateX(5px)",
    },
  },
  reviewMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  reviewAuthor: {
    fontWeight: "600",
    color: colors.textDark,
  },
  reviewDate: {
    color: "#868e96",
    fontSize: "0.9rem",
  },
  reviewComment: {
    color: "#495057",
    lineHeight: "1.6",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#868e96",
    backgroundColor: colors.backgroundLight,
  },
  authPrompt: {
    textAlign: "center",
    padding: "20px",
    backgroundColor: colors.backgroundLight,
    borderRadius: "8px",
    margin: "20px 0",
    border: "1px solid #e0e0e0",
  },
  errorMessage: {
    padding: "20px",
    backgroundColor: "#ffe3e3",
    color: colors.errorRed,
    borderRadius: "8px",
    margin: "20px 0",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: colors.accentMedium,
    backgroundColor: colors.backgroundLight,
  },
};

const StarRating = ({ rating }) => {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          style={{
            color: index < rating ? "#ffd43b" : "#adb5bd",
            fontSize: "20px",
          }}
        >
          {index < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};

function SingleBookDisplayPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchBookDetailsAndReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [bookResponse, reviewsResponse, avgRatingResponse] =
          await Promise.all([
            fetch(`http://localhost:8000/books/${bookId}`),
            fetch(`http://localhost:8000/books/${bookId}/reviews`),
            fetch(`http://localhost:8000/books/${bookId}/average-rating`),
          ]);

        if (!bookResponse.ok)
          throw new Error(
            `Error ${bookResponse.status}: Could not fetch book details.`
          );
        const bookData = await bookResponse.json();
        setBook(bookData);

        if (!reviewsResponse.ok) {
          console.warn(
            `Could not fetch reviews (status: ${reviewsResponse.status}).`
          );
          setReviews([]);
        } else {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        if (!avgRatingResponse.ok) {
          console.warn(
            `Could not fetch average rating (status: ${avgRatingResponse.status}).`
          );
          setAverageRating(null);
        } else {
          const avgRatingData = await avgRatingResponse.json();
          if (
            avgRatingData &&
            typeof avgRatingData.average_rating === "number"
          ) {
            setAverageRating(
              parseFloat(avgRatingData.average_rating).toFixed(1)
            );
          } else {
            setAverageRating(null);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "An error occurred while loading data.");
        setBook(null);
        setReviews([]);
        setAverageRating(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      fetchBookDetailsAndReviews();
    }
  }, [bookId]);

  if (authLoading || isLoading) {
    return (
      <>
        <AppHeader />
        <div style={pageStyles.page}>
          <div style={pageStyles.loading}>
            {authLoading ? "Authenticating..." : "Loading book details..."}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader />
        <div style={pageStyles.page}>
          <div style={pageStyles.error}>Error: {error}</div>
        </div>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <AppHeader />
        <div style={pageStyles.page}>
          <div style={pageStyles.error}>Book not found.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div style={pageStyles.page}>
        <div style={pageStyles.container}>
          <h1 style={pageStyles.heading}>{book.title}</h1>

          <div style={pageStyles.gridContainer}>
            <div style={pageStyles.bookInfoSection}>
              <div style={pageStyles.authorInfo}>
                <img
                  src={`http://localhost:8000${book.author?.icon}`}
                  alt="Author Avatar"
                  style={pageStyles.authorAvatar}
                />
                <div>
                  <h3 style={{ margin: 0 }}>{book.author?.username}</h3>
                  <small style={{ color: "#868e96" }}>Author</small>
                </div>
              </div>

              <div style={pageStyles.ratingContainer}>
                <StarRating rating={Math.round(averageRating)} />
                <span style={{ fontWeight: "600", color: colors.textDark }}>
                  {averageRating}/5
                </span>
              </div>

              <p style={pageStyles.description}>
                {book.description || "Description not available."}
              </p>

              {book.path && (
                <button
                  style={{
                    ...pageStyles.downloadButton,
                    marginBottom: "20px",
                    cursor: "pointer",
                    border: "none",
                  }}
                  onClick={async () => {
                    try {
                      await fetch(
                        `http://localhost:8000/books/${bookId}/increment-download`,
                        {
                          method: "POST",
                        }
                      );

                      window.open(
                        `http://localhost:8000${book.path}`,
                        "_blank"
                      );
                    } catch (err) {
                      console.error("Error downloading book:", err);
                      alert(
                        "An error occurred while trying to download the book."
                      );
                    }
                  }}
                >
                  Download Book (PDF)
                </button>
              )}
            </div>

            <div style={pageStyles.reviewSection}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "30px",
                }}
              >
                <h2 style={{ margin: 0 }}>Reviews</h2>
                {user ? (
                  <Link
                    to={`submit-review?title=${encodeURIComponent(book.title)}`}
                    style={{
                      ...pageStyles.downloadButton,
                      backgroundColor: colors.textDark,
                    }}
                  >
                    ✍️ Write a Review
                  </Link>
                ) : (
                  <div style={pageStyles.authPrompt}>
                    <Link
                      to="/login"
                      style={{
                        color: colors.accentMedium,
                        fontWeight: "600",
                        textDecoration: "underline",
                      }}
                    >
                      Log in
                    </Link>{" "}
                    to leave a review
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div
                  style={{
                    height: "160px",
                    overflowY: "auto",
                    paddingRight: "10px",
                    scrollSnapType: "y mandatory",
                  }}
                >
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        ...pageStyles.reviewCard,
                        scrollSnapAlign: "start",
                        minHeight: "140px",
                        marginBottom: "20px",
                      }}
                    >
                      <div style={pageStyles.reviewMeta}>
                        <div>
                          <span style={pageStyles.reviewAuthor}>
                            {review.user?.username || "Anonymous user"}
                          </span>
                          <StarRating rating={review.rating} />
                        </div>
                        <span style={pageStyles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={pageStyles.reviewComment}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={pageStyles.emptyState}>
                  📭 No reviews yet for this book
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SingleBookDisplayPage;

// SingleBookDisplayPage.js
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from './Header';

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
  successGreen: "rgb(78, 121, 107)",
};

const pageStyles = {
  page: {
    backgroundColor: colors.backgroundLight,
    minHeight: "100vh",
    color: colors.textDark,
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: colors.backgroundMedium,
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    marginTop: "20px",
  },
  heading: {
    color: colors.textDark,
    borderBottom: `2px solid ${colors.accentMedium}`,
    paddingBottom: "10px",
    marginBottom: "10px",
    fontSize: "2rem",
  },
  averageRatingText: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: colors.accentMedium,
    marginBottom: "20px",
  },
  subHeading: {
    color: colors.textDark,
    marginTop: "30px",
    marginBottom: "15px",
    fontSize: "1.5em",
  },
  description: {
    lineHeight: "1.6",
    marginBottom: "20px",
    fontSize: "1rem",
  },
  button: {
    backgroundColor: colors.accentMedium,
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    fontSize: "1em",
    cursor: "pointer",
    marginRight: "10px",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.3s ease",
  },
  loading: {
    textAlign: "center",
    fontSize: "1.2em",
    color: colors.accentMedium,
    padding: "50px",
  },
  error: {
    textAlign: "center",
    color: colors.errorRed,
    fontWeight: "bold",
    padding: "20px",
    backgroundColor: "rgba(217, 83, 79, 0.1)",
    borderRadius: "5px",
    margin: "20px"
  },
  reviewSection: {
    marginTop: "30px",
  },
  reviewItem: {
    border: `1px solid ${colors.accentLight}`,
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "4px",
    backgroundColor: colors.backgroundLight,
  },
  reviewAuthor: {
    fontWeight: "bold",
    color: colors.textDark,
  },
  reviewRating: {
    margin: "5px 0",
    color: colors.accentMedium,
  },
  reviewComment: {
    fontSize: "0.95em",
  },
  noReviews: {
    fontStyle: "italic",
    color: `rgba(${colors.textDark.match(/\d+/g).join(",")}, 0.8)`,
  },
  addReviewButtonContainer: {
    marginTop: "20px",
    marginBottom: "30px",
  }
};

function SingleBookDisplayPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const [isReviewButtonHovered, setIsReviewButtonHovered] = useState(false);

  useEffect(() => {
    const fetchBookDetailsAndReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [bookResponse, reviewsResponse, avgRatingResponse] = await Promise.all([
          fetch(`http://localhost:8000/books/${bookId}`),
          fetch(`http://localhost:8000/books/${bookId}/reviews`),
          fetch(`http://localhost:8000/books/${bookId}/average-rating`)
        ]);

        if (!bookResponse.ok) throw new Error(`Greška ${bookResponse.status}: Nije moguće dohvatiti detalje knjige.`);
        const bookData = await bookResponse.json();
        setBook(bookData);

        if (!reviewsResponse.ok) {
          console.warn(`Nije moguće dohvatiti recenzije (status: ${reviewsResponse.status}).`);
          setReviews([]);
        } else {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        if (!avgRatingResponse.ok) {
          console.warn(`Nije moguće dohvatiti prosečnu ocenu (status: ${avgRatingResponse.status}).`);
          setAverageRating(null);
        } else {
          const avgRatingData = await avgRatingResponse.json();
          if (avgRatingData && typeof avgRatingData.average_rating === 'number') {
            setAverageRating(parseFloat(avgRatingData.average_rating).toFixed(1));
          } else {
            setAverageRating(null);
          }
        }

      } catch (err) {
        console.error("Greška prilikom dohvatanja podataka:", err);
        setError(err.message || "Došlo je do greške pri učitavanju podataka.");
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
          <div style={pageStyles.loading}>{authLoading ? "Autentifikacija..." : "Učitavanje detalja knjige..."}</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader />
        <div style={pageStyles.page}>
          <div style={pageStyles.error}>Greška: {error}</div>
        </div>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <AppHeader />
        <div style={pageStyles.page}>
          <div style={pageStyles.error}>Knjiga nije pronađena.</div>
        </div>
      </>
    );
  }

  const reviewButtonStyle = {
    ...pageStyles.button,
    backgroundColor: isReviewButtonHovered ? colors.textDark : colors.accentMedium,
  };

  return (
    <>
      <AppHeader />
      <div style={pageStyles.page}>
        <div style={pageStyles.container}>
          <h1 style={pageStyles.heading}>{book.title}</h1>

          {book.author && <p style={{ fontSize: "1.1rem", marginBottom: '15px' }}><strong>Autor:</strong> {book.author.username}</p>}

          <h2 style={pageStyles.subHeading}>Opis</h2>
          <p style={pageStyles.description}>
            {book.description || "Opis nije dostupan."}
          </p>

          {book.path && (
            <button
              style={{ ...pageStyles.button, marginBottom: '20px' }}
              onClick={async () => {
                try {
                  await fetch(`http://localhost:8000/books/${bookId}/increment-download`, {
                    method: "POST",
                  });

                  const link = document.createElement('a');
                  link.href = `http://localhost:8000${book.path}`;
                  link.setAttribute('download', '');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (err) {
                  console.error("Greška prilikom preuzimanja knjige:", err);
                  alert("Došlo je do greške pri pokušaju preuzimanja knjige.");
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.textDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentMedium}
            >
              Preuzmi Knjigu (PDF)
            </button>
          )}

          <div style={pageStyles.addReviewButtonContainer}>
            {user ? (
              <Link
                to={`submit-review`}
                style={reviewButtonStyle}
                onMouseEnter={() => setIsReviewButtonHovered(true)}
                onMouseLeave={() => setIsReviewButtonHovered(false)}
              >Napiši recenziju
              </Link>
            ) : (
              <p>Morate biti <Link to="/login" style={{ color: colors.accentMedium, fontWeight: 'bold' }}>ulogovani</Link> da biste ostavili recenziju.</p>
            )}
          </div>

          {averageRating !== null && (
            <p style={pageStyles.averageRatingText}>
              Prosečna ocena: {averageRating} / 5
            </p>
          )}

          <div style={pageStyles.reviewSection}>
            <h2 style={pageStyles.subHeading}>Recenzije</h2>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} style={pageStyles.reviewItem}>
                  <p style={pageStyles.reviewAuthor}>
                    {review.user ? review.user.username : "Anoniman korisnik"}
                  </p>
                  <p style={pageStyles.reviewRating}>Ocena: {review.rating}/5</p>
                  <p style={pageStyles.reviewComment}>{review.comment}</p>
                  <small>{new Date(review.created_at).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p style={pageStyles.noReviews}>Nema recenzija za ovu knjigu.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SingleBookDisplayPage;

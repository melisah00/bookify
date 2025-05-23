import React, { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useParams } from "react-router-dom";


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
  const style = {
    cursor: "pointer",
    color: filled ? colors.accentMedium : colors.accentLight,
    fontSize: "2rem",
    marginRight: "5px",
    transition: "color 0.2s",
  };

  return (
    <span
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      ★
    </span>
  );
}


export default function ReviewForm({ onReviewSubmitted }) {
  const { user } = useAuth();
  const { bookId } = useParams();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [loadingTitle, setLoadingTitle] = useState(true);
  const [errorTitle, setErrorTitle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);


  useEffect(() => {
    async function fetchTitle() {
      if (!bookId) return;
      setLoadingTitle(true);
      setErrorTitle(null);
      try {
        const res = await fetch(`http://localhost:8000/books/${bookId}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setBookTitle(data.title || "");
      } catch (err) {
        console.error(err);
        setErrorTitle("Nije moguće učitati naslov.");
      } finally {
        setLoadingTitle(false);
      }
    }
    fetchTitle();
  }, [bookId]);


  useEffect(() => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setFormError(null);
    setSuccessMessage(null);
  }, [bookId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (rating === 0) {
      setFormError("Odaberi ocjenu od 1 do 5.");
      return;
    }
    if (!user?.id) {
      setFormError("Morate biti prijavljeni.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/reviews/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || null, user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Status ${res.status}`);

      setSuccessMessage("Uspješno poslano!");
      setRating(0);
      setComment("");
      if (onReviewSubmitted) onReviewSubmitted(data);
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Greška pri slanju.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={{ backgroundColor: 'colors.backgroundMedium', padding: "25px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", maxWidth: "500px", margin: "20px auto" }}>
      <h3 style={{ color: colors.textDark, marginBottom: "20px", textAlign: "center", fontWeight: 600 }}>
        {loadingTitle ? "Učitavanje naslova..." : errorTitle ? errorTitle : `Recenzija za: ${bookTitle}`}
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <label style={{ display: "block", marginBottom: "10px", color: colors.textDark, fontWeight: 500 }}>Ocjena:</label>
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

        <div style={{ marginBottom: "25px" }}>
          <label htmlFor="comment" style={{ display: "block", marginBottom: "5px", color: colors.textDark, fontWeight: 500 }}>
            Komentar (opcionalno):
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="Podijeli svoje mišljenje..."
            style={{ width: "100%", padding: "10px", border: `1px solid ${colors.accentLight}`, borderRadius: "5px", backgroundColor: colors.backgroundLight, color: colors.textDark, fontSize: "1rem", resize: "vertical" }}
          />
        </div>

        {formError && <p style={{ color: colors.errorRed, textAlign: "center", marginBottom: "15px", fontWeight: 500 }}>Greška: {formError}</p>}
        {successMessage && <p style={{ color: colors.successGreen, textAlign: "center", marginBottom: "15px", fontWeight: 500 }}>{successMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: "100%", padding: "12px", backgroundColor: isSubmitting ? colors.accentLight : colors.accentMedium, color: colors.backgroundLight, border: "none", borderRadius: "5px", fontSize: "1.1rem", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer", transition: "background-color 0.3s", opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "Slanje..." : "Pošalji recenziju"}
        </button>
      </form>
    </div>
  );
}

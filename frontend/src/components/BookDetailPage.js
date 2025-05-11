import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReviewForm from "./ReviewForm";

function BookDetailPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/books/${bookId}`)
      .then((response) => response.json())
      .then((data) => setBook(data))
      .catch((error) => console.error("Error fetching book details:", error));
  }, [bookId]);

  const handleReviewSubmit = () => {
    alert("Review submitted successfully!");
  };

  if (!book) return <p>Loading book...</p>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Book Details: {book.title}</h2>
        <p style={styles.author}>
          Author: {book.author?.username || "Unknown"}
        </p>
        <p style={styles.downloads}>Downloads: {book.num_of_downloads}</p>
      </div>

      <ReviewForm bookId={bookId} onReviewSubmitted={handleReviewSubmit} />
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    backgroundColor: "#f8f6f1",
    minHeight: "100vh",
  },
  card: {
    backgroundColor: "#e1eae5",
    padding: "20px 30px",
    borderRadius: "10px",
    maxWidth: "600px",
    margin: "0 auto 20px",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "1.5rem",
    marginBottom: "6px",
    color: "#4e796b",
    borderBottom: "1px solid #66b2a0",
    paddingBottom: "4px",
  },
  author: {
    fontSize: "1rem",
    color: "#4e796b",
    marginBottom: "2px",
  },
  downloads: {
    fontSize: "0.9rem",
    color: "#66b2a0",
    marginTop: "0px",
  },
};

export default BookDetailPage;

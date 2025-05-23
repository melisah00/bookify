"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';

const pageColors = {
  backgroundLight: "#f8f9fa",
  textDark: "rgb(78,121,107)",
};

const pageStyles = {
  pageContainer: {
    backgroundColor: pageColors.backgroundLight,
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  loadingText: {
    color: pageColors.textDark,
    fontSize: '1.2em',
    marginTop: '50px',
  },
  errorText: {
    color: 'red',
    fontSize: '1.2em',
    marginTop: '50px',
  },
  bookTitleHeader: {
    color: pageColors.textDark,
    fontSize: '1.8rem',
    marginBottom: '10px',
    textAlign: 'center',
    paddingTop: '50px',
  }
};

function SubmitReviewPage() {
  const { bookId } = useParams();
  const [bookTitle, setBookTitle] = useState('');
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');


  useEffect(() => {
    if (bookId) {
      setIsLoadingTitle(true);
      fetch(`http://localhost:8000/books/${bookId}`)
        .then(res => {
          if (!res.ok) throw new Error('Nije moguće dohvatiti naslov knjige.');
          return res.json();
        })
        .then(data => {
          setBookTitle(data.title);
          setErrorTitle('');
        })
        .catch(err => {
          console.error("Greška pri dohvaćanju naslova knjige:", err);
          setErrorTitle('Nije moguće učitati naslov knjige.');
          setBookTitle('');
        })
        .finally(() => setIsLoadingTitle(false));
    }
  }, [bookId]);

  return (
    <div style={pageStyles.pageContainer}>
      {isLoadingTitle && <p style={pageStyles.loadingText}>Učitavanje naslova knjige...</p>}
      {errorTitle && <p style={pageStyles.errorText}>{errorTitle}</p>}
      {!bookTitle && !isLoadingTitle && !errorTitle && bookId &&
        <h2 style={pageStyles.bookTitleHeader}>Recenzija za knjigu (ID: {bookId})</h2>
      }
      <ReviewForm bookId={bookId} />


    </div>
  );
}

export default SubmitReviewPage;
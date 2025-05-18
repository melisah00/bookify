"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm'; // Prilagodite putanju do ReviewForm komponente

const pageColors = { // Možete koristiti iste boje ili definirati nove za stranicu
  backgroundLight: "rgb(248,246,241)",
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
  const [isLoadingTitle, setIsLoadingTitle] = useState(false); // Ne želimo da blokira formu
  const [errorTitle, setErrorTitle] = useState('');

  // Opciono: Dohvatiti naslov knjige za prikaz na stranici
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
          setBookTitle(''); // Osiguraj da nema starog naslova
        })
        .finally(() => setIsLoadingTitle(false));
    }
  }, [bookId]);

  return (
    <div style={pageStyles.pageContainer}>
      {isLoadingTitle && <p style={pageStyles.loadingText}>Učitavanje naslova knjige...</p>}
      {errorTitle && <p style={pageStyles.errorText}>{errorTitle}</p>}
      {bookTitle && <h2 style={pageStyles.bookTitleHeader}>Recenzija za knjigu: {bookTitle}</h2>}
      {!bookTitle && !isLoadingTitle && !errorTitle && bookId &&
        <h2 style={pageStyles.bookTitleHeader}>Recenzija za knjigu (ID: {bookId})</h2>
      }
      <ReviewForm /> 
      {/* bookId se sada uzima iz useParams unutar ReviewForm, pa ga ne moramo explicitno slati */}
      {/* onReviewSubmitted prop nije više neophodan ako se preusmjeravanje radi unutar ReviewForm */}
    </div>
  );
}

export default SubmitReviewPage;
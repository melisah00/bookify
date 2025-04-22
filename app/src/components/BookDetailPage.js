"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import ReviewForm from './ReviewForm'; 

// Koristi istu paletu boja
const colors = {
    backgroundLight: 'rgb(248,246,241)',
    backgroundMedium: 'rgb(225,234,229)',
    accentLight: 'rgb(167,215,184)',
    accentMedium: 'rgb(102,178,160)',
    textDark: 'rgb(78,121,107)',
    errorRed: '#d9534f',
    successGreen: '#5cb85c'
};

function BookDetailPage() {
    const { bookId } = useParams(); 
    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(false); 

    useEffect(() => {
        const fetchBookDetails = async () => {
            setIsLoading(true);
            setError(null);
            setReviewSuccess(false); 
            try {
                const response = await fetch(`http://localhost:8000/books/${bookId}`); 
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Knjiga nije pronađena.');
                    }
                    throw new Error(`Greška ${response.status}: Ne mogu da dobavim detalje knjige.`);
                }
                const data = await response.json();
                setBook(data);
            } catch (err) {
                setError(err.message || 'Došlo je do greške.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookDetails();
    }, [bookId]); 

    const handleSuccessfulReview = (submittedReview) => {
        console.log('Recenzija uspešno poslata:', submittedReview);
        setReviewSuccess(true); // Pokaži poruku o uspehu
    };

    const styles = {
         page: {
             padding: '20px',
             backgroundColor: colors.backgroundLight,
             minHeight: '100vh',
             color: colors.textDark,
         },
         heading: {
             color: colors.textDark,
             borderBottom: `2px solid ${colors.accentMedium}`,
             paddingBottom: '10px',
             marginBottom: '15px',
         },
         bookInfo: {
              marginBottom: '30px',
              padding: '15px',
              backgroundColor: colors.backgroundMedium,
              borderRadius: '8px',
         },
          author: {
              fontSize: '1.1em',
              color: `rgba(${colors.textDark.match(/\d+/g).join(',')}, 0.9)`,
              marginBottom: '10px',
          },
          downloads: {
               fontSize: '0.9em',
               color: `rgba(${colors.textDark.match(/\d+/g).join(',')}, 0.8)`,
          },
         loading: {
             textAlign: 'center',
             fontSize: '1.2em',
             color: colors.accentMedium,
         },
         error: {
             textAlign: 'center',
             color: colors.errorRed,
             fontWeight: 'bold',
             padding: '20px',
             backgroundColor: `rgba(${colors.errorRed.match(/\d+/g).join(',')}, 0.1)`,
             borderRadius: '5px',
         },
         successMessage: {
              textAlign: 'center',
              color: colors.successGreen,
              fontWeight: 'bold',
              padding: '15px',
              backgroundColor: `rgba(${colors.successGreen.match(/\d+/g).join(',')}, 0.1)`,
              borderRadius: '5px',
              marginTop: '20px',
         }
    };

    if (isLoading) {
        return <div style={styles.page}><p style={styles.loading}>Učitavanje detalja knjige...</p></div>;
    }

    if (error) {
        return <div style={styles.page}><p style={styles.error}>{error}</p></div>;
    }

    if (!book) {
        return <div style={styles.page}><p style={styles.error}>Knjiga nije pronađena.</p></div>;
    }

    return (
        <div style={styles.page}>
            <div style={styles.bookInfo}>
                <h1 style={styles.heading}>Detalji Knjige: {book.title}</h1>
                {book.author && <p style={styles.author}>Autor: {book.author.username}</p>}
                <p style={styles.downloads}>Broj preuzimanja: {book.num_of_downloads}</p>
            </div>

            {reviewSuccess && (
                <p style={styles.successMessage}>Hvala na recenziji!</p>
            )}


            <ReviewForm
                bookId={parseInt(bookId, 10)} 
                onReviewSubmitted={handleSuccessfulReview}
            />

        </div>
    );
}

export default BookDetailPage;
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Grid,
  Container,
  Box,
  Pagination,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { red } from "@mui/material/colors";
import BookFilter from "./BookFilter";

function BookListPage() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const booksPerPage = 8;
  const totalPages = Math.ceil(books.length / booksPerPage);
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/books");
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch books.`);
        }

        const booksData = await response.json();

        const booksWithRatings = await Promise.all(
          booksData.map(async (book) => {
            try {
              const ratingRes = await fetch(
                `http://localhost:8000/books/${book.id}/average-rating`
              );
              if (!ratingRes.ok) throw new Error();
              const ratingData = await ratingRes.json();
              return {
                ...book,
                average_rating: ratingData.average_rating,
                reviewCount: ratingData.review_count || 0, // ako dodate u response
              };
            } catch {
              return {
                ...book,
                average_rating: null,
                reviewCount: 0,
              };
            }
          })
        );

        setBooks(booksWithRatings);
      } catch (err) {
        setError(err.message || "An error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography align="center" variant="h6" color="text.secondary">
          Loading books...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography align="center" variant="h6" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 6, pb: 6 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{
          mb: 4,
          color: "#4e796b",
          fontWeight: "bold",
          borderBottom: "3px solid #66b2a0",
          display: "inline-block",
          px: 2,
        }}
      >
        All Books
      </Typography>

      <Box sx={{ my: 4 }}>
        <BookFilter onResults={setBooks} />
      </Box>

      {books.length === 0 ? (
        <Typography align="center" sx={{ mt: 2 }}>
          No books available.
        </Typography>
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {currentBooks.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: 3,
                    borderRadius: 2,
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: "#66b2a0" }}>
                        {book.author?.username?.[0]?.toUpperCase() || "A"}
                      </Avatar>
                    }
                    title={book.title}
                    subheader={book.author?.username || "Unknown Author"}
                  />
                  <CardMedia
                    component="img"
                    height="180"
                    image="/Book.png"
                    alt="Book cover"
                    sx={{ objectFit: "cover" }}
                  />
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Typography
                          key={star}
                          sx={{
                            color:
                              star <= Math.round(book.average_rating || 0)
                                ? "#ffc107"
                                : "#e0e0e0",
                            fontSize: "1.2rem",
                          }}
                        >
                          ★
                        </Typography>
                      ))}
                      <Typography
                        variant="caption"
                        sx={{ ml: 1, color: "text.secondary" }}
                      >
                        {book.average_rating != null
                          ? `(${book.average_rating.toFixed(1)})`
                          : "(N/A)"}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <IconButton aria-label="add to favorites">
                      <FavoriteIcon />
                    </IconButton>
                    <IconButton aria-label="shopping cart">
                      <ShoppingCartIcon />
                    </IconButton>
                    <Box sx={{ marginLeft: "auto" }}>
                      <Link
                        to={`${book.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Typography
                          variant="button"
                          sx={{
                            color: "#66b2a0",
                            fontWeight: "bold",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          View Details
                        </Typography>
                      </Link>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="medium"
            />
          </Box>
        </>
      )}
    </Container>
  );
}

export default BookListPage;

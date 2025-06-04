import React, { useEffect, useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import BookFilter from "../components/BookFilter";
import { Link } from "react-router-dom";

function FavouriteBooksPage() {
  const [books, setBooks] = useState([]);
  const [originalBooks, setOriginalBooks] = useState([]); // ✅ new state
  const [favouriteBookIds, setFavouriteBookIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const booksPerPage = 8;
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const res = await fetch("http://localhost:8000/books/favourites", {
          credentials: "include",
        });
        const ids = await res.json();
        setFavouriteBookIds(ids);

        const booksRes = await fetch("http://localhost:8000/books");
        const allBooks = await booksRes.json();

        const favBooks = allBooks.filter((book) => ids.includes(book.id));

        const booksWithRatings = await Promise.all(
          favBooks.map(async (book) => {
            try {
              const ratingRes = await fetch(
                `http://localhost:8000/books/${book.id}/average-rating`
              );
              const ratingData = await ratingRes.json();
              return {
                ...book,
                average_rating: ratingData.average_rating,
                reviewCount: ratingData.review_count || 0,
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

        setOriginalBooks(booksWithRatings); // ✅ full unfiltered list
        setBooks(booksWithRatings); // ✅ filtered display list
      } catch (err) {
        setError("Failed to load favourite books.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchFavourites();
  }, [user]);

  const toggleFavourite = async (bookId) => {
    const isFavourite = favouriteBookIds.includes(bookId);

    try {
      const response = await fetch(
        `http://localhost:8000/books/favourites/${bookId}`,
        {
          method: isFavourite ? "DELETE" : "POST",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      setFavouriteBookIds((prev) =>
        isFavourite ? prev.filter((id) => id !== bookId) : [...prev, bookId]
      );

      setBooks((prevBooks) =>
        isFavourite ? prevBooks.filter((b) => b.id !== bookId) : prevBooks
      );
      setOriginalBooks((prevBooks) =>
        isFavourite ? prevBooks.filter((b) => b.id !== bookId) : prevBooks
      ); // ✅ keep both in sync
    } catch (err) {
      alert("Something went wrong.");
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        Favourite Books
      </Typography>

      <Box sx={{ my: 4 }}>
        <BookFilter baseBooks={originalBooks} onResults={setBooks} />
      </Box>

      {isLoading ? (
        <Typography align="center">Loading...</Typography>
      ) : error ? (
        <Typography align="center" color="error">
          {error}
        </Typography>
      ) : books.length === 0 ? (
        <Typography align="center">No favourites found.</Typography>
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
                    <IconButton onClick={() => toggleFavourite(book.id)}>
                      <FavoriteIcon sx={{ color: "red" }} />
                    </IconButton>
                    <IconButton>
                      <ShoppingCartIcon />
                    </IconButton>
                    <Box sx={{ marginLeft: "auto" }}>
                      <Link
                        to={`/app/reader/books/${book.id}`}
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

export default FavouriteBooksPage;

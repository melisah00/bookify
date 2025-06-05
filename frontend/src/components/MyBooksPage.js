import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Grid,
  Container,
  Box,
  Pagination,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import { useAuth } from "../contexts/AuthContext";
import BookFilter from "../components/BookFilter";
import { Link } from "react-router-dom";

function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [originalBooks, setOriginalBooks] = useState([]);
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
    const fetchMyBooks = async () => {
      try {
        const res = await fetch("http://localhost:8000/books/authored", {
          credentials: "include",
        });
        const authoredBooks = await res.json();
        setOriginalBooks(authoredBooks);
        setBooks(authoredBooks);
      } catch (err) {
        setError("Failed to load your books.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchMyBooks();
  }, [user]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <Container sx={{ mt: 6, pb: 6 }}>
        <Typography align="center" variant="h6" color="text.secondary">
          Loading books...
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
        My Uploaded Books
      </Typography>

      {error ? (
        <Typography align="center" color="error">
          {error}
        </Typography>
      ) : books.length === 0 ? (
        <>
          <Box sx={{ my: 4 }}>
            <BookFilter baseBooks={originalBooks} onResults={setBooks} />
          </Box>
          <Typography align="center">No books found.</Typography>
        </>
      ) : (
        <>
          <Box sx={{ my: 4 }}>
            <BookFilter baseBooks={originalBooks} onResults={setBooks} />
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {currentBooks.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: 420,
                    maxWidth: 260,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: 3,
                    borderRadius: 2,
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        src={
                          user?.icon
                            ? `http://localhost:8000${user.icon}`
                            : undefined
                        }
                        sx={{ bgcolor: "#66b2a0" }}
                      >
                        {!user?.icon &&
                          (user?.username?.[0]?.toUpperCase() || "A")}
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

                      <Box
                        sx={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "text.secondary",
                        }}
                      >
                        <DownloadForOfflineIcon
                          sx={{ fontSize: 18, color: "#6c757d" }}
                        />
                        <Typography variant="caption">
                          {book.num_of_downloads}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Link
                        to={`/app/author/books/${book.id}`}
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

export default MyBooksPage;

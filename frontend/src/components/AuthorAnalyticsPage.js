import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Pagination,
  Button,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import { Link } from "react-router-dom";
import ReviewStatsDialog from "../components/ReviewStatsDialog";

function AuthorAnalyticsPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);

  const booksPerPage = 8;
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/books/authored", {
          credentials: "include",
        });
        const data = await res.json();
        setBooks(data);
      } catch {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6, pb: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <Typography align="center" variant="h6" color="text.secondary">
            Loading books...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 6, pb: 6 }}>
      {/* Title + Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#4e796b",
            fontWeight: "bold",
            borderBottom: "3px solid #66b2a0",
            px: 2,
            display: "inline-block",
          }}
        >
          Book Performance
        </Typography>

        <Link
          to="/app/author/analytics/top-books"
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#4e796b",
              "&:hover": { backgroundColor: "#3a5e52" },
              fontWeight: "bold",
              height: "100%",
            }}
          >
            View Top Performing Books
          </Button>
        </Link>
      </Box>

      {/* Book Cards */}
      <Grid container spacing={4} justifyContent="center">
        {currentBooks.map((book) => (
          <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              onClick={() => setSelectedBook(book)}
              sx={{
                cursor: "pointer",
                height: 420,
                maxWidth: 260,
                display: "flex",
                flexDirection: "column",
                boxShadow: 4,
                borderRadius: 3,
                overflow: "hidden",
                transition: "0.3s",
                "&:hover": { boxShadow: 8 },
              }}
            >
              <CardMedia
                component="img"
                height="160"
                image="/Book.png"
                alt="Book cover"
                sx={{ objectFit: "contain", pt: 2 }}
              />

              <CardContent sx={{ px: 2, py: 1 }}>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    color: "#37474f",
                    mb: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {book.title}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    gap: 0.5,
                  }}
                >
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
                    sx={{ color: "text.secondary", lineHeight: "1.2rem" }}
                  >
                    ({book.average_rating?.toFixed(1) ?? "N/A"})
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: "#f5f5f5",
                    p: 1,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.85rem",
                    color: "#616161",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <DownloadForOfflineIcon sx={{ fontSize: 18 }} />
                    <span>{book.num_of_downloads}</span>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 18 }} />
                    <span>{book.review_count}</span>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <FavoriteIcon sx={{ fontSize: 18 }} />
                    <span>{book.favourite_count}</span>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination + Dialog */}
      <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="medium"
        />
        <ReviewStatsDialog
          open={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          book={selectedBook}
        />
      </Box>
    </Container>
  );
}

export default AuthorAnalyticsPage;

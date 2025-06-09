import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  Box,
  Avatar,
  Divider,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import GroupIcon from "@mui/icons-material/Group";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ForumIcon from "@mui/icons-material/Forum";
import InsightsIcon from "@mui/icons-material/Insights";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/books/admin/metrics/summary", {
          credentials: "include",
        });
        const data = await res.json();
        setMetrics(data);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ icon, label, value }) => (
    <Card
      sx={{
        width: 200,
        height: 160,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 3,
        boxShadow: 3,
        p: 2,
        backgroundColor: "#f4f6f8",
      }}
    >
      <Avatar sx={{ bgcolor: "#4e796b", mb: 1 }}>{icon}</Avatar>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: "bold", color: "#37474f" }}>
        {value}
      </Typography>
    </Card>
  );

  if (loading || !metrics) {
    return (
      <Container sx={{ mt: 6, pb: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <Typography align="center" variant="h6" color="text.secondary">
            Loading analytics...
          </Typography>
        </Box>
      </Container>
    );
  }

  const engagement = metrics.engagement || {};

  return (
    <Container sx={{ mt: 6, pb: 6 }}>
      {/* Page Title */}
      <Box
        sx={{
          display: "inline-block",
          borderBottom: "2px solid #66b2a0",
          px: 1.5,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#4e796b",
            fontWeight: "bold",
          }}
        >
          Admin Book Analytics
        </Typography>
      </Box>

      {/* Top Metrics Cards */}
      <Grid container spacing={4} justifyContent="center">
        {[
          {
            icon: <LibraryBooksIcon />,
            label: "Total Books",
            value: metrics.total_books ?? 0,
          },
          {
            icon: <GroupIcon />,
            label: "Top Authors",
            value: metrics.top_authors_by_uploads?.length ?? 0,
          },
          {
            icon: <FavoriteIcon />,
            label: "Top Favourited",
            value: metrics.most_favourited_books?.length ?? 0,
          },
          {
            icon: <ForumIcon />,
            label: "Most Reviewed",
            value: metrics.top_rated_books?.length ?? 0,
          },
          {
            icon: <DownloadForOfflineIcon />,
            label: "Most Downloaded",
            value: metrics.most_downloaded_books?.length ?? 0,
          },
        ].map((item, index) => (
          <Grid item key={index}>
            <StatCard icon={item.icon} label={item.label} value={item.value} />
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          mt: 4,
        }}
      >
        {/* Top Authors by Uploads */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Top Authors by Uploads
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={metrics.top_authors_by_uploads.map((author, index) => ({
                ...author,
                label: `#${index + 1}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.username || label
                }
                formatter={(value) => [`${value} books`, "Uploads"]}
              />
              <Bar dataKey="book_count" fill="#4e796b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Downloaded Books */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Most Downloaded Books
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={metrics.most_downloaded_books.map((book, index) => ({
                ...book,
                label: `#${index + 1}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.title || label
                }
                formatter={(value) => [`${value} downloads`, "Downloads"]}
              />
              <Bar dataKey="downloads" fill="#66b2a0" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Rated Books */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Top Rated Books
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={metrics.top_rated_books.map((book, index) => ({
                ...book,
                label: `#${index + 1}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 5]} />
              <Tooltip
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.title || label
                }
                formatter={(value) => [`${value}★`, "Avg Rating"]}
              />
              <Bar dataKey="avg_rating" fill="#4e796b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bottom Rated Books */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Bottom Rated Books
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={metrics.bottom_rated_books.map((book, index) => ({
                ...book,
                label: `#${index + 1}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 5]} />
              <Tooltip
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.title || label
                }
                formatter={(value) => [`${value}★`, "Avg Rating"]}
              />
              <Bar dataKey="avg_rating" fill="#b24e4e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Favourited Books */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Most Favourited Books
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={metrics.most_favourited_books.map((book, index) => ({
                ...book,
                label: `#${index + 1}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.title || label
                }
                formatter={(value) => [`${value} ❤️`, "Favourites"]}
              />
              <Bar dataKey="favourites" fill="#66b2a0" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Reviewed Books */}
        <Card
          sx={{ p: 4, backgroundColor: "#f4fdfb", boxShadow: 4, height: 420 }}
        >
          <Typography variant="h5" mb={2}>
            Most Reviewed Books
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={[...metrics.top_rated_books, ...metrics.bottom_rated_books]
                .filter((book) => book.reviews && book.reviews > 0)
                .sort((a, b) => b.reviews - a.reviews)
                .slice(0, 6)
                .map((book, index) => ({ ...book, label: `#${index + 1}` }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} reviews`, "Reviews"]}
                labelFormatter={(label, payload) =>
                  payload[0]?.payload?.title || label
                }
              />
              <Bar dataKey="reviews" fill="#4e796b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Box>

      {/* Engagement Overview */}
      <Box mt={6}>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <InsightsIcon sx={{ color: "#4e796b", mr: 1 }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#37474f" }}
          >
            Engagement Overview
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              label: "Total Downloads",
              value: engagement.total_downloads ?? 0,
              icon: <DownloadForOfflineIcon />,
            },
            {
              label: "Total Reviews",
              value: engagement.total_reviews ?? 0,
              icon: <ForumIcon />,
            },
            {
              label: "Avg Global Rating",
              value: engagement.avg_global_rating?.toFixed(2) ?? "N/A",
              icon: <StarIcon />,
            },
            {
              label: "Avg Favourites/Book",
              value: engagement.avg_favourites_per_book?.toFixed(2) ?? "N/A",
              icon: <FavoriteIcon />,
            },
            {
              label: "Avg Reviews/Book",
              value: engagement.avg_reviews_per_book?.toFixed(2) ?? "N/A",
              icon: <ForumIcon />,
            },
          ].map((item, index) => (
            <Grid item key={index}>
              <StatCard
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

export default AdminAnalyticsPage;

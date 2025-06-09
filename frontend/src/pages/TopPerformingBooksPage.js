import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const ChartBlock = ({ data, dataKey, label }) => (
  <Paper
    elevation={6}
    sx={{
      p: 4,
      mb: 6,
      borderRadius: 5,
      backgroundColor: "#eef7f4",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      transition: "0.3s",
      userSelect: "none",
    }}
  >
    <Typography
      variant="h5"
      align="center"
      sx={{
        mb: 3,
        color: "#2e5e4e",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {label}
    </Typography>

    {/* Static legend with titles */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        mb: 2,
        gap: 2,
        px: 2,
      }}
    >
      {data.map((book, idx) => (
        <Box
          key={book.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "0.85rem",
            color: "#4e796b",
            background: "#d8ede6",
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          📘 #{idx + 1}: {book.title}
        </Box>
      ))}
    </Box>

    <Box sx={{ width: "100%", height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.map((book, i) => ({ ...book, index: i }))}
          margin={{ top: 20, right: 40, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="4 4" stroke="#c8d8d4" />
          <XAxis
            dataKey="index"
            tickFormatter={(i) => `#${i + 1}`}
            tick={{ fill: "#4e796b", fontWeight: 500 }}
            label={{
              value: "Books",
              position: "insideBottom",
              offset: -5,
              style: { fill: "#4e796b", fontWeight: 600 },
            }}
          />
          <YAxis
            allowDecimals={false}
            stroke="#607d8b"
            label={{
              angle: -90,
              position: "insideLeft",
              offset: 10,
              value: label,
              style: { fill: "#4e796b", fontWeight: 500 },
            }}
          />
          <Bar
            dataKey={dataKey}
            fill="url(#greenGradient)"
            radius={[8, 8, 0, 0]}
            barSize={data.length <= 3 ? 40 : undefined}
            isAnimationActive={false}
            cursor="default"
          >
            <LabelList
              dataKey={dataKey}
              position="top"
              style={{
                fill: "#2e5e4e",
                fontWeight: 600,
                fontSize: 14,
              }}
            />
          </Bar>
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4e796b" />
              <stop offset="100%" stopColor="#2e5e4e" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);

const TopPerformingBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/books/authored/summary",
          { credentials: "include" }
        );
        const json = await res.json();
        setBooks(json);
      } catch {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{
          mb: 6,
          color: "#4e796b",
          fontWeight: "bold",
          borderBottom: "4px solid #66b2a0",
          display: "inline-block",
          px: 3,
        }}
      >
        Top Performing Books
      </Typography>

      <ChartBlock data={books} dataKey="num_of_downloads" label="Downloads" />
      <ChartBlock data={books} dataKey="favourite_count" label="Favourites" />
      <ChartBlock data={books} dataKey="review_count" label="Reviews" />
    </Container>
  );
};

export default TopPerformingBooksPage;

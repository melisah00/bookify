import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ReviewStatsDialog = ({ open, onClose, book }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!book) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/books/${book.id}/review-stats`,
          {
            credentials: "include",
          }
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [book]);

  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "960px",
          maxWidth: "95vw",
          mx: "auto",
          my: 4,
          borderRadius: 3,
          bgcolor: "#f7fdfc",
          boxShadow: 6,
          p: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          color: "#4e796b",
          fontWeight: "bold",
          fontSize: "1.7rem",
        }}
      >
        Review Activity for:{" "}
        <span style={{ color: "#2e534a" }}>{book?.title}</span>
        <Typography variant="subtitle2" sx={{ mt: 1, color: "#666" }}>
          Total reviews: <strong>{totalReviews}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: "#66b2a0" }} />
          </Box>
        ) : data.length === 0 ? (
          <Box display="flex" justifyContent="center" py={6}>
            <Typography align="center" color="text.secondary">
              No review data available.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 50, bottom: 40, left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -10,
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Review Count",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f0f0f0", borderRadius: 6 }}
                  formatter={(value) => [`${value} reviews`, "Reviews"]}
                  labelFormatter={(label) => `📅 ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Review Count"
                  stroke="#66b2a0"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: "#2e534a", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewStatsDialog;

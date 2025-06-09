import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, Stack } from "@mui/material";
import { Group } from "@mui/icons-material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import DescriptionIcon from "@mui/icons-material/Description";
import EventIcon from "@mui/icons-material/Event";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
};

const cardStyle = {
  p: 3,
  borderRadius: 3,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  backgroundColor: "white",
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
  },
};

const iconStyle = {
  fontSize: 40,
  color: "#1976d2",
  p: 1,
  bgcolor: "rgba(25, 118, 210, 0.1)",
  borderRadius: "50%",
  mr: 2,
};

export default function AdminHomePage() {
  const [bookCount, setBookCount] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [authorCount, setAuthorCount] = useState(null);
  const [readerCount, setReaderCount] = useState(null);
  const [scriptCount, setScriptCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [chatChartData, setChatChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/users/admin/dashboard-metrics"
        );
        const data = await res.json();

        setBookCount(data.total_books);
        setUserCount(data.total_users);
        setAuthorCount(data.total_authors);
        setReaderCount(data.total_readers);
        setScriptCount(data.total_scripts);
        setEventCount(data.total_events);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    const fetchChart = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/users/admin/chat-activity"
        );
        const chatData = await res.json();

        setChatChartData({
          labels: chatData.map((item) => item.date),
          datasets: [
            {
              label: "Messages",
              data: chatData.map((item) => item.count),
              borderColor: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.2)",
              tension: 0.3,
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      }
    };

    fetchData();
    fetchChart();
  }, []);

  return (
    <Box sx={{ p: 3, height: "100vh", width: "100%", bgcolor: "#f8f9fa" }}>
      <Grid container spacing={3} sx={{ height: "100%" }}>
        <Grid
          size={8}
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Box sx={{ mb: 2 }}>
            <Stack spacing={2} direction="row" sx={{ height: "120px" }}>
              <Card
                sx={{
                  flex: 1,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: "white",
                  boxShadow: 3,
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <LibraryBooksIcon sx={iconStyle} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {bookCount !== null ? bookCount : "..."}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Total Books
                  </Typography>
                </Box>
              </Card>
              <Card
                sx={{
                  flex: 1,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: "white",
                  boxShadow: 3,
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CreditCardIcon sx={iconStyle} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {userCount !== null ? userCount : "..."}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Total Users
                  </Typography>
                </Box>
              </Card>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Card sx={{ ...cardStyle, p: 2, height: "100%" }}>
              <Box sx={{ height: "100%" }}>
                {chatChartData ? (
                  <Line data={chatChartData} options={options} />
                ) : (
                  <Typography>Loading chart...</Typography>
                )}
              </Box>
            </Card>
          </Box>
        </Grid>

        <Grid size={4}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <Card sx={cardStyle}>
              <Stack direction="row" alignItems="center">
                <EventIcon sx={iconStyle} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {eventCount ?? "..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Events
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card sx={cardStyle}>
              <Stack direction="row" alignItems="center">
                <DescriptionIcon sx={iconStyle} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {scriptCount ?? "..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Scripts
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card sx={cardStyle}>
              <Stack direction="row" alignItems="center">
                <Group sx={iconStyle} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {readerCount ?? "..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Readers
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card sx={cardStyle}>
              <Stack direction="row" alignItems="center">
                <Group sx={iconStyle} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {authorCount ?? "..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Authors
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

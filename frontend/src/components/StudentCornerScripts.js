// StudentCornerScripts.jsx

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Grid,
  Container,
  Box,
  Pagination,
  Button,
  TextField,
  Paper,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function StudentCornerScripts() {
  const [scripts, setScripts] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  const scriptsPerPage = 8;
  const totalPages = Math.ceil(scripts.length / scriptsPerPage);
  const currentScripts = scripts.slice(
    (currentPage - 1) * scriptsPerPage,
    currentPage * scriptsPerPage
  );

  const fetchScripts = async () => {
    try {
      const endpoint = view === "my" ? "/scripts/me" : "/scripts";
      const res = await fetch(`${API}${endpoint}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scripts.");
      const data = await res.json();
      setScripts(data);
    } catch (err) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this script?")) return;
    try {
      const res = await fetch(`${API}/scripts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed.");
      fetchScripts(); // refresh
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  useEffect(() => {
    if (view !== "upload") fetchScripts();
  }, [view]);

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
        Student Corner Scripts
      </Typography>

      <Box sx={{ display: "flex", gap: 3 }}>
        <Paper sx={{ width: 200, p: 2, bgcolor: "#f2f7f5" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Menu
          </Typography>
          <Button fullWidth onClick={() => setView("upload")} sx={{ mb: 1 }}>
            Upload Script
          </Button>
          <Button fullWidth onClick={() => setView("my")} sx={{ mb: 1 }}>
            My Scripts
          </Button>
          <Button fullWidth onClick={() => setView("all")} sx={{ mb: 1 }}>
            All Scripts
          </Button>
          <Button
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => (window.location.href = "/app/reader/student-corner")}
          >
            Go to Chat
          </Button>
        </Paper>

        <Box sx={{ flex: 1 }}>
          {view === "upload" ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Upload Script
              </Typography>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const file = formData.get("file");
                  if (!formData.get("name") || !formData.get("subject") || !file) {
                    alert("Please fill in all fields.");
                    return;
                  }

                  try {
                    const res = await fetch(`${API}/scripts/upload`, {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    });
                    if (!res.ok) throw new Error("Upload failed");
                    alert("Script uploaded successfully");
                    e.target.reset();
                  } catch (err) {
                    alert(err.message || "Error uploading.");
                  }
                }}
                encType="multipart/form-data"
              >
                <TextField label="Script Name" name="name" fullWidth sx={{ mb: 2 }} required />
                <TextField label="Subject" name="subject" fullWidth sx={{ mb: 2 }} required />
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  style={{ marginBottom: 16 }}
                />
                <Button variant="contained" type="submit">
                  Upload
                </Button>
              </form>
            </Box>
          ) : error ? (
            <Typography align="center" color="error">
              {error}
            </Typography>
          ) : scripts.length === 0 ? (
            <Typography align="center">No scripts available.</Typography>
          ) : (
            <>
              <Grid container spacing={4} justifyContent="center">
                {currentScripts.map((script) => (
                  <Grid item key={script.id} xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        maxWidth: 300,
                        height: 300,
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: 3,
                        borderRadius: 2,
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: "#66b2a0" }}>
                            {script.author_username?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                        }
                        title={script.name}
                        subheader={`Subject: ${script.subject}`}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                            mb: 1,
                          }}
                        >
                          <DescriptionIcon sx={{ fontSize: 20 }} />
                          <Typography variant="body2">
                            Author: {script.author_username}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2, justifyContent: "flex-end" }}>
                        {view === "my" ? (
                          <>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDelete(script.id)}
                              startIcon={<DeleteIcon />}
                            >
                              Delete
                            </Button>
                            <Button
                              size="small"
                              onClick={() => navigate(`/app/reader/student-corner/scripts/edit/${script.id}`)}
                              startIcon={<EditIcon />}
                            >
                              Edit
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadForOfflineIcon />}
                            href={`${API}/scripts/download/${script.id}`}
                            target="_blank"
                          >
                            Download
                          </Button>
                        )}
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
        </Box>
      </Box>
    </Container>
  );
}

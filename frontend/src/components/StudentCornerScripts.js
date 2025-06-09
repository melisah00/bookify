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
  Alert,
  CircularProgress,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function StudentCornerScripts() {
  const [scripts, setScripts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState("all");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const scriptsPerPage = 8;
  const totalPages = Math.ceil(scripts.length / scriptsPerPage);
  const currentScripts = scripts.slice(
    (currentPage - 1) * scriptsPerPage,
    currentPage * scriptsPerPage
  );

  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = view === "my" ? "/scripts/me" : "/scripts";
      const res = await fetch(`${API}${endpoint}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scripts.");
      const data = await res.json();
      setScripts(data);
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
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
      fetchScripts();
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

      {/* Menu */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            color: "#4e796b",
            mb: 1,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Quick Actions
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 1.5,
            border: "1px solid #d8eae5",
            borderRadius: 2,
            padding: 1.5,
            backgroundColor: "#f4fdfb",
          }}
        >
          {[
            { label: "Upload Script", value: "upload" },
            { label: "My Scripts", value: "my" },
            { label: "All Scripts", value: "all" },
          ].map((item) => (
            <Button
              key={item.value}
              variant={view === item.value ? "contained" : "outlined"}
              onClick={() => {
                setView(item.value);
                setUploadInfo("");
              }}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                px: 2.5,
                py: 1,
                minWidth: 130,
                backgroundColor: view === item.value ? "#4e796b" : "#fff",
                color: view === item.value ? "#fff" : "#4e796b",
                borderColor: "#4e796b",
                "&:hover": {
                  backgroundColor: view === item.value ? "#3f665b" : "#e9f3ef",
                  borderColor: "#4e796b",
                },
              }}
            >
              {item.label}
            </Button>
          ))}

          <Button
            onClick={() =>
              (window.location.href = "/app/reader/student-corner")
            }
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2.5,
              py: 1,
              minWidth: 130,
              color: "#4e796b",
              borderColor: "#4e796b",
              "&:hover": {
                backgroundColor: "#e9f3ef",
                borderColor: "#4e796b",
              },
            }}
          >
            Go to Chat
          </Button>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 1400 }}>
          {view === "upload" ? (
            <Card
              sx={{
                maxWidth: 600,
                mx: "auto",
                p: 4,
                borderRadius: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                backgroundColor: "#f9fdfc",
              }}
            >
              <Typography
                variant="h5"
                align="center"
                sx={{ mb: 3, fontWeight: 700, color: "#4e796b" }}
              >
                Upload New Script
              </Typography>

              {uploadInfo && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {uploadInfo}
                </Alert>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setUploadInfo("");

                  const formData = new FormData(e.target);
                  const file = formData.get("file");

                  if (
                    !formData.get("name") ||
                    !formData.get("subject") ||
                    !file
                  ) {
                    return;
                  }

                  try {
                    const res = await fetch(`${API}/scripts/upload`, {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    setUploadInfo("Script uploaded successfully");
                    e.target.reset();
                    setSelectedFileName("");

                    setTimeout(() => {
                      setView("all");
                      fetchScripts();
                      setUploadInfo("");
                    }, 1500);
                  } catch (err) {
                    console.error(err);
                    setUploadInfo("");
                  }
                }}
                encType="multipart/form-data"
              >
                <TextField
                  label="Script Name"
                  name="name"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Subject"
                  name="subject"
                  fullWidth
                  required
                  sx={{ mb: 3 }}
                />

                <Box
                  sx={{
                    border: "2px dashed #b2dcd2",
                    borderRadius: 2,
                    textAlign: "center",
                    py: 4,
                    px: 2,
                    color: "#4e796b",
                    cursor: "pointer",
                    mb: 3,
                    transition: "0.3s",
                    "&:hover": {
                      backgroundColor: "#eff9f7",
                    },
                  }}
                >
                  <Button
                    component="label"
                    variant="text"
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      color: "#4e796b",
                    }}
                  >
                    Click to select a PDF file
                    <input
                      type="file"
                      name="file"
                      accept="application/pdf"
                      hidden
                      required
                      onChange={(e) => {
                        setSelectedFileName(e.target.files?.[0]?.name || "");
                      }}
                    />
                  </Button>

                  <Typography variant="caption" display="block" mt={1}>
                    Only PDF files are supported
                  </Typography>

                  {selectedFileName && (
                    <Typography variant="body2" mt={2} sx={{ fontWeight: 500 }}>
                      Selected file: <em>{selectedFileName}</em>
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={uploading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.2,
                    backgroundColor: "#4e796b",
                    "&:hover": {
                      backgroundColor: "#3c6359",
                    },
                  }}
                >
                  {uploading ? "Uploading..." : "Upload Script"}
                </Button>
              </form>
            </Card>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Typography align="center" color="error">
              {error}
            </Typography>
          ) : scripts.length === 0 ? (
            <Typography align="center" sx={{ mt: 4 }}>
              No scripts available.
            </Typography>
          ) : (
            <>
              <Grid container spacing={4} justifyContent="center">
                {currentScripts.map((script) => (
                  <Grid item key={script.id} xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        height: 240,
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                        transition: "0.3s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                        },
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: "#66b2a0" }}>
                            {script.author_username?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                        }
                        title={
                          <Typography
                            variant="subtitle1"
                            noWrap
                            sx={{ fontWeight: 600, color: "#333" }}
                          >
                            {script.name}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="caption" sx={{ color: "#666" }}>
                            Subject: {script.subject}
                          </Typography>
                        }
                        sx={{ pb: 0 }}
                      />

                      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                        >
                          <DescriptionIcon sx={{ fontSize: 18 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            Author: {script.author_username}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions
                        sx={{
                          px: 2,
                          pb: 2,
                          pt: 0,
                          justifyContent:
                            view === "my" ? "space-between" : "center",
                        }}
                      >
                        {view === "my" ? (
                          <>
                            <Button
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/app/reader/student-corner/scripts/edit/${script.id}`
                                )
                              }
                              sx={{
                                color: "#4e796b",
                                textTransform: "none",
                                fontWeight: 500,
                              }}
                              startIcon={<EditIcon fontSize="small" />}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDelete(script.id)}
                              sx={{ textTransform: "none", fontWeight: 500 }}
                              startIcon={<DeleteIcon fontSize="small" />}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              textTransform: "none",
                              fontWeight: 500,
                              borderColor: "#4e796b",
                              color: "#4e796b",
                              "&:hover": {
                                backgroundColor: "#eaf6f3",
                                borderColor: "#4e796b",
                              },
                            }}
                            startIcon={
                              <DownloadForOfflineIcon fontSize="small" />
                            }
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

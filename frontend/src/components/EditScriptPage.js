import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Card,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function EditScriptPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [script, setScript] = useState(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetch(`${API}/scripts/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch script");
        return res.json();
      })
      .then((data) => {
        setScript(data);
        setName(data.name);
        setSubject(data.subject);
      })
      .catch(() => setError("Failed to load script"));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("subject", subject);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${API}/scripts/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update script");

      setSuccess("Script updated successfully");
      setTimeout(() => navigate("/app/reader/student-corner/scripts"), 1500);
    } catch (err) {
      setError(err.message || "Update failed.");
    }
  };

  if (!script) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography>Loading script...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 6 }}>
      <Card
        sx={{
          p: 4,
          maxWidth: 600,
          mx: "auto",
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
          Edit Script
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <TextField
            label="Script Name"
            fullWidth
            sx={{ mb: 2 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Subject"
            fullWidth
            sx={{ mb: 3 }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
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
              Click to select a new PDF (optional)
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setFileName(e.target.files?.[0]?.name || "");
                }}
              />
            </Button>

            <Typography variant="caption" display="block" mt={1}>
              Leave empty to keep the current file
            </Typography>

            {fileName && (
              <Typography variant="body2" mt={2} sx={{ fontWeight: 500 }}>
                Selected file: <em>{fileName}</em>
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
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
            Save Changes
          </Button>

          <Button
            variant="outlined"
            fullWidth
            sx={{
              mt: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#4e796b",
              color: "#4e796b",
              "&:hover": {
                backgroundColor: "#f0f7f4",
                borderColor: "#4e796b",
              },
            }}
            onClick={() => navigate("/app/reader/student-corner/scripts")}
          >
            Cancel
          </Button>
        </form>
      </Card>
    </Container>
  );
}

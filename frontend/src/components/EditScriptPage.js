// src/pages/EditScriptPage.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit Script
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

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
          sx={{ mb: 2 }}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Replace PDF file (optional)
          </Typography>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </Box>
        <Button type="submit" variant="contained">
          Save Changes
        </Button>
      </form>
    </Container>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
  successGreen: "rgb(78, 121, 107)",
};

const availableCategories = [
  { id: "fiction", name: "Fiction" },
  { id: "non_fiction", name: "Non-fiction" },
  { id: "science", name: "Science" },
  { id: "history", name: "History" },
  { id: "technology", name: "Technology" },
];

export default function BookUploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const isAuthor =
    user &&
    user.roles &&
    Array.isArray(user.roles) &&
    user.roles.some(
      (role) => role === "author" || (typeof role === "object" && role.name === "author")
    );

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file.");
        setFile(null);
        e.target.value = null;
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.");
        setFile(null);
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setSelectedCategories((prevCategories) =>
      checked
        ? [...prevCategories, value]
        : prevCategories.filter((category) => category !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError("Book title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Book description is required.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    if (!file) {
      setError("Please select a book file.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    selectedCategories.forEach(category => {
      formData.append("categories", category);
    });
    formData.append("book_file", file);

    try {
      const response = await fetch("http://localhost:8000/books/testZaUpload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Book upload failed.");
      }

      setSuccessMessage(`Book "${responseData.title}" uploaded successfully!`);
      setTitle("");
      setDescription("");
      setSelectedCategories([]);
      setFile(null);
      if (document.getElementById("book-file-input")) {
        document.getElementById("book-file-input").value = "";
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthor) {
    return (
      <Paper
        elevation={3}
        sx={{
          backgroundColor: colors.backgroundLight,
          padding: 4,
          borderRadius: 2,
          maxWidth: 600,
          margin: "40px auto",
          border: `1px solid ${colors.accentLight}`,
        }}
      >
        <Typography sx={{ color: colors.textDark }}>
          You don't have permission to add books. This feature is only available to authors.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: '#f8f9fa',
        padding: 4,
        borderRadius: 2,
        maxWidth: 600,
        margin: "40px auto",
        border: `1px solid ${colors.accentLight}`,
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        sx={{
          color: colors.textDark,
          textAlign: "center",
          mb: 3,
          pb: 1,
          borderBottom: `2px solid ${colors.accentMedium}`,
        }}
      >
        Add New Book
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Book Title */}
        <TextField
          label="Book Title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          disabled={isLoading}
          sx={{ mb: 3 }}
          InputProps={{
            style: {
              color: colors.textDark,
            },
          }}
          InputLabelProps={{
            style: {
              color: colors.textDark,
            },
          }}
        />

        {/* Book Description */}
        <TextField
          label="Book Description"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          required
          multiline
          rows={5}
          disabled={isLoading}
          sx={{ mb: 3 }}
          InputProps={{
            style: {
              color: colors.textDark,
            },
          }}
          InputLabelProps={{
            style: {
              color: colors.textDark,
            },
          }}
        />

        {/* Book Categories */}
        <Typography variant="subtitle1" sx={{ color: colors.textDark, mb: 1 }}>
          Book Categories:
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: `1px solid ${colors.accentLight}`,
            borderRadius: 1,
          }}
        >
          <FormGroup>
            {availableCategories.map((category) => (
              <FormControlLabel
                key={category.id}
                control={
                  <Checkbox
                    id={`category-${category.id}`}
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={handleCategoryChange}
                    disabled={isLoading}
                    sx={{
                      color: colors.accentMedium,
                      "&.Mui-checked": {
                        color: colors.accentMedium,
                      },
                    }}
                  />
                }
                label={category.name}
                sx={{ color: colors.textDark }}
              />
            ))}
          </FormGroup>
        </Paper>

        {/* Book File */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: colors.textDark,
              mb: 1,
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            Book File (PDF):
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              color: colors.textDark,
              borderColor: colors.accentMedium,
              backgroundColor: file ? colors.accentLight : 'transparent',
              "&:hover": {
                borderColor: colors.accentMedium,
                backgroundColor: file ? colors.accentLight : colors.backgroundMedium,
              },
              padding: '12px',
              textTransform: 'none',
              justifyContent: 'flex-start',
              textAlign: 'left',
              fontSize: '1rem'
            }}
          >
            {file ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <Typography sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: 1
                }}>
                  {file.name}
                </Typography>
                <Typography sx={{
                  color: colors.accentMedium,
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  Change File
                </Typography>
              </Box>
            ) : (
              'Select PDF File'
            )}
            <input
              type="file"
              id="book-file-input"
              onChange={handleFileChange}
              accept=".pdf"
              required
              hidden
              disabled={isLoading}
            />
          </Button>
          {file && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: colors.textDark,
                fontSize: '0.8rem'
              }}
            >
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          sx={{
            backgroundColor: colors.accentMedium,
            "&:hover": {
              backgroundColor: colors.accentMedium,
              opacity: 0.9,
            },
            height: "48px",
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Upload Book"
          )}
        </Button>
      </Box>
    </Paper>
  );
}
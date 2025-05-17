"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
  successGreen: "rgb(78, 121, 107)",
};

const styles = {
  container: {
    backgroundColor: colors.backgroundLight,
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    margin: "40px auto",
    border: `1px solid ${colors.accentLight}`,
  },
  heading: {
    fontSize: "1.8rem",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: "25px",
    borderBottom: `2px solid ${colors.accentMedium}`,
    paddingBottom: "10px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: colors.textDark,
    fontWeight: "bold",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: `1px solid ${colors.accentMedium}`,
    borderRadius: "4px",
    fontSize: "1rem",
    color: colors.textDark,
    boxSizing: "border-box",
  },
  textarea: { // Stil za opis
    width: "100%",
    padding: "12px",
    border: `1px solid ${colors.accentMedium}`,
    borderRadius: "4px",
    fontSize: "1rem",
    color: colors.textDark,
    boxSizing: "border-box",
    minHeight: "100px",
    resize: "vertical",
  },
  button: {
    backgroundColor: colors.accentMedium,
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: "4px",
    fontSize: "1.1rem",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
    fontWeight: "bold",
  },
  message: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "4px",
    textAlign: "center",
    fontWeight: "500",
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  success: {
    backgroundColor: colors.accentLight,
    color: colors.textDark,
    border: `1px solid ${colors.accentMedium}`,
  },
  checkboxGroup: { // Kontejner za sve checkboxove
    marginTop: '10px',
    marginBottom: '15px',
    padding: '10px',
    border: `1px solid ${colors.accentLight}`,
    borderRadius: '4px',
  },
  checkboxContainer: { // Za svaki checkbox + labelu
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
  },
  checkboxInput: {
    marginRight: "10px",
    cursor: "pointer",
    width: '18px',
    height: '18px',
    accentColor: colors.accentMedium, // Boja čeka
  },
  checkboxLabel: {
    color: colors.textDark,
    fontSize: "0.95rem",
    cursor: "pointer",
    userSelect: 'none',
  }
};

// Definišemo dostupne kategorije na osnovu CategoryEnum sa tvog backenda
const availableCategories = [
  { id: "fiction", name: "Fikcija" },
  { id: "non_fiction", name: "Publicistika" },
  { id: "science", name: "Nauka" },
  { id: "history", name: "Historija" },
  { id: "technology", name: "Tehnologija" },
];

export default function BookUploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // Novo stanje za opis
  const [selectedCategories, setSelectedCategories] = useState([]); // Novo stanje za kategorije
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
        setError("Molimo odaberite PDF fajl.");
        setFile(null);
        e.target.value = null;
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Fajl je prevelik. Maksimalna veličina je 10MB.");
        setFile(null);
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // Handler za promjenu selektovanih kategorija
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
      setError("Naslov knjige je obavezan.");
      return;
    }
    if (!description.trim()) { // Provjera za opis
        setError("Opis knjige je obavezan.");
        return;
    }
    if (selectedCategories.length === 0) { // Provjera za kategorije
        setError("Molimo odaberite barem jednu kategoriju.");
        return;
    }
    if (!file) {
      setError("Molimo odaberite fajl knjige.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description); // Dodajemo opis
    selectedCategories.forEach(category => { // Dodajemo svaku kategoriju
        formData.append("categories", category);
    });
    formData.append("book_file", file);
    // author_id se više ne šalje eksplicitno sa frontenda ako se oslanjate na token/sesiju na backendu
    // Ako je i dalje potrebno: formData.append("author_id", user?.id);
    // Međutim, tvoj backend endpoint /testZaUpload već koristi current_user: dict = Depends(get_current_user)
    // pa author_id treba da se dobije iz current_user na backendu.

    try {
      const response = await fetch("http://localhost:8000/books/testZaUpload", {
        method: "POST",
        body: formData,
        credentials: "include", // Važno za slanje kolačića/autorizacije
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Neuspješan upload knjige.");
      }

      setSuccessMessage(`Knjiga "${responseData.title}" je uspješno uploadovana!`);
      setTitle("");
      setDescription(""); // Resetuj opis
      setSelectedCategories([]); // Resetuj kategorije
      setFile(null);
      if (document.getElementById("book-file-input")) {
        document.getElementById("book-file-input").value = "";
      }
    } catch (err) {
      setError(err.message || "Došlo je do greške.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthor) {
    return (
      <div style={styles.container}>
        <p style={{ ...styles.message, color: colors.textDark }}>
          Nemate ovlaštenje za dodavanje knjiga. Ova funkcionalnost je dostupna samo autorima.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Dodaj Novu Knjigu</h2>
      {error && <p style={{ ...styles.message, ...styles.error }}>{error}</p>}
      {successMessage && <p style={{ ...styles.message, ...styles.success }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        {/* Naslov Knjige */}
        <div style={styles.formGroup}>
          <label htmlFor="title" style={styles.label}>
            Naslov Knjige:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="Unesite naslov knjige"
            required
            disabled={isLoading}
          />
        </div>

        {/* Opis Knjige */}
        <div style={styles.formGroup}>
            <label htmlFor="description" style={styles.label}>
                Opis Knjige:
            </label>
            <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Unesite opis knjige"
                rows={5}
                required
                disabled={isLoading}
            />
        </div>

        {/* Kategorije Knjige */}
        <div style={styles.formGroup}>
            <label style={styles.label}>Kategorije Knjige:</label>
            <div style={styles.checkboxGroup}>
                {availableCategories.map((category) => (
                    <div key={category.id} style={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            value={category.id}
                            checked={selectedCategories.includes(category.id)}
                            onChange={handleCategoryChange}
                            style={styles.checkboxInput}
                            disabled={isLoading}
                        />
                        <label htmlFor={`category-${category.id}`} style={styles.checkboxLabel}>
                            {category.name}
                        </label>
                    </div>
                ))}
            </div>
        </div>

        {/* Fajl Knjige */}
        <div style={styles.formGroup}>
          <label htmlFor="book-file-input" style={styles.label}>
            Fajl Knjige (PDF):
          </label>
          <input
            type="file"
            id="book-file-input"
            onChange={handleFileChange}
            style={styles.input}
            accept=".pdf"
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? "Uploadovanje..." : "Uploaduj Knjigu"}
        </button>
      </form>
    </div>
  );
}
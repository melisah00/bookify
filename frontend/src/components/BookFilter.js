import { useState, useEffect } from "react";

function BookFilter({ onResults }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => setGenres(data))
      .catch(() => setGenres([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    selectedGenres.forEach((g) => params.append("genre", g));
    if (author) params.append("author", author);
    if (keywords) params.append("keywords", keywords);
    if (sortBy) params.append("sort", sortBy);
    if (sortDir) params.append("direction", sortDir);

    const res = await fetch(
      params.toString()
        ? `http://localhost:8000/books?${params}`
        : `http://localhost:8000/books`
    );
    const data = await res.json();
    onResults(data);
  };

  const handleReset = async () => {
    setSelectedGenres([]);
    setAuthor("");
    setKeywords("");
    setSortBy("");
    setSortDir("asc");
    const res = await fetch("http://localhost:8000/books");
    const data = await res.json();
    onResults(data);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.group}>
        <div style={styles.dropdownContainer}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            style={styles.dropdownToggle}
          >
            Genres ▼
          </button>
          {showDropdown && (
            <div style={styles.dropdown}>
              {genres.map((g) => (
                <label key={g} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    value={g}
                    checked={selectedGenres.includes(g)}
                    onChange={(e) =>
                      setSelectedGenres((prev) =>
                        e.target.checked
                          ? [...prev, g]
                          : prev.filter((cat) => cat !== g)
                      )
                    }
                  />
                  {g.charAt(0).toUpperCase() + g.slice(1).replace(/_/g, " ")}
                </label>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          style={styles.input}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.input}
        >
          <option value="">Sort by</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="downloads">Downloads</option>
        </select>
        <button
          type="button"
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          style={styles.button}
        >
          {sortDir === "asc" ? "▲" : "▼"}
        </button>
        <button type="submit" style={styles.button}>
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{ ...styles.button, backgroundColor: "#ccc" }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    margin: "30px auto",
    padding: 0,
    backgroundColor: "transparent",
    display: "flex",
    justifyContent: "center",
  },
  group: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    maxWidth: "1200px",
    width: "100%",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    minWidth: "160px",
    fontSize: "14px",
  },
  button: {
    padding: "8px 14px",
    backgroundColor: "#669999",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdownToggle: {
    padding: "8px 12px",
    backgroundColor: "#a7d7b8",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "10px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    minWidth: "200px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    marginBottom: "8px",
    gap: "6px",
    fontSize: "14px",
  },
};

export default BookFilter;

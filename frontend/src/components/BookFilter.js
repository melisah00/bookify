import { useState, useEffect } from "react";

function BookFilter({ onResults, baseBooks = null }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => setGenres(data))
      .catch(() => setGenres([]));
  }, []);

  const enrichWithRatings = async (books) => {
    const enriched = await Promise.all(
      books.map(async (book) => {
        try {
          const res = await fetch(
            `http://localhost:8000/books/${book.id}/average-rating`
          );
          const data = await res.json();
          return {
            ...book,
            average_rating: data.average_rating,
            reviewCount: data.review_count || 0,
          };
        } catch {
          return { ...book, average_rating: null, reviewCount: 0 };
        }
      })
    );
    return enriched;
  };

  const sortBooks = (books) => {
    if (!sortBy) return books;

    return [...books].sort((a, b) => {
      if (sortBy === "rating") {
        const aRating = a.average_rating ?? 0;
        const bRating = b.average_rating ?? 0;
        return sortDir === "asc" ? aRating - bRating : bRating - aRating;
      }

      if (sortBy === "downloads") {
        const aVal = a.num_of_downloads ?? 0;
        const bVal = b.num_of_downloads ?? 0;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const valA = (a[sortBy] ?? "").toString().toLowerCase();
      const valB = (b[sortBy] ?? "").toString().toLowerCase();
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (baseBooks) {
      let filtered = [...baseBooks];

      if (selectedGenres.length > 0) {
        filtered = filtered.filter((book) =>
          selectedGenres.includes(book.genre)
        );
      }

      if (author) {
        filtered = filtered.filter(
          (book) =>
            book.author?.username &&
            book.author.username.toLowerCase().includes(author.toLowerCase())
        );
      }

      if (keywords) {
        filtered = filtered.filter((book) =>
          book.title?.toLowerCase().includes(keywords.toLowerCase())
        );
      }

      if (minRating) {
        filtered = filtered.filter(
          (book) =>
            book.average_rating != null &&
            book.average_rating >= parseFloat(minRating)
        );
      }

      const enriched = await enrichWithRatings(filtered);
      const sorted = sortBooks(enriched);
      onResults(sorted);
    } else {
      const params = new URLSearchParams();
      selectedGenres.forEach((g) => params.append("genre", g));
      if (author) params.append("author", author);
      if (keywords) params.append("keywords", keywords);
      if (sortBy && sortBy !== "rating") params.append("sort", sortBy);
      if (sortDir) params.append("direction", sortDir);

      const res = await fetch(
        params.toString()
          ? `http://localhost:8000/books?${params}`
          : `http://localhost:8000/books`
      );
      const data = await res.json();
      const enriched = await enrichWithRatings(data);

      let filtered = enriched;
      if (minRating) {
        filtered = filtered.filter(
          (book) =>
            book.average_rating != null &&
            book.average_rating >= parseFloat(minRating)
        );
      }

      const sorted = sortBooks(filtered);
      onResults(sorted);
    }
  };

  const handleReset = async () => {
    setSelectedGenres([]);
    setAuthor("");
    setKeywords("");
    setMinRating("");
    setSortBy("");
    setSortDir("asc");

    if (baseBooks) {
      const enriched = await enrichWithRatings(baseBooks);
      onResults(enriched);
    } else {
      const res = await fetch("http://localhost:8000/books");
      const data = await res.json();
      const enriched = await enrichWithRatings(data);
      onResults(enriched);
    }
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
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          style={styles.input}
        >
          <option value="">Min Rating</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}+
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.input}
        >
          <option value="">Sort by</option>
          <option value="title">Title</option>
          <option value="downloads">Downloads</option>
          <option value="rating">Rating</option>
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
    gap: "10px",
    maxWidth: "1200px",
    width: "100%",
  },
  input: {
    padding: "6px 10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    minWidth: "140px",
    fontSize: "14px",
  },
  button: {
    padding: "6px 12px",
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
    padding: "6px 10px",
    backgroundColor: "#a7d7b8",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
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
    marginBottom: "7px",
    gap: "6px",
    fontSize: "14px",
  },
};

export default BookFilter;

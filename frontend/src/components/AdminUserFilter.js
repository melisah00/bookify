import React, { useState, useEffect } from "react";

function AdminUserFilter({
  onSubmit,
  initialFilters = { username: "", email: "", roles: [] },
}) {
  const [username, setUsername] = useState(initialFilters.username);
  const [email, setEmail] = useState(initialFilters.email);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(initialFilters.roles);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/users/roles", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        let rolesArr = [];
        if (Array.isArray(data)) rolesArr = data;
        else if (Array.isArray(data.roles)) rolesArr = data.roles;
        else {
          rolesArr = [];
          console.error("Invalid roles data:", data);
        }

        // Order roles explicitly
        const desiredOrder = [
          "admin",
          "author",
          "reader",
          "forum_admin",
          "forum_moderator",
        ];
        rolesArr.sort(
          (a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
        );

        setRoles(rolesArr);
      })
      .catch((err) => {
        setRoles([]);
        console.error("Failed to fetch roles", err);
      });
  }, []);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleReset = () => {
    setUsername("");
    setEmail("");
    setSelectedRoles([]);
    onSubmit({ username: "", email: "", roles: [] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ username, email, roles: selectedRoles });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.group}>
        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        {/* Email */}
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        {/* Roles Dropdown */}
        <div style={styles.dropdownContainer}>
          <button
            type="button"
            style={styles.dropdownToggle}
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
          >
            <span style={{ flexGrow: 1 }}>
              Roles{" "}
              {selectedRoles.length > 0 ? `(${selectedRoles.length})` : ""}
            </span>
            <span style={{ marginLeft: "auto" }}>▼</span>
          </button>
          {showRoleDropdown && (
            <div style={styles.dropdown}>
              {roles.map((role) => (
                <label key={role} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role.charAt(0).toUpperCase() +
                    role.slice(1).replace(/_/g, " ")}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" style={styles.button}>
          Search
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          style={{ ...styles.button, backgroundColor: "#ccc", color: "#444" }}
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
    maxWidth: "900px",
    width: "100%",
  },
  input: {
    padding: "6px 10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    minWidth: "180px",
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
    minWidth: "80px",
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
    minWidth: "160px",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    minWidth: "220px",
    maxHeight: "220px",
    overflowY: "auto",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    marginBottom: "6px",
  },
};

export default AdminUserFilter;

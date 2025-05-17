// AppHeader.js
"use client";

import React from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton"; // Prilagodite putanju
import { useAuth } from "../contexts/AuthContext"; // Prilagodite putanju

const headerStyles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",        // Unutrašnji padding headera
    backgroundColor: "#66b2a0",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    width: "100%",               // Da zauzme punu širinu
    position: "fixed",           // Fiksira header na vrhu viewporta
    top: 0,                      // Pozicionira ga na sam vrh
    left: 0,                     // Pozicionira ga na samu levu ivicu
    zIndex: 1000,                // Osigurava da je header iznad drugog sadržaja
    boxSizing: "border-box",     // Važno! Padding neće dodavati na ukupnu širinu od 100%
  },
  navLinksContainer: {
    display: "flex",
    justifyContent: "center",
    flexGrow: 1,
  },
  navLinks: {
    display: "flex",
    gap: "30px",
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    fontSize: "1.1rem",
    fontWeight: "bold",
    borderBottom: "2px solid transparent",
    paddingBottom: "2px",
    transition: "border-bottom 0.2s",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    minWidth: "120px",
    justifyContent: "flex-end",
  },
  placeholderLeft: {
    minWidth: "120px",
  },
};

export default function AppHeader() {
  const { user } = useAuth();
  const isUserDefinitelyAuthor =
    user &&
    user.roles &&
    Array.isArray(user.roles) &&
    user.roles.includes('author');

  return (
    <nav style={headerStyles.navbar}>
      <div style={headerStyles.placeholderLeft} />
      <div style={headerStyles.navLinksContainer}>
        <div style={headerStyles.navLinks}>
          <Link
            to="/app"
            style={headerStyles.navLink}
            onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
            onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
          >
            Home
          </Link>
          <Link
            to="/app/books"
            style={headerStyles.navLink}
            onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
            onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
          >
            All Books
          </Link>
          {isUserDefinitelyAuthor && (
            <Link
              to="/app/upload"
              style={headerStyles.navLink}
              onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              Upload Knjige
            </Link>
          )}
        </div>
      </div>
      <div style={headerStyles.navActions}>
        <LogoutButton />
      </div>
    </nav>
  );
}
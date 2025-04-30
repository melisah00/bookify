import React from "react";
import { useNavigate } from "react-router-dom";
import bookImage from "../assets/images/Book.png";


const palette = {
  lightest: '#F8F6F1',
  light: '#E1EAE5',
  mint: '#D0EFCF',
  medium: '#66B2A0',
  dark: '#21583B',
};

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: palette.light, fontFamily: 'Lora, serif' }}>

      <nav className="navbar navbar-expand py-4 px-5" style={{ backgroundColor: palette.light }}>
        <div className="container d-flex justify-content-between align-items-center">
          <h1 style={{ color: palette.dark, fontWeight: 'bold', fontSize: '4rem', marginLeft: '20px' }}>
            BOOKIFY
          </h1>
          <button
            className="btn btn-lg"
            onClick={handleLoginRedirect}
            style={{
              backgroundColor: palette.light,
              borderColor: palette.light,
              color: palette.dark,
              fontSize: '30px',
              fontWeight: 'bold',
            }}
          >
            LOG IN
          </button>
        </div>
      </nav>

      <div className="container flex-grow-1 d-flex align-items-start justify-content-center py-3">
        <div className="row w-100 align-items-start">

          <div className="col-md-6 d-flex justify-content-center">
            <div className="text-center text-md-start px-3 mt-5">
              <h1
                className="display-5 fw-bold mb-3"
                style={{ color: palette.dark }}
              >
                Empower Your Reading Journey
              </h1>
              <p
                className="lead mb-4"
                style={{ color: palette.dark }}
              >
                Welcome to Bookify — your ultimate companion in the world of books. Discover new books tailored to your interests, explore curated recommendations, and never miss your next favorite read.
                Join a vibrant community, share reviews, and celebrate the joy of reading together.
              </p>
              <button
                className="btn btn-lg"
                onClick={handleRegisterRedirect}
                style={{
                  backgroundColor: palette.dark,
                  borderColor: palette.dark,
                  color: '#fff'
                }}
              >
                Get Started
              </button>
            </div>
          </div>


          <div className="col-md-6 d-flex flex-column align-items-center mt-4">
            <img
              src={bookImage}
              alt="Book icon"
              className="img-fluid mb-5"
              style={{ maxWidth: '320px' }}
            />
            <h2
              className="h2 mb-0"
              style={{ color: palette.dark }}
            >
              Discover. Read. Grow.
            </h2>
          </div>
        </div>
      </div>


      <footer
        className="text-center py-4"
        style={{ backgroundColor: palette.light, color: palette.dark }}
      >
        <small>© 2025 Bookify. All rights reserved.</small>
      </footer>
    </div>

  );
};

export default LandingPage;

import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login"); 
  };

  const handleRegisterRedirect = () => {
    navigate("/register"); 
  }

  return (
    <div>
      <h1>Welcome to Landing Page</h1>
      <button onClick={handleLoginRedirect}>
        Login
      </button>
      <button onClick={handleRegisterRedirect}>
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;

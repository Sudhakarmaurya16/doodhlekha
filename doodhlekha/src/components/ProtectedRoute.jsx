import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/Auth/AuthLoading.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // =====================================================
  // AUTH CHECK LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-loading-icon">🥛</div>

          <div className="auth-spinner"></div>

          <h2>DOODHLEKHA</h2>

          <p>Account verify हो रहा है...</p>

          <small>Please wait...</small>
        </div>
      </div>
    );
  }

  // =====================================================
  // USER NOT LOGGED IN
  // =====================================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // =====================================================
  // USER LOGGED IN
  // =====================================================

  return children;
};

export default ProtectedRoute;

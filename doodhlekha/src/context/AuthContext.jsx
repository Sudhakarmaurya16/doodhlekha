import React, { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

// ============================================================
// STORAGE KEYS
// ============================================================

const TOKEN_KEY = "doodhlekha_token";
const USER_KEY = "doodhlekha_user";

// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // LOAD SAVED LOGIN
  // ==========================================================

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      // ------------------------------------------------------
      // TOKEN नहीं है
      // ------------------------------------------------------

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // ----------------------------------------------------
        // PROFILE API
        //
        // Token manually भेज रहे हैं
        // ----------------------------------------------------

        const response = await api.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        if (response.data?.success) {
          const loggedInUser = response.data.data || response.data.user;

          setUser(loggedInUser);

          localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error("Load User Error:", error?.response?.data || error);

        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ==========================================================
  // CLEAR AUTH
  // ==========================================================

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
  };

  // ==========================================================
  // LOGIN
  //
  // Supports:
  //
  // login({
  //   email,
  //   password
  // })
  //
  // OR
  //
  // login({
  //   phone,
  //   password
  // })
  // ==========================================================

  const login = async (credentials) => {
    try {
      // ------------------------------------------------------
      // SAFETY CHECK
      // ------------------------------------------------------

      if (!credentials || typeof credentials !== "object") {
        throw new Error("Invalid login credentials");
      }

      // ------------------------------------------------------
      // GET VALUES
      // ------------------------------------------------------

      let { phone, email, password } = credentials;

      // ------------------------------------------------------
      // NORMALIZE PHONE
      // ------------------------------------------------------

      phone = phone !== undefined && phone !== null ? String(phone).trim() : "";

      // ------------------------------------------------------
      // NORMALIZE EMAIL
      // ------------------------------------------------------

      email =
        email !== undefined && email !== null
          ? String(email).trim().toLowerCase()
          : "";

      // ------------------------------------------------------
      // PASSWORD
      // ------------------------------------------------------

      password =
        password !== undefined && password !== null ? String(password) : "";

      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (!phone && !email) {
        throw new Error("कृपया email या mobile number दर्ज करें।");
      }

      if (!password) {
        throw new Error("कृपया password दर्ज करें।");
      }

      // ------------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------------

      const payload = {
        password,
      };

      // केवल वही field भेजें जो मौजूद है
      if (email) {
        payload.email = email;
      } else if (phone) {
        payload.phone = phone;
      }

      console.log("LOGIN PAYLOAD:", {
        ...payload,
        password: "********",
      });

      // ------------------------------------------------------
      // LOGIN API
      // ------------------------------------------------------

      const response = await api.post("/auth/login", payload);

      console.log("LOGIN RESPONSE:", response.data);

      // ------------------------------------------------------
      // API SUCCESS CHECK
      // ------------------------------------------------------

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Login failed");
      }

      // ------------------------------------------------------
      // GET TOKEN + USER
      // ------------------------------------------------------

      const { token, user: loggedInUser } = response.data;

      // ------------------------------------------------------
      // TOKEN CHECK
      // ------------------------------------------------------

      if (!token) {
        throw new Error("Login successful but authentication token नहीं मिला।");
      }

      // ------------------------------------------------------
      // USER CHECK
      // ------------------------------------------------------

      if (!loggedInUser) {
        throw new Error("Login successful but user data नहीं मिला।");
      }

      // ------------------------------------------------------
      // SAVE TOKEN
      // ------------------------------------------------------

      localStorage.setItem(TOKEN_KEY, token);

      // ------------------------------------------------------
      // SAVE USER
      // ------------------------------------------------------

      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

      // ------------------------------------------------------
      // UPDATE CONTEXT
      // ------------------------------------------------------

      setUser(loggedInUser);

      // ------------------------------------------------------
      // RETURN RESPONSE
      // ------------------------------------------------------

      return response.data;
    } catch (error) {
      console.error("Login Error:", error?.response?.data || error);

      // Axios error को preserve करें
      throw error;
    }
  };

  // ==========================================================
  // REGISTER
  // ==========================================================

  const register = async (userData) => {
    try {
      // ------------------------------------------------------
      // REGISTER API
      // ------------------------------------------------------

      const response = await api.post("/auth/register", userData);

      // ------------------------------------------------------
      // SUCCESS CHECK
      // ------------------------------------------------------

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Registration failed");
      }

      // ------------------------------------------------------
      // TOKEN + USER
      // ------------------------------------------------------

      const { token, user: registeredUser } = response.data;

      if (!token) {
        throw new Error("Registration successful but token नहीं मिला।");
      }

      // ------------------------------------------------------
      // SAVE TOKEN
      // ------------------------------------------------------

      localStorage.setItem(TOKEN_KEY, token);

      // ------------------------------------------------------
      // SAVE USER
      // ------------------------------------------------------

      localStorage.setItem(USER_KEY, JSON.stringify(registeredUser));

      // ------------------------------------------------------
      // CONTEXT
      // ------------------------------------------------------

      setUser(registeredUser);

      return response.data;
    } catch (error) {
      console.error("Register Error:", error?.response?.data || error);

      throw error;
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      // ------------------------------------------------------
      // BACKEND LOGOUT
      // ------------------------------------------------------

      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }
    } catch (error) {
      console.error("Logout Error:", error?.response?.data || error);
    } finally {
      // ------------------------------------------------------
      // ALWAYS CLEAR LOCAL AUTH
      // ------------------------------------------------------

      clearAuth();
    }
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    loading,

    isAuthenticated: Boolean(user),

    login,
    register,
    logout,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================
// CUSTOM HOOK
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default AuthContext;

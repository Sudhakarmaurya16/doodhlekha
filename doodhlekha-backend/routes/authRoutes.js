const express = require("express");

const {
  register,
  login,
  getProfile,
  logout,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// PUBLIC AUTH ROUTES
// ============================================================

/*
  POST /api/auth/register
*/

router.post("/register", register);

/*
  POST /api/auth/login
*/

router.post("/login", login);

// ============================================================
// PROTECTED AUTH ROUTES
// ============================================================

/*
  GET /api/auth/profile

  Login token required.
*/

router.get("/profile", authMiddleware, getProfile);

/*
  POST /api/auth/logout

  Login token required.
*/

router.post("/logout", authMiddleware, logout);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;

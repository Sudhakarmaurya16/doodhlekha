const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const authMiddleware = (req, res, next) => {
  try {
    // ========================================================
    // JWT SECRET CHECK
    // ========================================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    // ========================================================
    // GET AUTHORIZATION HEADER
    // ========================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // ========================================================
    // BEARER CHECK
    // ========================================================

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    // ========================================================
    // GET TOKEN
    // ========================================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing.",
      });
    }

    // ========================================================
    // VERIFY TOKEN
    // ========================================================

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ========================================================
    // CHECK USER ID
    // ========================================================

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ========================================================
    // VALIDATE MONGODB USER ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication ID.",
      });
    }

    // ========================================================
    // ATTACH USER
    // ========================================================

    req.user = {
      id: decoded.id,
      role: decoded.role || "farmer",
    };

    // ========================================================
    // NEXT
    // ========================================================

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    // ========================================================
    // TOKEN EXPIRED
    // ========================================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // ========================================================
    // INVALID TOKEN
    // ========================================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ========================================================
    // OTHER ERROR
    // ========================================================

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = authMiddleware;

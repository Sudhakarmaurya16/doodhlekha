const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getSaleMilk,
  getTodayMilk,
} = require("../controllers/saleMilkController");

const router = express.Router();

// ============================================================
// AUTH
// ============================================================

router.use(authMiddleware);

// ============================================================
// TODAY
// GET /api/sale-milk/today
// ============================================================

router.get("/today", getTodayMilk);

// ============================================================
// HISTORY
// GET /api/sale-milk
// ============================================================

router.get("/", getSaleMilk);

module.exports = router;

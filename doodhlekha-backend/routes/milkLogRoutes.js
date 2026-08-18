const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMilkLog,
  getMilkLogs,
  getMilkLogById,
  updateMilkLog,
  deleteMilkLog,
  getTodayMilk,
  getMilkSummary,
} = require("../controllers/milkLogController");

const router = express.Router();

// =====================================================
// ALL MILK LOG ROUTES REQUIRE LOGIN
// =====================================================

router.use(authMiddleware);

// =====================================================
// TODAY
// IMPORTANT: /today BEFORE /:id
// =====================================================

router.get("/today", getTodayMilk);

// =====================================================
// SUMMARY
// =====================================================

router.get("/summary", getMilkSummary);

// =====================================================
// ALL LOGS
// =====================================================

router.get("/", getMilkLogs);

// =====================================================
// CREATE
// =====================================================

router.post("/", createMilkLog);

// =====================================================
// SINGLE LOG
// =====================================================

router.get("/:id", getMilkLogById);

// =====================================================
// UPDATE
// =====================================================

router.put("/:id", updateMilkLog);

// =====================================================
// DELETE
// =====================================================

router.delete("/:id", deleteMilkLog);

module.exports = router;

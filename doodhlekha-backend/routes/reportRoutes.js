const express = require("express");

const { getReportSummary } = require("../controllers/reportController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ALL REPORT ROUTES REQUIRE LOGIN
// ============================================================

router.use(authMiddleware);

// ============================================================
// GET REPORT
// ============================================================
//
// GET /api/reports/summary
//
// Example:
//
// /api/reports/summary
//
// /api/reports/summary?startDate=2026-08-01&endDate=2026-08-17
//
// ============================================================

router.get("/summary", getReportSummary);

module.exports = router;

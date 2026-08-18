const express = require("express");

const {
  saveCustomerMilk,
  getCustomerMilkLogs,
  getTodayCustomerMilk,
  getCustomerMonthlySummary,
  deleteCustomerMilk,
} = require("../controllers/customerMilkController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// AUTH
// ============================================================

router.use(authMiddleware);

// ============================================================
// IMPORTANT ROUTE ORDER
// Specific routes पहले
// ============================================================

router.get("/:customerId/today", getTodayCustomerMilk);

router.get("/:customerId/monthly-summary", getCustomerMonthlySummary);

router.delete("/log/:id", deleteCustomerMilk);

// ============================================================
// HISTORY
// ============================================================

router.get("/:customerId", getCustomerMilkLogs);

// ============================================================
// ADD / UPDATE
// ============================================================

router.post("/:customerId", saveCustomerMilk);

module.exports = router;

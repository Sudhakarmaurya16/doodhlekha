const express = require("express");

const {
  addPayment,
  getCustomerPayments,
  cancelPayment,
} = require("../controllers/customerPaymentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// AUTH
// ============================================================

router.use(authMiddleware);

// ============================================================
// IMPORTANT:
// Specific DELETE route पहले
// ============================================================

router.delete("/payment/:paymentId", cancelPayment);

// ============================================================
// ADD PAYMENT
// ============================================================

router.post("/:customerId", addPayment);

// ============================================================
// PAYMENT HISTORY
// ============================================================

router.get("/:customerId", getCustomerPayments);

module.exports = router;

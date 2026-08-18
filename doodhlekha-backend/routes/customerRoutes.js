const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ALL CUSTOMER ROUTES REQUIRE LOGIN
// ============================================================

router.use(authMiddleware);

// ============================================================
// CREATE CUSTOMER
// POST /api/customers
// ============================================================

router.post("/", createCustomer);

// ============================================================
// GET ALL CURRENT FARMER CUSTOMERS
// GET /api/customers
// ============================================================

router.get("/", getCustomers);

// ============================================================
// GET SINGLE CURRENT FARMER CUSTOMER
// GET /api/customers/:id
// ============================================================

router.get("/:id", getCustomerById);

// ============================================================
// UPDATE CURRENT FARMER CUSTOMER
// PUT /api/customers/:id
// ============================================================

router.put("/:id", updateCustomer);

// ============================================================
// DEACTIVATE CURRENT FARMER CUSTOMER
// DELETE /api/customers/:id
// ============================================================

router.delete("/:id", deleteCustomer);

module.exports = router;

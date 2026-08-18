const express = require("express");

const {
  createCow,
  getCows,
  getCowById,
  updateCow,
  deleteCow,
} = require("../controllers/cowController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ALL COW ROUTES REQUIRE LOGIN
// ============================================================

router.use(authMiddleware);

// ============================================================
// CREATE
// POST /api/cows
// ============================================================

router.post("/", createCow);

// ============================================================
// GET ALL
// GET /api/cows
// ============================================================

router.get("/", getCows);

// ============================================================
// GET SINGLE
// GET /api/cows/:id
// ============================================================

router.get("/:id", getCowById);

// ============================================================
// UPDATE
// PUT /api/cows/:id
// ============================================================

router.put("/:id", updateCow);

// ============================================================
// DELETE
// DELETE /api/cows/:id
// ============================================================

router.delete("/:id", deleteCow);

module.exports = router;

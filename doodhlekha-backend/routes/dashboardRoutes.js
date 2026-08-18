// const express = require("express");

// const authMiddleware = require("../middleware/authMiddleware");
// const { getDashboard } = require("../controllers/dashboardController");

// const router = express.Router();

// // ============================================================
// // ALL DASHBOARD ROUTES REQUIRE LOGIN
// // ============================================================

// router.use(authMiddleware);

// // ============================================================
// // GET DASHBOARD
// // GET /api/dashboard
// // ============================================================

// router.get("/", getDashboard);

// module.exports = router;

const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();

// ============================================================
// ALL DASHBOARD ROUTES REQUIRE LOGIN
// ============================================================

router.use(authMiddleware);

// ============================================================
// GET DASHBOARD
// GET /api/dashboard
// ============================================================

router.get("/", getDashboard);

module.exports = router;

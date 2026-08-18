const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const cowRoutes = require("./routes/cowRoutes");
const milkLogRoutes = require("./routes/milkLogRoutes");
const saleMilkRoutes = require("./routes/saleMilkRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerMilkRoutes = require("./routes/customerMilkRoutes");
const customerPaymentRoutes = require("./routes/customerPaymentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://doodhlekha.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // e.g. Postman / server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);

      return callback(
        new Error(`CORS not allowed for origin: ${origin}`),
        false,
      );
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DOODHLEKHA API is running 🚜🥛",
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/cows", cowRoutes);

app.use("/api/milk-logs", milkLogRoutes);

app.use("/api/sale-milk", saleMilkRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/customer-milk", customerMilkRoutes);

app.use("/api/customer-payments", customerPaymentRoutes);

app.use("/api/reports", reportRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  console.log("404 ROUTE:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("GLOBAL ERROR:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("==========================================");
  console.log("DOODHLEKHA SERVER RUNNING");
  console.log(`PORT: ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log("==========================================");
});

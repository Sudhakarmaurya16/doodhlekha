const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    // =====================================================
    // OWNER / FARMER
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // CUSTOMER CODE
    // =====================================================

    customerCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    // =====================================================
    // BASIC DETAILS
    // =====================================================

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      required: [true, "Customer phone number is required"],
      trim: true,
      maxlength: 20,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    // =====================================================
    // ADDRESS
    // =====================================================

    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    village: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    // =====================================================
    // CUSTOMER TYPE
    // =====================================================

    customerType: {
      type: String,
      enum: ["home", "shop", "hotel", "restaurant", "other"],
      default: "home",
    },

    // =====================================================
    // MILK TYPE
    // =====================================================

    milkType: {
      type: String,
      enum: ["cow", "buffalo", "mixed"],
      default: "cow",
    },

    // =====================================================
    // DEFAULT MILK RATE
    // =====================================================

    defaultRate: {
      type: Number,
      min: [0, "Rate cannot be negative"],
      default: 0,
    },

    // =====================================================
    // JOINING DATE
    // =====================================================

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    // =====================================================
    // NOTES
    // =====================================================

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// =========================================================
// MULTI USER UNIQUE CUSTOMER CODE
// =========================================================
//
// Farmer A:
//   CUS-0001
//   CUS-0002
//
// Farmer B:
//   CUS-0001
//   CUS-0002
//
// दोनों allowed हैं.
//
// लेकिन एक ही farmer के लिए:
//
// Farmer A -> CUS-0001
// Farmer A -> CUS-0001  ❌
// =========================================================

customerSchema.index(
  {
    user: 1,
    customerCode: 1,
  },
  {
    unique: true,
    name: "user_customerCode_unique",
  },
);

// =========================================================
// PHONE SEARCH
// =========================================================

customerSchema.index(
  {
    user: 1,
    phone: 1,
  },
  {
    name: "user_phone_index",
  },
);

// =========================================================
// NAME SEARCH
// =========================================================

customerSchema.index(
  {
    user: 1,
    name: 1,
  },
  {
    name: "user_name_index",
  },
);

// =========================================================
// STATUS + DATE
// =========================================================

customerSchema.index(
  {
    user: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "user_status_createdAt_index",
  },
);

module.exports = mongoose.model("Customer", customerSchema);

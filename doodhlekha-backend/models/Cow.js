const mongoose = require("mongoose");

const cowSchema = new mongoose.Schema(
  {
    // ========================================================
    // OWNER / FARMER
    // ========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================================
    // COW ID
    // ========================================================

    cowId: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // NAME
    // ========================================================

    name: {
      type: String,
      required: [true, "Cow name is required"],
      trim: true,
      maxlength: [100, "Cow name cannot exceed 100 characters"],
    },

    // ========================================================
    // BREED
    // ========================================================

    breed: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Breed cannot exceed 100 characters"],
    },

    // ========================================================
    // GENDER
    // ========================================================

    gender: {
      type: String,
      enum: ["female", "male"],
      default: "female",
    },

    // ========================================================
    // DOB
    // ========================================================

    dob: {
      type: Date,
      default: null,
    },

    // ========================================================
    // PURCHASE DATE
    // ========================================================

    purchaseDate: {
      type: Date,
      default: null,
    },

    // ========================================================
    // PURCHASE PRICE
    // ========================================================

    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, "Purchase price cannot be negative"],
    },

    // ========================================================
    // MILK CAPACITY
    // ========================================================

    milkCapacity: {
      type: Number,
      default: 0,
      min: [0, "Milk capacity cannot be negative"],
    },

    // ========================================================
    // STATUS
    // ========================================================

    status: {
      type: String,
      enum: ["milking", "non-milking"],
      default: "milking",
    },

    // ========================================================
    // NOTES
    // ========================================================

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // ========================================================
    // ACTIVE
    // ========================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// VERY IMPORTANT
//
// COW ID केवल SAME USER के अंदर UNIQUE होगी.
//
// User A:
// COW-001
//
// User B:
// COW-001
//
// दोनों allowed हैं.
// ============================================================

cowSchema.index(
  {
    user: 1,
    cowId: 1,
  },
  {
    unique: true,
    name: "user_cowId_unique",
  },
);

// ============================================================
// FAST USER QUERY
// ============================================================

cowSchema.index({
  user: 1,
  isActive: 1,
  createdAt: -1,
});

// ============================================================
// MODEL
// ============================================================

module.exports = mongoose.model("Cow", cowSchema);

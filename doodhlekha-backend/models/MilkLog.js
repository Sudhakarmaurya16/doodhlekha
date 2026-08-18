const mongoose = require("mongoose");

const milkLogSchema = new mongoose.Schema(
  {
    // ==========================================
    // FARMER / USER OWNER
    // ==========================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // COW
    // ==========================================
    cow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
      required: true,
    },

    cowId: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // DATE
    // ==========================================
    date: {
      type: Date,
      required: true,
    },

    // ==========================================
    // MILK
    // ==========================================
    morningMilk: {
      type: Number,
      default: 0,
      min: 0,
    },

    eveningMilk: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMilk: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // NOTES
    // ==========================================
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// ONE MILK ENTRY PER FARMER + COW + DATE
// =====================================================

milkLogSchema.index(
  {
    user: 1,
    cow: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

// =====================================================
// FAST DATE QUERIES
// =====================================================

milkLogSchema.index({
  user: 1,
  date: 1,
});

module.exports = mongoose.model("MilkLog", milkLogSchema);

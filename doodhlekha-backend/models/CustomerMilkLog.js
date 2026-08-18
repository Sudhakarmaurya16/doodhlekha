const mongoose = require("mongoose");

const customerMilkLogSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER / FARMER OWNER
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // CUSTOMER
    // =====================================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    // =====================================================
    // DATE
    // =====================================================

    date: {
      type: Date,
      required: [true, "Milk date is required"],
      index: true,
    },

    // =====================================================
    // MORNING
    // =====================================================

    morningMilk: {
      type: Number,
      default: 0,
      min: [0, "Morning milk cannot be negative"],
    },

    // =====================================================
    // EVENING
    // =====================================================

    eveningMilk: {
      type: Number,
      default: 0,
      min: [0, "Evening milk cannot be negative"],
    },

    // =====================================================
    // TOTAL
    // =====================================================

    totalMilk: {
      type: Number,
      default: 0,
      min: [0, "Total milk cannot be negative"],
    },

    // =====================================================
    // RATE
    // =====================================================

    rate: {
      type: Number,
      required: [true, "Milk rate is required"],
      min: [0, "Milk rate cannot be negative"],
    },

    // =====================================================
    // AMOUNT
    // =====================================================

    amount: {
      type: Number,
      default: 0,
      min: [0, "Amount cannot be negative"],
    },

    // =====================================================
    // NOTES
    // =====================================================

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// ONE CUSTOMER / ONE USER / ONE DAY
// =====================================================

customerMilkLogSchema.index(
  {
    user: 1,
    customer: 1,
    date: 1,
  },
  {
    unique: true,
    name: "unique_user_customer_milk_date",
  },
);

// =====================================================
// CUSTOMER HISTORY
// =====================================================

customerMilkLogSchema.index({
  user: 1,
  customer: 1,
  date: -1,
});

// =====================================================
// AUTO CALCULATION
// =====================================================

customerMilkLogSchema.pre("validate", function () {
  const morning = Number(this.morningMilk || 0);
  const evening = Number(this.eveningMilk || 0);
  const rate = Number(this.rate || 0);

  this.totalMilk = Number((morning + evening).toFixed(2));

  this.amount = Number((this.totalMilk * rate).toFixed(2));
});

module.exports = mongoose.model("CustomerMilkLog", customerMilkLogSchema);

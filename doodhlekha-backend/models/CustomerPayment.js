const mongoose = require("mongoose");

const customerPaymentSchema = new mongoose.Schema(
  {
    // =====================================================
    // FARMER / OWNER
    // =====================================================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // CUSTOMER
    // =====================================================
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    // =====================================================
    // AMOUNT
    // =====================================================
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // =====================================================
    // PAYMENT DATE
    // =====================================================
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // =====================================================
    // METHOD
    // =====================================================
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank", "cheque"],
      default: "cash",
    },

    // =====================================================
    // NOTE
    // =====================================================
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // =====================================================
    // STATUS
    // =====================================================
    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Farmer + customer + date
customerPaymentSchema.index({
  userId: 1,
  customerId: 1,
  paymentDate: -1,
});

// Farmer report
customerPaymentSchema.index({
  userId: 1,
  paymentDate: -1,
});

// Customer payment history
customerPaymentSchema.index({
  customerId: 1,
  paymentDate: -1,
});

module.exports = mongoose.model("CustomerPayment", customerPaymentSchema);

const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| EXPENSE MODEL
|--------------------------------------------------------------------------
| हर expense किसी एक logged-in user/farmer का होगा।
|
| userId:
|   किस farmer ने यह expense बनाया है।
|
| इससे multi-user system में:
|
| Farmer A -> सिर्फ अपना expense
| Farmer B -> सिर्फ अपना expense
|
|--------------------------------------------------------------------------
*/

const expenseSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | USER / FARMER
    |--------------------------------------------------------------------------
    */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    category: {
      type: String,
      required: [true, "Expense category is required"],

      enum: [
        "feed",
        "medicine",
        "labour",
        "transport",
        "electricity",
        "water",
        "animal",
        "maintenance",
        "other",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | AMOUNT
    |--------------------------------------------------------------------------
    */

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    /*
    |--------------------------------------------------------------------------
    | DESCRIPTION
    |--------------------------------------------------------------------------
    */

    description: {
      type: String,
      trim: true,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD
    |--------------------------------------------------------------------------
    */

    paymentMethod: {
      type: String,

      enum: ["cash", "upi", "bank", "credit"],

      default: "cash",
    },

    /*
    |--------------------------------------------------------------------------
    | NOTES
    |--------------------------------------------------------------------------
    */

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },

  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
  User + Date

  इससे user-wise date filtering fast रहेगा।
*/

expenseSchema.index({
  userId: 1,
  date: -1,
});

/*
  User + Category + Date

  Monthly/category reports के लिए useful।
*/

expenseSchema.index({
  userId: 1,
  category: 1,
  date: -1,
});

module.exports = mongoose.model("Expense", expenseSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // FARMER NAME
    // =====================================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // =====================================================
    // PHONE
    // =====================================================

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      index: true,
    },

    // =====================================================
    // EMAIL
    // =====================================================

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    // =====================================================
    // PASSWORD
    // =====================================================

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // =====================================================
    // DAIRY NAME
    // =====================================================

    dairyName: {
      type: String,
      trim: true,
      default: "My Dairy",
      maxlength: [150, "Dairy name cannot exceed 150 characters"],
    },

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["farmer", "admin"],
      default: "farmer",
      index: true,
    },

    // =====================================================
    // PROFILE IMAGE
    // =====================================================

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

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

module.exports = mongoose.model("User", userSchema);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// HELPER: CREATE JWT TOKEN
// ============================================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// ============================================================
// HELPER: CLEAN USER DATA
// Password कभी response में नहीं जाएगा
// ============================================================

const getSafeUserData = (user) => {
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email || "",
    dairyName: user.dairyName || "My Dairy",
    role: user.role,
    profileImage: user.profileImage || "",
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// ============================================================
// REGISTER
// ============================================================

const register = async (req, res) => {
  try {
    let { name, phone, email, password, dairyName, profileImage } = req.body;

    // ========================================================
    // NORMALIZE
    // ========================================================

    name = name !== undefined && name !== null ? String(name).trim() : "";

    phone = phone !== undefined && phone !== null ? String(phone).trim() : "";

    email =
      email !== undefined && email !== null
        ? String(email).trim().toLowerCase()
        : "";

    password =
      password !== undefined && password !== null ? String(password) : "";

    dairyName =
      dairyName !== undefined && dairyName !== null
        ? String(dairyName).trim()
        : "My Dairy";

    profileImage =
      profileImage !== undefined && profileImage !== null
        ? String(profileImage).trim()
        : "";

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ========================================================
    // PHONE FORMAT
    // ========================================================

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit phone number",
      });
    }

    // ========================================================
    // CHECK EXISTING USER
    // ========================================================

    const phoneUser = await User.findOne({
      phone,
    });

    if (phoneUser) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered",
      });
    }

    // ========================================================
    // CHECK EMAIL
    // ========================================================

    if (email) {
      const emailUser = await User.findOne({
        email,
      });

      if (emailUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered",
        });
      }
    }

    // ========================================================
    // HASH PASSWORD
    // ========================================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // ========================================================
    // CREATE USER
    // ========================================================

    const user = await User.create({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
      dairyName: dairyName || "My Dairy",
      profileImage,
      role: "farmer",
      isActive: true,
    });

    // ========================================================
    // JWT
    // ========================================================

    const token = generateToken(user);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: getSafeUserData(user),
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Mongo duplicate key
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          duplicateField === "phone"
            ? "This phone number is already registered"
            : "This email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {
  try {
    let { phone, email, password } = req.body;

    // ========================================================
    // NORMALIZE INPUT
    // ========================================================

    phone = phone !== undefined && phone !== null ? String(phone).trim() : "";

    email =
      email !== undefined && email !== null
        ? String(email).trim().toLowerCase()
        : "";

    password =
      password !== undefined && password !== null ? String(password) : "";

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Phone number or email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const query = phone ? { phone } : { email };

    const user = await User.findOne(query).select("+password");

    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    // ========================================================
    // ACTIVE CHECK
    // ========================================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // ========================================================
    // PASSWORD CHECK
    // ========================================================

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    // ========================================================
    // JWT
    // ========================================================

    const token = generateToken(user);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: getSafeUserData(user),
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// GET PROFILE
// ============================================================

const getProfile = async (req, res) => {
  try {
    // req.user.id authMiddleware से आएगा

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: getSafeUserData(user),
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// LOGOUT
// ============================================================

const logout = async (req, res) => {
  try {
    /*
      JWT stateless है।

      Backend पर token delete करने की जरूरत नहीं है।
      Frontend localStorage से token remove करेगा।
    */

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  register,
  login,
  getProfile,
  logout,
};

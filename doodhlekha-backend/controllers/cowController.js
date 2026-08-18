const mongoose = require("mongoose");
const Cow = require("../models/Cow");

// ============================================================
// HELPER: CURRENT USER ID
// ============================================================

const getUserId = (req) => {
  const userId = req.user?.id;

  if (!userId) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user authentication");
    error.statusCode = 401;
    throw error;
  }

  return userId;
};

// ============================================================
// HELPER: CLEAN COW DATA
// ============================================================

const cleanCowData = (cow) => {
  if (!cow) return null;

  return {
    _id: cow._id,

    user: cow.user,

    cowId: cow.cowId,

    name: cow.name,

    breed: cow.breed || "",

    gender: cow.gender || "female",

    dob: cow.dob || null,

    purchaseDate: cow.purchaseDate || null,

    purchasePrice: Number(cow.purchasePrice || 0),

    milkCapacity: Number(cow.milkCapacity || 0),

    status: cow.status || "milking",

    notes: cow.notes || "",

    isActive: cow.isActive !== false,

    createdAt: cow.createdAt,

    updatedAt: cow.updatedAt,
  };
};

// ============================================================
// CREATE COW
// POST /api/cows
// ============================================================

const createCow = async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      cowId,
      name,
      breed,
      gender,
      dob,
      purchaseDate,
      purchasePrice,
      milkCapacity,
      status,
      notes,
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    const cleanName =
      name !== undefined && name !== null ? String(name).trim() : "";

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Cow name is required",
      });
    }

    // ========================================================
    // COW ID
    // ========================================================

    let finalCowId =
      cowId !== undefined && cowId !== null ? String(cowId).trim() : "";

    /*
      अगर frontend ने Cow ID नहीं भेजी तो automatically generate होगी।
    */

    if (!finalCowId) {
      const lastCow = await Cow.findOne({
        user: userId,
      })
        .sort({
          createdAt: -1,
        })
        .select("cowId")
        .lean();

      let nextNumber = 1;

      if (lastCow?.cowId) {
        const match = String(lastCow.cowId).match(/(\d+)$/);

        if (match) {
          nextNumber = Number(match[1]) + 1;
        }
      }

      finalCowId = `COW-${String(nextNumber).padStart(3, "0")}`;

      /*
        Safety:
        अगर COW-001 पहले से मौजूद है तो अगला available ID खोजेंगे।
      */

      while (
        await Cow.exists({
          user: userId,
          cowId: finalCowId,
        })
      ) {
        nextNumber++;

        finalCowId = `COW-${String(nextNumber).padStart(3, "0")}`;
      }
    }

    // ========================================================
    // DUPLICATE CHECK
    //
    // IMPORTANT:
    // सिर्फ current user के अंदर check होगा।
    //
    // User A -> COW-001 ✅
    // User B -> COW-001 ✅
    // ========================================================

    const existingCow = await Cow.findOne({
      user: userId,
      cowId: finalCowId,
    }).lean();

    if (existingCow) {
      return res.status(400).json({
        success: false,
        message: `Cow ID ${finalCowId} पहले से आपके account में मौजूद है`,
        code: "COW_ID_EXISTS",
      });
    }

    // ========================================================
    // CREATE
    // ========================================================

    const cow = await Cow.create({
      user: userId,

      cowId: finalCowId,

      name: cleanName,

      breed: breed !== undefined && breed !== null ? String(breed).trim() : "",

      gender: gender === "male" || gender === "female" ? gender : "female",

      dob: dob || null,

      purchaseDate: purchaseDate || null,

      purchasePrice:
        purchasePrice !== undefined &&
        purchasePrice !== null &&
        purchasePrice !== ""
          ? Number(purchasePrice)
          : 0,

      milkCapacity:
        milkCapacity !== undefined &&
        milkCapacity !== null &&
        milkCapacity !== ""
          ? Number(milkCapacity)
          : 0,

      status: status === "non-milking" ? "non-milking" : "milking",

      notes: notes !== undefined && notes !== null ? String(notes).trim() : "",

      isActive: true,
    });

    // ========================================================
    // SUCCESS
    // ========================================================

    return res.status(201).json({
      success: true,
      message: "Cow added successfully",
      data: cleanCowData(cow.toObject()),
    });
  } catch (error) {
    console.error("Create Cow Error:", error);

    // ========================================================
    // MONGODB DUPLICATE KEY
    // ========================================================

    if (error?.code === 11000) {
      /*
        अब duplicate केवल:
        user + cowId
        combination पर होना चाहिए।
      */

      if (error.keyPattern?.user && error.keyPattern?.cowId) {
        return res.status(400).json({
          success: false,
          message:
            "यह Cow ID आपके account में पहले से मौजूद है। दूसरी Cow ID इस्तेमाल करें।",
          code: "COW_ID_EXISTS",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Duplicate cow record found",
        code: "DUPLICATE_COW",
      });
    }

    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
        errors: messages,
      });
    }

    // ========================================================
    // INVALID OBJECT ID
    // ========================================================

    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid cow data",
      });
    }

    // ========================================================
    // SERVER ERROR
    // ========================================================

    return res.status(500).json({
      success: false,
      message: "Cow create करने में server error हुआ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// GET ALL COWS
// GET /api/cows
// ============================================================

const getCows = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cows = await Cow.find({
      user: userId,
      isActive: true,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: cows.length,
      data: cows.map(cleanCowData),
    });
  } catch (error) {
    console.error("Get Cows Error:", error);

    return res.status(500).json({
      success: false,
      message: "Cows load करने में समस्या हुई",
    });
  }
};

// ============================================================
// GET SINGLE COW
// GET /api/cows/:id
// ============================================================

const getCowById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cow ID",
      });
    }

    const cow = await Cow.findOne({
      _id: id,
      user: userId,
      isActive: true,
    }).lean();

    if (!cow) {
      return res.status(404).json({
        success: false,
        message: "Cow नहीं मिली",
      });
    }

    return res.status(200).json({
      success: true,
      data: cleanCowData(cow),
    });
  } catch (error) {
    console.error("Get Cow Error:", error);

    return res.status(500).json({
      success: false,
      message: "Cow details load करने में समस्या हुई",
    });
  }
};

// ============================================================
// UPDATE COW
// PUT /api/cows/:id
// ============================================================

const updateCow = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cow ID",
      });
    }

    const allowedFields = [
      "cowId",
      "name",
      "breed",
      "gender",
      "dob",
      "purchaseDate",
      "purchasePrice",
      "milkCapacity",
      "status",
      "notes",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // ========================================================
    // NAME
    // ========================================================

    if (updateData.name !== undefined) {
      updateData.name = String(updateData.name).trim();

      if (!updateData.name) {
        return res.status(400).json({
          success: false,
          message: "Cow name is required",
        });
      }
    }

    // ========================================================
    // COW ID
    // ========================================================

    if (updateData.cowId !== undefined) {
      updateData.cowId = String(updateData.cowId).trim();

      if (!updateData.cowId) {
        return res.status(400).json({
          success: false,
          message: "Cow ID is required",
        });
      }

      const duplicateCow = await Cow.findOne({
        user: userId,
        cowId: updateData.cowId,
        _id: {
          $ne: id,
        },
      }).lean();

      if (duplicateCow) {
        return res.status(400).json({
          success: false,
          message: "यह Cow ID आपके account में पहले से मौजूद है",
          code: "COW_ID_EXISTS",
        });
      }
    }

    // ========================================================
    // NUMBERS
    // ========================================================

    if (updateData.purchasePrice !== undefined) {
      updateData.purchasePrice = Number(updateData.purchasePrice) || 0;
    }

    if (updateData.milkCapacity !== undefined) {
      updateData.milkCapacity = Number(updateData.milkCapacity) || 0;
    }

    // ========================================================
    // UPDATE
    // ========================================================

    const cow = await Cow.findOneAndUpdate(
      {
        _id: id,
        user: userId,
        isActive: true,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!cow) {
      return res.status(404).json({
        success: false,
        message: "Cow नहीं मिली",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cow updated successfully",
      data: cleanCowData(cow),
    });
  } catch (error) {
    console.error("Update Cow Error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "यह Cow ID आपके account में पहले से मौजूद है",
        code: "COW_ID_EXISTS",
      });
    }

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Cow update करने में समस्या हुई",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// DELETE / DEACTIVATE COW
// DELETE /api/cows/:id
// ============================================================

const deleteCow = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cow ID",
      });
    }

    const cow = await Cow.findOneAndUpdate(
      {
        _id: id,
        user: userId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (!cow) {
      return res.status(404).json({
        success: false,
        message: "Cow नहीं मिली",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cow deleted successfully",
      data: cleanCowData(cow),
    });
  } catch (error) {
    console.error("Delete Cow Error:", error);

    return res.status(500).json({
      success: false,
      message: "Cow delete करने में समस्या हुई",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createCow,
  getCows,
  getCowById,
  updateCow,
  deleteCow,
};

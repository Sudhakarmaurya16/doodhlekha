const MilkLog = require("../models/MilkLog");
const Cow = require("../models/Cow");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const SaleMilk = require("../models/SaleMilk");

// =====================================================
// HELPER: GET LOGGED-IN USER ID
// =====================================================

const getUserId = (req) => {
  return req.user?.id || req.user?._id;
};

// =====================================================
// HELPER: DATE RANGE
// =====================================================

const getDateRange = (date) => {
  const startDate = new Date(date);

  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);

  endDate.setDate(endDate.getDate() + 1);

  return {
    startDate,
    endDate,
  };
};

// =====================================================
// HELPER: CHECK USER
// =====================================================

const requireUser = (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return null;
  }

  return userId;
};

// =====================================================
// HELPER: CHECK ALLOCATED MILK
// =====================================================

const getAllocatedMilk = async (userId, date) => {
  const { startDate, endDate } = getDateRange(date);

  // -----------------------------------------------
  // CUSTOMER MILK
  // -----------------------------------------------

  const customerMilkLogs = await CustomerMilkLog.find({
    user: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  const customerMilk = customerMilkLogs.reduce((total, log) => {
    return total + Number(log.totalMilk || 0);
  }, 0);

  // -----------------------------------------------
  // SALE MILK
  // -----------------------------------------------

  const saleMilk = await SaleMilk.findOne({
    user: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  const saleTotal =
    Number(saleMilk?.morningSale || 0) + Number(saleMilk?.eveningSale || 0);

  return {
    customerMilk,
    saleMilk: saleTotal,
    totalAllocated: customerMilk + saleTotal,
  };
};

// =====================================================
// CREATE MILK LOG
// =====================================================

const createMilkLog = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const { cow, date, morningMilk, eveningMilk, notes } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!cow || !date) {
      return res.status(400).json({
        success: false,
        message: "Cow and date are required",
      });
    }

    // -----------------------------------------------
    // CHECK COW BELONGS TO USER
    // -----------------------------------------------

    const selectedCow = await Cow.findOne({
      _id: cow,
      user: userId,
      isActive: true,
    });

    if (!selectedCow) {
      return res.status(404).json({
        success: false,
        message: "Cow not found or does not belong to your dairy",
      });
    }

    // -----------------------------------------------
    // DATE
    // -----------------------------------------------

    const { startDate, endDate } = getDateRange(date);

    // -----------------------------------------------
    // CHECK DUPLICATE
    // -----------------------------------------------

    const existingLog = await MilkLog.findOne({
      user: userId,
      cow,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: "इस गाय की इस तारीख की Milk Entry पहले से मौजूद है",
      });
    }

    // -----------------------------------------------
    // MILK CALCULATION
    // -----------------------------------------------

    const morning = Number(morningMilk) || 0;
    const evening = Number(eveningMilk) || 0;

    if (morning < 0 || evening < 0) {
      return res.status(400).json({
        success: false,
        message: "Milk quantity cannot be negative",
      });
    }

    const total = morning + evening;

    // -----------------------------------------------
    // CREATE
    // -----------------------------------------------

    const milkLog = await MilkLog.create({
      user: userId,
      cow: selectedCow._id,
      cowId: selectedCow.cowId,
      date: startDate,
      morningMilk: morning,
      eveningMilk: evening,
      totalMilk: total,
      notes: notes || "",
    });

    const populatedLog = await MilkLog.findById(milkLog._id).populate(
      "cow",
      "name cowId breed",
    );

    res.status(201).json({
      success: true,
      message: "Milk entry added successfully",
      data: populatedLog,
    });
  } catch (error) {
    console.error("Create Milk Log Error:", error);

    // Duplicate index protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "इस गाय की इस तारीख की Milk Entry पहले से मौजूद है",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add milk entry",
      error: error.message,
    });
  }
};

// =====================================================
// GET MILK LOGS
// =====================================================

const getMilkLogs = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const { startDate, endDate, cowId } = req.query;

    const filter = {
      user: userId,
    };

    // -----------------------------------------------
    // DATE FILTER
    // -----------------------------------------------

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(startDate);

        start.setHours(0, 0, 0, 0);

        filter.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

        filter.date.$lte = end;
      }
    }

    // -----------------------------------------------
    // COW FILTER
    // -----------------------------------------------

    if (cowId) {
      filter.cowId = cowId;
    }

    // -----------------------------------------------
    // FETCH
    // -----------------------------------------------

    const logs = await MilkLog.find(filter)
      .populate("cow", "name cowId breed")
      .sort({
        date: -1,
        createdAt: -1,
      });

    // -----------------------------------------------
    // SUMMARY
    // -----------------------------------------------

    const summary = logs.reduce(
      (acc, log) => {
        acc.morning += Number(log.morningMilk || 0);

        acc.evening += Number(log.eveningMilk || 0);

        acc.total += Number(log.totalMilk || 0);

        return acc;
      },
      {
        morning: 0,
        evening: 0,
        total: 0,
      },
    );

    res.status(200).json({
      success: true,
      count: logs.length,
      summary,
      data: logs,
    });
  } catch (error) {
    console.error("Get Milk Logs Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch milk logs",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE MILK LOG
// =====================================================

const getMilkLogById = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const log = await MilkLog.findOne({
      _id: req.params.id,
      user: userId,
    }).populate("cow", "name cowId breed");

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Milk entry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Get Milk Log Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch milk entry",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE MILK LOG
// =====================================================

const updateMilkLog = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const { morningMilk, eveningMilk, notes } = req.body;

    // -----------------------------------------------
    // FIND USER'S LOG ONLY
    // -----------------------------------------------

    const existingLog = await MilkLog.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!existingLog) {
      return res.status(404).json({
        success: false,
        message: "Milk entry not found",
      });
    }

    // -----------------------------------------------
    // MILK
    // -----------------------------------------------

    const morning = Number(morningMilk) || 0;
    const evening = Number(eveningMilk) || 0;

    if (morning < 0 || evening < 0) {
      return res.status(400).json({
        success: false,
        message: "Milk quantity cannot be negative",
      });
    }

    const total = morning + evening;

    // -----------------------------------------------
    // UPDATE
    // -----------------------------------------------

    existingLog.morningMilk = morning;
    existingLog.eveningMilk = evening;
    existingLog.totalMilk = total;
    existingLog.notes = notes || "";

    await existingLog.save();

    const updatedLog = await MilkLog.findById(existingLog._id).populate(
      "cow",
      "name cowId breed",
    );

    res.status(200).json({
      success: true,
      message: "Milk entry updated successfully",
      data: updatedLog,
    });
  } catch (error) {
    console.error("Update Milk Log Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update milk entry",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE MILK LOG
// =====================================================

const deleteMilkLog = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    // -----------------------------------------------
    // USER OWNED LOG ONLY
    // -----------------------------------------------

    const deletedLog = await MilkLog.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!deletedLog) {
      return res.status(404).json({
        success: false,
        message: "Milk entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Milk entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete Milk Log Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete milk entry",
      error: error.message,
    });
  }
};

// =====================================================
// GET TODAY MILK
// =====================================================

const getTodayMilk = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await MilkLog.find({
      user: userId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const morning = logs.reduce(
      (total, log) => total + Number(log.morningMilk || 0),
      0,
    );

    const evening = logs.reduce(
      (total, log) => total + Number(log.eveningMilk || 0),
      0,
    );

    const total = logs.reduce(
      (total, log) => total + Number(log.totalMilk || 0),
      0,
    );

    const allocation = await getAllocatedMilk(userId, today);

    const remainingMilk = Math.max(total - allocation.totalAllocated, 0);

    res.status(200).json({
      success: true,

      data: {
        morning,
        evening,
        total,

        allocatedMilk: allocation.totalAllocated,

        customerMilk: allocation.customerMilk,

        saleMilk: allocation.saleMilk,

        remainingMilk,
      },
    });
  } catch (error) {
    console.error("Get Today Milk Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch today's milk",
      error: error.message,
    });
  }
};

// =====================================================
// GET MILK SUMMARY
// =====================================================

const getMilkSummary = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const { startDate, endDate } = req.query;

    const filter = {
      user: userId,
    };

    // -----------------------------------------------
    // DATE FILTER
    // -----------------------------------------------

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(startDate);

        start.setHours(0, 0, 0, 0);

        filter.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

        filter.date.$lte = end;
      }
    }

    // -----------------------------------------------
    // FETCH LOGS
    // -----------------------------------------------

    const logs = await MilkLog.find(filter);

    // -----------------------------------------------
    // SUMMARY
    // -----------------------------------------------

    const summary = logs.reduce(
      (acc, log) => {
        acc.morning += Number(log.morningMilk || 0);

        acc.evening += Number(log.eveningMilk || 0);

        acc.total += Number(log.totalMilk || 0);

        return acc;
      },
      {
        morning: 0,
        evening: 0,
        total: 0,
      },
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get Milk Summary Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch milk summary",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createMilkLog,
  getMilkLogs,
  getMilkLogById,
  updateMilkLog,
  deleteMilkLog,
  getTodayMilk,
  getMilkSummary,
};

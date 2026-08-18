const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const CustomerMilkLog = require("../models/CustomerMilkLog");

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

const round = (value) => Number(Number(value || 0).toFixed(2));

const noCache = (res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
};

// ============================================================
// IST DATE RANGE
// ============================================================

const getISTDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(`${dateString}T23:59:59.999+05:30`);

  return {
    start,
    end,
  };
};

const getISTMonthRange = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return null;
  }

  const start = new Date(
    `${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00+05:30`,
  );

  const nextMonth =
    monthNumber === 12
      ? `${year + 1}-01`
      : `${year}-${String(monthNumber + 1).padStart(2, "0")}`;

  const end = new Date(`${nextMonth}-01T00:00:00+05:30`);

  return {
    start,
    end,
    year,
    month: monthNumber,
  };
};

// ============================================================
// CUSTOMER CHECK
// ============================================================

const findCustomerForUser = async (customerId, userId) => {
  if (
    !mongoose.Types.ObjectId.isValid(customerId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  return Customer.findOne({
    _id: customerId,
    user: userId,
  });
};

// ============================================================
// SAVE / UPDATE CUSTOMER MILK
// POST /api/customer-milk/:customerId
// ============================================================

const saveCustomerMilk = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login session invalid है।",
      });
    }

    const customer = await findCustomerForUser(customerId, userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer आपके account में नहीं मिला।",
      });
    }

    if (customer.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "यह customer inactive है।",
      });
    }

    const {
      date,
      morningMilk = 0,
      eveningMilk = 0,
      rate,
      notes = "",
    } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "कृपया milk date चुनें।",
      });
    }

    const dayRange = getISTDayRange(date);

    if (
      Number.isNaN(dayRange.start.getTime()) ||
      Number.isNaN(dayRange.end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Milk date सही नहीं है।",
      });
    }

    const morning = Number(morningMilk || 0);
    const evening = Number(eveningMilk || 0);

    if (
      !Number.isFinite(morning) ||
      !Number.isFinite(evening) ||
      morning < 0 ||
      evening < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Morning / Evening milk सही डालें।",
      });
    }

    const totalMilk = round(morning + evening);

    if (totalMilk <= 0) {
      return res.status(400).json({
        success: false,
        message: "कम से कम Morning या Evening milk डालें।",
      });
    }

    const milkRate =
      rate !== undefined && rate !== null && rate !== ""
        ? Number(rate)
        : Number(customer.defaultRate || 0);

    if (!Number.isFinite(milkRate) || milkRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "कृपया milk rate डालें।",
      });
    }

    const cleanRate = round(milkRate);
    const amount = round(totalMilk * cleanRate);

    // ========================================================
    // FIND EXISTING DAILY RECORD
    // ========================================================

    let milkLog = await CustomerMilkLog.findOne({
      user: userId,
      customer: customerId,
      date: {
        $gte: dayRange.start,
        $lt: dayRange.end,
      },
    });

    // ========================================================
    // UPDATE
    // ========================================================

    if (milkLog) {
      milkLog.morningMilk = round(morning);
      milkLog.eveningMilk = round(evening);
      milkLog.totalMilk = totalMilk;
      milkLog.rate = cleanRate;
      milkLog.amount = amount;
      milkLog.notes = typeof notes === "string" ? notes.trim() : "";

      await milkLog.save();

      const updated = await CustomerMilkLog.findById(milkLog._id)
        .populate("customer", "name customerCode phone milkType defaultRate")
        .lean();

      return res.status(200).json({
        success: true,
        message: "आज का दूध का हिसाब update हो गया।",
        isUpdated: true,
        data: updated,
      });
    }

    // ========================================================
    // CREATE
    // IMPORTANT: user MUST be saved
    // ========================================================

    milkLog = await CustomerMilkLog.create({
      user: userId,
      customer: customerId,
      date: dayRange.start,
      morningMilk: round(morning),
      eveningMilk: round(evening),
      totalMilk,
      rate: cleanRate,
      amount,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    const created = await CustomerMilkLog.findById(milkLog._id)
      .populate("customer", "name customerCode phone milkType defaultRate")
      .lean();

    return res.status(201).json({
      success: true,
      message: "दूध का हिसाब सफलतापूर्वक save हो गया।",
      isUpdated: false,
      data: created,
    });
  } catch (error) {
    console.error("SAVE CUSTOMER MILK ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "इस customer की इस तारीख की milk entry पहले से मौजूद है।",
      });
    }

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {})
        .map((item) => item.message)
        .filter(Boolean);

      return res.status(400).json({
        success: false,
        message: messages.join(", ") || "Milk data सही नहीं है।",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Customer milk save नहीं हो पाया।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// GET CUSTOMER MILK HISTORY
// GET /api/customer-milk/:customerId
// ?month=2026-08
// ============================================================

const getCustomerMilkLogs = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;
    const { month, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const customer = await findCustomerForUser(customerId, userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    const query = {
      user: userId,
      customer: customerId,
    };

    // ========================================================
    // MONTH
    // ========================================================

    if (month) {
      const range = getISTMonthRange(month);

      if (!range) {
        return res.status(400).json({
          success: false,
          message: "Month format YYYY-MM होना चाहिए।",
        });
      }

      query.date = {
        $gte: range.start,
        $lt: range.end,
      };
    }

    // ========================================================
    // CUSTOM DATE
    // ========================================================
    else if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        const range = getISTDayRange(startDate);
        query.date.$gte = range.start;
      }

      if (endDate) {
        const range = getISTDayRange(endDate);
        query.date.$lt = new Date(range.end.getTime() + 1);
      }
    }

    const logs = await CustomerMilkLog.find(query)
      .sort({
        date: 1,
        createdAt: 1,
      })
      .populate("customer", "name customerCode phone milkType defaultRate")
      .lean();

    const summary = logs.reduce(
      (acc, item) => {
        acc.morningMilk += Number(item.morningMilk || 0);

        acc.eveningMilk += Number(item.eveningMilk || 0);

        acc.totalMilk += Number(item.totalMilk || 0);

        acc.totalAmount += Number(item.amount || 0);

        return acc;
      },
      {
        morningMilk: 0,
        eveningMilk: 0,
        totalMilk: 0,
        totalAmount: 0,
      },
    );

    return res.status(200).json({
      success: true,
      count: logs.length,
      summary: {
        morningMilk: round(summary.morningMilk),
        eveningMilk: round(summary.eveningMilk),
        totalMilk: round(summary.totalMilk),
        totalAmount: round(summary.totalAmount),
      },
      data: logs,
    });
  } catch (error) {
    console.error("GET CUSTOMER MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Customer milk records load नहीं हो पाए।",
    });
  }
};

// ============================================================
// TODAY CUSTOMER MILK
// GET /api/customer-milk/:customerId/today
// ============================================================

const getTodayCustomerMilk = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;

    const customer = await findCustomerForUser(customerId, userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    const now = new Date();

    const indiaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const range = getISTDayRange(indiaDate);

    const log = await CustomerMilkLog.findOne({
      user: userId,
      customer: customerId,
      date: {
        $gte: range.start,
        $lt: new Date(range.end.getTime() + 1),
      },
    })
      .populate("customer", "name customerCode phone milkType defaultRate")
      .lean();

    if (!log) {
      return res.status(200).json({
        success: true,
        data: {
          customer,
          date: range.start,
          morningMilk: 0,
          eveningMilk: 0,
          totalMilk: 0,
          rate: Number(customer.defaultRate || 0),
          amount: 0,
          notes: "",
          exists: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...log,
        exists: true,
      },
    });
  } catch (error) {
    console.error("TODAY CUSTOMER MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "आज का milk record load नहीं हो पाया।",
    });
  }
};

// ============================================================
// MONTHLY SUMMARY
// ============================================================

const getCustomerMonthlySummary = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;

    let month = req.query.month;

    if (!month) {
      const now = new Date();

      month = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
      }).format(now);
    }

    const customer = await findCustomerForUser(customerId, userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    const range = getISTMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Invalid month.",
      });
    }

    const logs = await CustomerMilkLog.find({
      user: userId,
      customer: customerId,
      date: {
        $gte: range.start,
        $lt: range.end,
      },
    })
      .sort({ date: 1 })
      .lean();

    const totalMorningMilk = logs.reduce(
      (sum, item) => sum + Number(item.morningMilk || 0),
      0,
    );

    const totalEveningMilk = logs.reduce(
      (sum, item) => sum + Number(item.eveningMilk || 0),
      0,
    );

    const totalMilk = logs.reduce(
      (sum, item) => sum + Number(item.totalMilk || 0),
      0,
    );

    const totalAmount = logs.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          customerCode: customer.customerCode,
          name: customer.name,
          phone: customer.phone,
          milkType: customer.milkType,
          defaultRate: customer.defaultRate,
        },

        period: {
          year: range.year,
          month: range.month,
        },

        summary: {
          totalDays: logs.length,
          totalMorningMilk: round(totalMorningMilk),
          totalEveningMilk: round(totalEveningMilk),
          totalMilk: round(totalMilk),
          totalAmount: round(totalAmount),
        },

        logs,
      },
    });
  } catch (error) {
    console.error("MONTHLY CUSTOMER MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Monthly milk summary load नहीं हो पाई।",
    });
  }
};

// ============================================================
// DELETE CUSTOMER MILK
// ============================================================

const deleteCustomerMilk = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid milk record ID.",
      });
    }

    const log = await CustomerMilkLog.findOne({
      _id: id,
      user: userId,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Milk record नहीं मिला।",
      });
    }

    await log.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Milk record delete हो गया।",
    });
  } catch (error) {
    console.error("DELETE CUSTOMER MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Milk record delete नहीं हो पाया।",
    });
  }
};

module.exports = {
  saveCustomerMilk,
  getCustomerMilkLogs,
  getTodayCustomerMilk,
  getCustomerMonthlySummary,
  deleteCustomerMilk,
};

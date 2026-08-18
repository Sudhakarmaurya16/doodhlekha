const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const MilkLog = require("../models/MilkLog");

// ============================================================
// HELPERS
// ============================================================

const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

const round = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

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

const getISTRange = (startDate, endDate) => {
  const startValue = startDate || endDate;
  const endValue = endDate || startDate;

  if (!startValue && !endValue) {
    const now = new Date();

    const todayIST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    return getISTRange(todayIST, todayIST);
  }

  const start = new Date(`${startValue}T00:00:00+05:30`);
  const end = new Date(`${endValue}T23:59:59.999+05:30`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      error: "कृपया सही तारीख चुनें।",
    };
  }

  if (start > end) {
    return {
      error: "From Date, To Date से बड़ी नहीं हो सकती।",
    };
  }

  return {
    start,
    end,
  };
};

// ============================================================
// IST DATE KEY
// ============================================================

const getISTDateKey = (date) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
};

// ============================================================
// GET PRODUCTION
// ============================================================

const getProductionLogs = async (userId, start, end) => {
  return MilkLog.find({
    user: userId,
    date: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({
      date: -1,
      createdAt: -1,
    })
    .lean();
};

// ============================================================
// GET CUSTOMER MILK
// ============================================================

const getCustomerMilkLogs = async (userId, start, end) => {
  return CustomerMilkLog.find({
    user: userId,
    date: {
      $gte: start,
      $lte: end,
    },
  })
    .populate({
      path: "customer",
      select: "name customerCode phone milkType defaultRate status",
    })
    .sort({
      date: -1,
      createdAt: -1,
    })
    .lean();
};

// ============================================================
// BUILD SUMMARY
// ============================================================

const buildSummary = (productionLogs, customerLogs) => {
  let morningProduction = 0;
  let eveningProduction = 0;
  let totalProduction = 0;

  let morningCustomerMilk = 0;
  let eveningCustomerMilk = 0;
  let customerMilk = 0;
  let customerAmount = 0;

  productionLogs.forEach((log) => {
    morningProduction += Number(log.morningMilk || 0);
    eveningProduction += Number(log.eveningMilk || 0);
    totalProduction += Number(log.totalMilk || 0);
  });

  customerLogs.forEach((log) => {
    morningCustomerMilk += Number(log.morningMilk || 0);
    eveningCustomerMilk += Number(log.eveningMilk || 0);
    customerMilk += Number(log.totalMilk || 0);
    customerAmount += Number(log.amount || 0);
  });

  const remainingMilk = Math.max(totalProduction - customerMilk, 0);

  const uniqueCustomers = new Set(
    customerLogs
      .map((log) => {
        if (!log.customer) return null;

        return log.customer._id?.toString() || log.customer.toString();
      })
      .filter(Boolean),
  );

  const distribution =
    totalProduction > 0 ? (customerMilk / totalProduction) * 100 : 0;

  return {
    morningProduction: round(morningProduction),
    eveningProduction: round(eveningProduction),
    totalProduction: round(totalProduction),

    morningCustomerMilk: round(morningCustomerMilk),
    eveningCustomerMilk: round(eveningCustomerMilk),
    customerMilk: round(customerMilk),

    customerAmount: round(customerAmount),

    remainingMilk: round(remainingMilk),

    customerCount: uniqueCustomers.size,

    productionDays: new Set(
      productionLogs.map((log) => getISTDateKey(log.date)),
    ).size,

    customerDays: new Set(customerLogs.map((log) => getISTDateKey(log.date)))
      .size,

    distributionPercentage: round(distribution),
  };
};

// ============================================================
// DAILY REPORT
// ============================================================

const buildDailyData = (productionLogs, customerLogs) => {
  const dailyMap = new Map();

  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------

  productionLogs.forEach((log) => {
    const dateKey = getISTDateKey(log.date);

    if (!dateKey) return;

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,

        morningProduction: 0,
        eveningProduction: 0,
        totalProduction: 0,

        morningCustomerMilk: 0,
        eveningCustomerMilk: 0,
        customerMilk: 0,

        customerAmount: 0,
        customerCount: 0,

        remainingMilk: 0,
      });
    }

    const day = dailyMap.get(dateKey);

    day.morningProduction += Number(log.morningMilk || 0);
    day.eveningProduction += Number(log.eveningMilk || 0);
    day.totalProduction += Number(log.totalMilk || 0);
  });

  // ----------------------------------------------------------
  // CUSTOMER MILK
  // ----------------------------------------------------------

  customerLogs.forEach((log) => {
    const dateKey = getISTDateKey(log.date);

    if (!dateKey) return;

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,

        morningProduction: 0,
        eveningProduction: 0,
        totalProduction: 0,

        morningCustomerMilk: 0,
        eveningCustomerMilk: 0,
        customerMilk: 0,

        customerAmount: 0,
        customerCount: 0,

        remainingMilk: 0,
      });
    }

    const day = dailyMap.get(dateKey);

    day.morningCustomerMilk += Number(log.morningMilk || 0);

    day.eveningCustomerMilk += Number(log.eveningMilk || 0);

    day.customerMilk += Number(log.totalMilk || 0);

    day.customerAmount += Number(log.amount || 0);

    if (log.customer?._id) {
      day.customerCount += 1;
    }
  });

  // ----------------------------------------------------------
  // FINAL
  // ----------------------------------------------------------

  return Array.from(dailyMap.values())
    .map((day) => {
      const remainingMilk = Math.max(day.totalProduction - day.customerMilk, 0);

      const distributionPercentage =
        day.totalProduction > 0
          ? (day.customerMilk / day.totalProduction) * 100
          : 0;

      return {
        date: day.date,

        morningProduction: round(day.morningProduction),
        eveningProduction: round(day.eveningProduction),
        totalProduction: round(day.totalProduction),

        morningCustomerMilk: round(day.morningCustomerMilk),
        eveningCustomerMilk: round(day.eveningCustomerMilk),
        customerMilk: round(day.customerMilk),

        customerAmount: round(day.customerAmount),

        customerCount: day.customerCount,

        remainingMilk: round(remainingMilk),

        distributionPercentage: round(distributionPercentage),
      };
    })
    .sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
};

// ============================================================
// GET TODAY SALE
// GET /api/sale-milk/today
// ============================================================

const getTodayMilk = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required है।",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user session.",
      });
    }

    const now = new Date();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const range = getISTRange(today, today);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const [productionLogs, customerLogs] = await Promise.all([
      getProductionLogs(userId, range.start, range.end),

      getCustomerMilkLogs(userId, range.start, range.end),
    ]);

    const summary = buildSummary(productionLogs, customerLogs);

    const dailyData = buildDailyData(productionLogs, customerLogs);

    return res.status(200).json({
      success: true,

      data: {
        date: today,

        morningProduction: summary.morningProduction,

        eveningProduction: summary.eveningProduction,

        totalProduction: summary.totalProduction,

        totalMilk: summary.totalProduction,

        morningCustomerMilk: summary.morningCustomerMilk,

        eveningCustomerMilk: summary.eveningCustomerMilk,

        customerMilk: summary.customerMilk,

        totalSale: summary.customerMilk,

        customerAmount: summary.customerAmount,

        customerCount: summary.customerCount,

        remainingMilk: summary.remainingMilk,

        distributionPercentage: summary.distributionPercentage,

        saleExists: customerLogs.length > 0,

        customerLogs,
      },

      summary,

      dailyData,
    });
  } catch (error) {
    console.error("GET TODAY SALE MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "आज का Milk Sale data load नहीं हो पाया।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// GET SALE MILK
// GET /api/sale-milk
// ============================================================

const getSaleMilk = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required है।",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user session.",
      });
    }

    const { startDate, endDate } = req.query;

    const range = getISTRange(startDate, endDate);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const [productionLogs, customerLogs] = await Promise.all([
      getProductionLogs(userId, range.start, range.end),

      getCustomerMilkLogs(userId, range.start, range.end),
    ]);

    const summary = buildSummary(productionLogs, customerLogs);

    const dailyData = buildDailyData(productionLogs, customerLogs);

    return res.status(200).json({
      success: true,

      count: customerLogs.length,

      summary,

      data: customerLogs,

      dailyData,
    });
  } catch (error) {
    console.error("GET SALE MILK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Milk Sale records load नहीं हो पाए।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getSaleMilk,
  getTodayMilk,
};

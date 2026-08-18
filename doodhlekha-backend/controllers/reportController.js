const mongoose = require("mongoose");

const MilkLog = require("../models/MilkLog");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const CustomerPayment = require("../models/CustomerPayment");
const Expense = require("../models/Expense");
const Customer = require("../models/Customer");

// ============================================================
// DOODHLEKHA REPORT CONTROLLER
// ============================================================
// हर report केवल logged-in farmer/user का data दिखाएगी.
//
// Farmer A -> केवल A का data
// Farmer B -> केवल B का data
//
// Data:
// MilkLog           -> अपना दूध उत्पादन
// CustomerMilkLog   -> ग्राहक को दिया दूध
// CustomerPayment  -> ग्राहक से मिला पैसा
// Expense           -> खर्च
// ============================================================

// ============================================================
// USER ID
// ============================================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

// ============================================================
// NUMBER HELPER
// ============================================================

const num = (value) => {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) {
    return 0;
  }

  return Number(n.toFixed(2));
};

// ============================================================
// DATE VALIDATION
// ============================================================

const isValidDate = (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
};

// ============================================================
// IST DATE RANGE
// ============================================================

const getISTRange = (startDate, endDate) => {
  return {
    start: new Date(`${startDate}T00:00:00.000+05:30`),
    end: new Date(`${endDate}T23:59:59.999+05:30`),
  };
};

// ============================================================
// DEFAULT CURRENT MONTH
// ============================================================

const getDefaultRange = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1);

  const format = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  return {
    startDate: format(start),
    endDate: format(now),
  };
};

// ============================================================
// GET REPORT SUMMARY
// ============================================================

const getReportSummary = async (req, res) => {
  try {
    console.log("\n==============================================");
    console.log("📊 REPORT REQUEST");
    console.log("USER:", req.user);
    console.log("QUERY:", req.query);
    console.log("==============================================");

    // ----------------------------------------------------------
    // USER
    // ----------------------------------------------------------

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ----------------------------------------------------------
    // DATE
    // ----------------------------------------------------------

    const defaultRange = getDefaultRange();

    const startDate = req.query.startDate || defaultRange.startDate;
    const endDate = req.query.endDate || defaultRange.endDate;

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Date format YYYY-MM-DD होना चाहिए",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "From date, To date से बड़ी नहीं हो सकती",
      });
    }

    const { start, end } = getISTRange(startDate, endDate);

    console.log("📅 REPORT RANGE:", {
      startDate,
      endDate,
      start,
      end,
      userId,
    });

    // ==========================================================
    // CUSTOMER LIST
    // ==========================================================

    const customers = await Customer.find({
      user: userObjectId,
    })
      .select("_id name customerCode phone status")
      .lean();

    const customerIds = customers.map((item) => item._id);

    console.log("👥 CUSTOMER COUNT:", customers.length);

    // ==========================================================
    // MAIN SUMMARY QUERIES
    // ==========================================================

    const [productionResult, customerMilkResult, paymentResult, expenseResult] =
      await Promise.all([
        // --------------------------------------------------------
        // FARMER MILK
        // --------------------------------------------------------

        MilkLog.aggregate([
          {
            $match: {
              user: userObjectId,
              date: {
                $gte: start,
                $lte: end,
              },
            },
          },

          {
            $group: {
              _id: null,

              morningMilk: {
                $sum: {
                  $ifNull: ["$morningMilk", 0],
                },
              },

              eveningMilk: {
                $sum: {
                  $ifNull: ["$eveningMilk", 0],
                },
              },

              totalMilk: {
                $sum: {
                  $ifNull: [
                    "$totalMilk",
                    {
                      $add: [
                        { $ifNull: ["$morningMilk", 0] },
                        { $ifNull: ["$eveningMilk", 0] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        ]),

        // --------------------------------------------------------
        // CUSTOMER MILK
        // --------------------------------------------------------

        CustomerMilkLog.aggregate([
          {
            $match: {
              user: userObjectId,
              date: {
                $gte: start,
                $lte: end,
              },
            },
          },

          {
            $group: {
              _id: null,

              morningMilk: {
                $sum: {
                  $ifNull: ["$morningMilk", 0],
                },
              },

              eveningMilk: {
                $sum: {
                  $ifNull: ["$eveningMilk", 0],
                },
              },

              totalMilk: {
                $sum: {
                  $ifNull: [
                    "$totalMilk",
                    {
                      $add: [
                        { $ifNull: ["$morningMilk", 0] },
                        { $ifNull: ["$eveningMilk", 0] },
                      ],
                    },
                  ],
                },
              },

              totalAmount: {
                $sum: {
                  $ifNull: ["$amount", 0],
                },
              },
            },
          },
        ]),

        // --------------------------------------------------------
        // CUSTOMER PAYMENT
        // --------------------------------------------------------

        CustomerPayment.aggregate([
          {
            $match: {
              userId: userObjectId,

              customerId: {
                $in: customerIds,
              },

              paymentDate: {
                $gte: start,
                $lte: end,
              },

              status: {
                $ne: "cancelled",
              },
            },
          },

          {
            $group: {
              _id: null,

              totalPayment: {
                $sum: {
                  $ifNull: ["$amount", 0],
                },
              },
            },
          },
        ]),

        // --------------------------------------------------------
        // EXPENSE
        // --------------------------------------------------------

        Expense.aggregate([
          {
            $match: {
              userId: userObjectId,

              date: {
                $gte: start,
                $lte: end,
              },
            },
          },

          {
            $group: {
              _id: null,

              totalExpense: {
                $sum: {
                  $ifNull: ["$amount", 0],
                },
              },
            },
          },
        ]),
      ]);

    // ==========================================================
    // EXTRACT
    // ==========================================================

    const productionData = productionResult[0] || {};
    const customerData = customerMilkResult[0] || {};
    const paymentData = paymentResult[0] || {};
    const expenseData = expenseResult[0] || {};

    // ==========================================================
    // PRODUCTION
    // ==========================================================

    const morningProduction = num(productionData.morningMilk);
    const eveningProduction = num(productionData.eveningMilk);
    const totalProduction = num(
      productionData.totalMilk || morningProduction + eveningProduction,
    );

    // ==========================================================
    // CUSTOMER MILK
    // ==========================================================

    const customerMorningMilk = num(customerData.morningMilk);
    const customerEveningMilk = num(customerData.eveningMilk);

    const totalCustomerMilk = num(
      customerData.totalMilk || customerMorningMilk + customerEveningMilk,
    );

    const customerMilkAmount = num(customerData.totalAmount);

    // ==========================================================
    // PAYMENT
    // ==========================================================

    const customerPayment = num(paymentData.totalPayment);

    // ==========================================================
    // EXPENSE
    // ==========================================================

    const totalExpense = num(expenseData.totalExpense);

    // ==========================================================
    // REMAINING
    // ==========================================================

    const remainingMilk = num(Math.max(totalProduction - totalCustomerMilk, 0));

    // ==========================================================
    // DISTRIBUTION
    // ==========================================================

    const distributedPercentage =
      totalProduction > 0
        ? num((totalCustomerMilk / totalProduction) * 100)
        : 0;

    // ==========================================================
    // NET
    // ==========================================================

    const netAmount = num(customerPayment - totalExpense);

    // ==========================================================
    // DAILY PRODUCTION
    // ==========================================================

    const dailyProduction = await MilkLog.aggregate([
      {
        $match: {
          user: userObjectId,

          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Kolkata",
            },
          },

          morningMilk: {
            $sum: {
              $ifNull: ["$morningMilk", 0],
            },
          },

          eveningMilk: {
            $sum: {
              $ifNull: ["$eveningMilk", 0],
            },
          },

          totalMilk: {
            $sum: {
              $ifNull: ["$totalMilk", 0],
            },
          },
        },
      },
    ]);

    // ==========================================================
    // DAILY CUSTOMER MILK
    // ==========================================================

    const dailyCustomerMilk = await CustomerMilkLog.aggregate([
      {
        $match: {
          user: userObjectId,

          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Kolkata",
            },
          },

          morningMilk: {
            $sum: {
              $ifNull: ["$morningMilk", 0],
            },
          },

          eveningMilk: {
            $sum: {
              $ifNull: ["$eveningMilk", 0],
            },
          },

          totalMilk: {
            $sum: {
              $ifNull: ["$totalMilk", 0],
            },
          },

          amount: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },
    ]);

    // ==========================================================
    // DAILY PAYMENT
    // ==========================================================

    const dailyPayments = await CustomerPayment.aggregate([
      {
        $match: {
          userId: userObjectId,

          customerId: {
            $in: customerIds,
          },

          paymentDate: {
            $gte: start,
            $lte: end,
          },

          status: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$paymentDate",
              timezone: "Asia/Kolkata",
            },
          },

          payment: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },
    ]);

    // ==========================================================
    // DAILY EXPENSE
    // ==========================================================

    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,

          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Kolkata",
            },
          },

          expense: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },
    ]);

    // ==========================================================
    // DAILY MAP
    // ==========================================================

    const dailyMap = new Map();

    const ensureDay = (date) => {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,

          morningMilk: 0,
          eveningMilk: 0,
          production: 0,

          customerMorningMilk: 0,
          customerEveningMilk: 0,
          customerMilk: 0,
          milkAmount: 0,

          remainingMilk: 0,

          payment: 0,
          expense: 0,
          netAmount: 0,
        });
      }

      return dailyMap.get(date);
    };

    // ----------------------------------------------------------
    // PRODUCTION
    // ----------------------------------------------------------

    dailyProduction.forEach((item) => {
      const day = ensureDay(item._id);

      day.morningMilk = num(item.morningMilk);
      day.eveningMilk = num(item.eveningMilk);

      day.production = num(item.totalMilk || day.morningMilk + day.eveningMilk);
    });

    // ----------------------------------------------------------
    // CUSTOMER MILK
    // ----------------------------------------------------------

    dailyCustomerMilk.forEach((item) => {
      const day = ensureDay(item._id);

      day.customerMorningMilk = num(item.morningMilk);
      day.customerEveningMilk = num(item.eveningMilk);

      day.customerMilk = num(
        item.totalMilk || day.customerMorningMilk + day.customerEveningMilk,
      );

      day.milkAmount = num(item.amount);
    });

    // ----------------------------------------------------------
    // PAYMENTS
    // ----------------------------------------------------------

    dailyPayments.forEach((item) => {
      const day = ensureDay(item._id);

      day.payment = num(item.payment);
    });

    // ----------------------------------------------------------
    // EXPENSE
    // ----------------------------------------------------------

    dailyExpenses.forEach((item) => {
      const day = ensureDay(item._id);

      day.expense = num(item.expense);
    });

    // ----------------------------------------------------------
    // FINAL DAILY
    // ----------------------------------------------------------

    const dailyData = Array.from(dailyMap.values())
      .map((day) => ({
        ...day,

        remainingMilk: num(Math.max(day.production - day.customerMilk, 0)),

        netAmount: num(day.payment - day.expense),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ==========================================================
    // CUSTOMER WISE
    // ==========================================================

    const customerWise = await CustomerMilkLog.aggregate([
      {
        $match: {
          user: userObjectId,

          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: "$customer",

          totalMilk: {
            $sum: {
              $ifNull: ["$totalMilk", 0],
            },
          },

          totalAmount: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },

      {
        $lookup: {
          from: "customers",

          localField: "_id",

          foreignField: "_id",

          as: "customer",
        },
      },

      {
        $unwind: {
          path: "$customer",

          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,

          customerId: "$_id",

          name: "$customer.name",

          customerCode: "$customer.customerCode",

          phone: "$customer.phone",

          totalMilk: 1,

          totalAmount: 1,
        },
      },

      {
        $sort: {
          totalMilk: -1,
        },
      },
    ]);

    // ==========================================================
    // CUSTOMER PAYMENTS
    // ==========================================================

    const customerPayments = await CustomerPayment.aggregate([
      {
        $match: {
          userId: userObjectId,

          customerId: {
            $in: customerIds,
          },

          paymentDate: {
            $gte: start,
            $lte: end,
          },

          status: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: "$customerId",

          totalPayment: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },

      {
        $lookup: {
          from: "customers",

          localField: "_id",

          foreignField: "_id",

          as: "customer",
        },
      },

      {
        $unwind: {
          path: "$customer",

          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,

          customerId: "$_id",

          name: "$customer.name",

          customerCode: "$customer.customerCode",

          totalPayment: 1,
        },
      },

      {
        $sort: {
          totalPayment: -1,
        },
      },
    ]);

    // ==========================================================
    // EXPENSE CATEGORY
    // ==========================================================

    const expenseByCategory = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,

          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: "$category",

          total: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,

          category: "$_id",

          total: 1,
        },
      },

      {
        $sort: {
          total: -1,
        },
      },
    ]);

    // ==========================================================
    // FINAL RESPONSE
    // ==========================================================

    const result = {
      success: true,

      message: "Report fetched successfully",

      data: {
        period: {
          startDate,
          endDate,
        },

        // ------------------------------------------------------
        // FRONTEND FRIENDLY STRUCTURE
        // ------------------------------------------------------

        production: {
          morningMilk: morningProduction,
          eveningMilk: eveningProduction,
          totalMilk: totalProduction,
          days: dailyData.filter((item) => item.production > 0).length,
        },

        customerMilk: {
          morningMilk: customerMorningMilk,
          eveningMilk: customerEveningMilk,
          totalMilk: totalCustomerMilk,
          totalAmount: customerMilkAmount,
          customers: new Set(
            customerWise.map((item) => String(item.customerId)),
          ).size,
        },

        stock: {
          remainingMilk,
          distributedPercentage,
        },

        finance: {
          customerMilkAmount,

          customerPayment,

          totalPayment: customerPayment,

          totalExpense,

          expense: totalExpense,

          netAmount,
        },

        dailyData,

        customerWise,

        customerPayments,

        expenseByCategory,

        counts: {
          customers: customers.length,

          customerWise: customerWise.length,

          customerPayments: customerPayments.length,

          dailyData: dailyData.length,

          expenseCategories: expenseByCategory.length,
        },
      },
    };

    // ==========================================================
    // DEBUG
    // ==========================================================

    console.log("\n📊 REPORT FINAL:");
    console.log({
      totalProduction,
      totalCustomerMilk,
      customerMilkAmount,
      customerPayment,
      totalExpense,
      netAmount,
      dailyDays: dailyData.length,
      customers: customers.length,
    });

    console.log("==============================================\n");

    return res.status(200).json(result);
  } catch (error) {
    console.error("\n❌ REPORT ERROR:");
    console.error(error);
    console.error("==============================================");

    return res.status(500).json({
      success: false,
      message: "Report fetch करने में समस्या हुई",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getReportSummary,
};

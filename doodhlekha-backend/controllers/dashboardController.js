// const Cow = require("../models/Cow");
// const Customer = require("../models/Customer");
// const MilkLog = require("../models/MilkLog");
// const CustomerMilkLog = require("../models/CustomerMilkLog");
// const CustomerPayment = require("../models/CustomerPayment");
// const Expense = require("../models/Expense");

// const round = (value) => Number(Number(value || 0).toFixed(2));

// const getUserId = (req) => {
//   return req.user?.id || req.user?._id || req.user?.userId;
// };

// const startOfDay = (date = new Date()) => {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const endOfDay = (date = new Date()) => {
//   const d = new Date(date);
//   d.setHours(23, 59, 59, 999);
//   return d;
// };

// const startOfMonth = (date = new Date()) => {
//   const d = new Date(date);
//   return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
// };

// const startOfNextMonth = (date = new Date()) => {
//   const d = new Date(date);
//   return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
// };

// // ============================================================
// // GET DASHBOARD
// // GET /api/dashboard
// // ============================================================

// const getDashboard = async (req, res) => {
//   try {
//     const userId = getUserId(req);

//     console.log("==============================================");
//     console.log("DASHBOARD REQUEST");
//     console.log("USER:", req.user);
//     console.log("USER ID:", userId);
//     console.log("==============================================");

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     // ========================================================
//     // DATE RANGE
//     // ========================================================

//     const now = new Date();

//     const todayStart = startOfDay(now);
//     const todayEnd = endOfDay(now);

//     const monthStart = startOfMonth(now);
//     const nextMonthStart = startOfNextMonth(now);

//     // ========================================================
//     // PARALLEL DATABASE QUERIES
//     // ========================================================

//     const [
//       totalCows,
//       milkingCows,
//       nonMilkingCows,
//       totalCustomers,

//       todayCustomerMilk,
//       todayProductionMilk,

//       todayExpenses,

//       monthlyCustomerMilk,
//       monthlyProductionMilk,

//       monthlyPayments,
//       monthlyExpenses,

//       recentMilkLogs,
//       recentExpenses,
//       recentPayments,
//     ] = await Promise.all([
//       // ------------------------------------------------------
//       // COWS
//       // ------------------------------------------------------

//       Cow.countDocuments({
//         userId,
//         isActive: true,
//       }),

//       Cow.countDocuments({
//         userId,
//         isActive: true,
//         status: "milking",
//       }),

//       Cow.countDocuments({
//         userId,
//         isActive: true,
//         status: "non-milking",
//       }),

//       // ------------------------------------------------------
//       // CUSTOMERS
//       // IMPORTANT: Customer model में field = user
//       // ------------------------------------------------------

//       Customer.countDocuments({
//         user: userId,
//         status: "active",
//       }),

//       // ------------------------------------------------------
//       // TODAY CUSTOMER MILK
//       // IMPORTANT: CustomerMilkLog में field = user
//       // ------------------------------------------------------

//       CustomerMilkLog.find({
//         user: userId,
//         date: {
//           $gte: todayStart,
//           $lte: todayEnd,
//         },
//       }).lean(),

//       // ------------------------------------------------------
//       // TODAY PRODUCTION
//       // IMPORTANT: MilkLog में field = user
//       // ------------------------------------------------------

//       MilkLog.find({
//         user: userId,
//         date: {
//           $gte: todayStart,
//           $lte: todayEnd,
//         },
//       }).lean(),

//       // ------------------------------------------------------
//       // TODAY EXPENSE
//       // Expense में field = userId
//       // ------------------------------------------------------

//       Expense.find({
//         userId,
//         date: {
//           $gte: todayStart,
//           $lte: todayEnd,
//         },
//       }).lean(),

//       // ------------------------------------------------------
//       // MONTH CUSTOMER MILK
//       // ------------------------------------------------------

//       CustomerMilkLog.find({
//         user: userId,
//         date: {
//           $gte: monthStart,
//           $lt: nextMonthStart,
//         },
//       })
//         .populate("customer", "name customerCode phone")
//         .sort({
//           date: -1,
//           createdAt: -1,
//         })
//         .lean(),

//       // ------------------------------------------------------
//       // MONTH PRODUCTION
//       // ------------------------------------------------------

//       MilkLog.find({
//         user: userId,
//         date: {
//           $gte: monthStart,
//           $lt: nextMonthStart,
//         },
//       }).lean(),

//       // ------------------------------------------------------
//       // MONTH PAYMENTS
//       // ------------------------------------------------------

//       CustomerPayment.find({
//         userId,
//         paymentDate: {
//           $gte: monthStart,
//           $lt: nextMonthStart,
//         },
//         status: "completed",
//       }).lean(),

//       // ------------------------------------------------------
//       // MONTH EXPENSE
//       // ------------------------------------------------------

//       Expense.find({
//         userId,
//         date: {
//           $gte: monthStart,
//           $lt: nextMonthStart,
//         },
//       }).lean(),

//       // ------------------------------------------------------
//       // RECENT MILK
//       // ------------------------------------------------------

//       CustomerMilkLog.find({
//         user: userId,
//       })
//         .populate("customer", "name phone customerCode")
//         .sort({
//           date: -1,
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),

//       // ------------------------------------------------------
//       // RECENT EXPENSE
//       // ------------------------------------------------------

//       Expense.find({
//         userId,
//       })
//         .sort({
//           date: -1,
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),

//       // ------------------------------------------------------
//       // RECENT PAYMENT
//       // ------------------------------------------------------

//       CustomerPayment.find({
//         userId,
//         status: "completed",
//       })
//         .populate("customerId", "name phone customerCode")
//         .sort({
//           paymentDate: -1,
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),
//     ]);

//     // ========================================================
//     // DEBUG
//     // ========================================================

//     console.log("DASHBOARD COUNTS:", {
//       totalCows,
//       milkingCows,
//       nonMilkingCows,
//       totalCustomers,
//       todayCustomerMilk: todayCustomerMilk.length,
//       todayProductionMilk: todayProductionMilk.length,
//       todayExpenses: todayExpenses.length,
//       monthlyCustomerMilk: monthlyCustomerMilk.length,
//       monthlyProductionMilk: monthlyProductionMilk.length,
//       monthlyPayments: monthlyPayments.length,
//       monthlyExpenses: monthlyExpenses.length,
//     });

//     // ========================================================
//     // TODAY CUSTOMER MILK
//     // ========================================================

//     const todayCustomerMorningMilk = todayCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.morningMilk || 0),
//       0,
//     );

//     const todayCustomerEveningMilk = todayCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.eveningMilk || 0),
//       0,
//     );

//     const todayCustomerMilkTotal = todayCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.totalMilk || 0),
//       0,
//     );

//     const todayCustomerAmount = todayCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0,
//     );

//     // ========================================================
//     // TODAY PRODUCTION
//     // ========================================================

//     const todayProductionMorning = todayProductionMilk.reduce(
//       (sum, item) => sum + Number(item.morningMilk || 0),
//       0,
//     );

//     const todayProductionEvening = todayProductionMilk.reduce(
//       (sum, item) => sum + Number(item.eveningMilk || 0),
//       0,
//     );

//     const todayProductionTotal = todayProductionMilk.reduce(
//       (sum, item) =>
//         sum +
//         Number(
//           item.totalMilk ||
//             Number(item.morningMilk || 0) + Number(item.eveningMilk || 0),
//         ),
//       0,
//     );

//     // ========================================================
//     // TODAY EXPENSE
//     // ========================================================

//     const todayExpenseTotal = todayExpenses.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0,
//     );

//     // ========================================================
//     // MONTH CUSTOMER MILK
//     // ========================================================

//     const monthlyCustomerMilkTotal = monthlyCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.totalMilk || 0),
//       0,
//     );

//     const monthlyCustomerMilkAmount = monthlyCustomerMilk.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0,
//     );

//     // ========================================================
//     // MONTH PRODUCTION
//     // ========================================================

//     const monthlyProductionMorning = monthlyProductionMilk.reduce(
//       (sum, item) => sum + Number(item.morningMilk || 0),
//       0,
//     );

//     const monthlyProductionEvening = monthlyProductionMilk.reduce(
//       (sum, item) => sum + Number(item.eveningMilk || 0),
//       0,
//     );

//     const monthlyProductionTotal = monthlyProductionMilk.reduce(
//       (sum, item) =>
//         sum +
//         Number(
//           item.totalMilk ||
//             Number(item.morningMilk || 0) + Number(item.eveningMilk || 0),
//         ),
//       0,
//     );

//     // ========================================================
//     // MONTH PAYMENTS
//     // ========================================================

//     const monthlyPaymentTotal = monthlyPayments.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0,
//     );

//     // ========================================================
//     // MONTH EXPENSE
//     // ========================================================

//     const monthlyExpenseTotal = monthlyExpenses.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0,
//     );

//     // ========================================================
//     // CUSTOMER PENDING
//     // ========================================================

//     const monthlyPending = monthlyCustomerMilkAmount - monthlyPaymentTotal;

//     // ========================================================
//     // REMAINING MILK
//     // ========================================================

//     const monthlyRemainingMilk = Math.max(
//       monthlyProductionTotal - monthlyCustomerMilkTotal,
//       0,
//     );

//     // ========================================================
//     // TODAY REMAINING
//     // ========================================================

//     const todayRemainingMilk = Math.max(
//       todayProductionTotal - todayCustomerMilkTotal,
//       0,
//     );

//     // ========================================================
//     // MILK SALE %
//     // ========================================================

//     const monthlyMilkSalePercentage =
//       monthlyProductionTotal > 0
//         ? (monthlyCustomerMilkTotal / monthlyProductionTotal) * 100
//         : 0;

//     // ========================================================
//     // DAILY AVERAGE
//     // ========================================================

//     const currentDay = now.getDate();

//     const monthlyAverageProduction =
//       currentDay > 0 ? monthlyProductionTotal / currentDay : 0;

//     const monthlyAverageCustomerMilk =
//       currentDay > 0 ? monthlyCustomerMilkTotal / currentDay : 0;

//     // ========================================================
//     // FINAL RESPONSE
//     // ========================================================

//     const dashboardData = {
//       // ======================================================
//       // COWS
//       // ======================================================

//       cows: {
//         total: Number(totalCows || 0),
//         milking: Number(milkingCows || 0),
//         nonMilking: Number(nonMilkingCows || 0),
//       },

//       // ======================================================
//       // CUSTOMERS
//       // ======================================================

//       customers: {
//         total: Number(totalCustomers || 0),
//         active: Number(totalCustomers || 0),
//       },

//       // ======================================================
//       // TODAY
//       // ======================================================

//       today: {
//         productionMorning: round(todayProductionMorning),
//         productionEvening: round(todayProductionEvening),

//         morningMilk: round(todayProductionMorning),
//         eveningMilk: round(todayProductionEvening),

//         productionMilk: round(todayProductionTotal),

//         customerMorningMilk: round(todayCustomerMorningMilk),
//         customerEveningMilk: round(todayCustomerEveningMilk),

//         customerMilk: round(todayCustomerMilkTotal),

//         totalMilk: round(todayProductionTotal),

//         soldMilk: round(todayCustomerMilkTotal),

//         remainingMilk: round(todayRemainingMilk),

//         milkSaleAmount: round(todayCustomerAmount),

//         expense: round(todayExpenseTotal),
//       },

//       // ======================================================
//       // MONTH
//       // ======================================================

//       month: {
//         production: round(monthlyProductionTotal),

//         productionMilk: round(monthlyProductionTotal),

//         morningProduction: round(monthlyProductionMorning),

//         eveningProduction: round(monthlyProductionEvening),

//         milk: round(monthlyCustomerMilkTotal),

//         customerMilk: round(monthlyCustomerMilkTotal),

//         milkAmount: round(monthlyCustomerMilkAmount),

//         payments: round(monthlyPaymentTotal),

//         expenses: round(monthlyExpenseTotal),

//         expense: round(monthlyExpenseTotal),

//         pending: round(Math.max(monthlyPending, 0)),

//         balance: round(monthlyPending),

//         remainingMilk: round(monthlyRemainingMilk),

//         milkSalePercentage: round(monthlyMilkSalePercentage),

//         averageDailyProduction: round(monthlyAverageProduction),

//         averageDailyCustomerMilk: round(monthlyAverageCustomerMilk),
//       },

//       // ======================================================
//       // RECENT
//       // ======================================================

//       recent: {
//         milkLogs: recentMilkLogs,
//         expenses: recentExpenses,
//         payments: recentPayments,
//       },

//       // ======================================================
//       // REPORT STYLE SUMMARY
//       // ======================================================

//       summary: {
//         totalProduction: round(monthlyProductionTotal),

//         totalCustomerMilk: round(monthlyCustomerMilkTotal),

//         totalPayments: round(monthlyPaymentTotal),

//         totalExpenses: round(monthlyExpenseTotal),

//         pendingAmount: round(Math.max(monthlyPending, 0)),

//         netAmount: round(monthlyPaymentTotal - monthlyExpenseTotal),
//       },
//     };

//     console.log("DASHBOARD FINAL:", {
//       production: dashboardData.month.production,
//       customerMilk: dashboardData.month.customerMilk,
//       payments: dashboardData.month.payments,
//       expenses: dashboardData.month.expenses,
//       pending: dashboardData.month.pending,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Dashboard data loaded successfully",
//       data: dashboardData,
//     });
//   } catch (error) {
//     console.error("==============================================");
//     console.error("DASHBOARD ERROR:", error);
//     console.error("==============================================");

//     return res.status(500).json({
//       success: false,
//       message: "Dashboard data load नहीं हो पाया",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// module.exports = {
//   getDashboard,
// };

const Cow = require("../models/Cow");
const Customer = require("../models/Customer");
const MilkLog = require("../models/MilkLog");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const CustomerPayment = require("../models/CustomerPayment");
const Expense = require("../models/Expense");

// ============================================================
// HELPERS
// ============================================================

const round = (value) => Number(Number(value || 0).toFixed(2));

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

// ============================================================
// DATE HELPERS
// ============================================================

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date = new Date()) => {
  const d = new Date(date);

  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
};

const startOfNextMonth = (date = new Date()) => {
  const d = new Date(date);

  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
};

// ============================================================
// GET DASHBOARD
// GET /api/dashboard
// ============================================================

const getDashboard = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log("==============================================");
    console.log("DASHBOARD REQUEST");
    console.log("USER:", req.user);
    console.log("USER ID:", userId);
    console.log("==============================================");

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================================
    // DATE RANGE
    // ========================================================

    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);

    // ========================================================
    // ALL DATABASE QUERIES
    // ========================================================

    const [
      totalCows,
      milkingCows,
      nonMilkingCows,

      totalCustomers,

      todayCustomerMilk,
      todayProductionMilk,

      todayExpenses,

      monthlyCustomerMilk,
      monthlyProductionMilk,

      monthlyPayments,
      monthlyExpenses,

      recentMilkLogs,
      recentExpenses,
      recentPayments,
    ] = await Promise.all([
      // ======================================================
      // CATTLE
      // IMPORTANT:
      // Cow model में owner field = user
      // userId नहीं
      // ======================================================

      Cow.countDocuments({
        user: userId,
        isActive: true,
      }),

      Cow.countDocuments({
        user: userId,
        isActive: true,
        status: "milking",
      }),

      Cow.countDocuments({
        user: userId,
        isActive: true,
        status: "non-milking",
      }),

      // ======================================================
      // CUSTOMERS
      // Customer model में field = user
      // ======================================================

      Customer.countDocuments({
        user: userId,
        status: "active",
      }),

      // ======================================================
      // TODAY CUSTOMER MILK
      // CustomerMilkLog में field = user
      // ======================================================

      CustomerMilkLog.find({
        user: userId,
        date: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }).lean(),

      // ======================================================
      // TODAY PRODUCTION MILK
      // MilkLog में field = user
      // ======================================================

      MilkLog.find({
        user: userId,
        date: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }).lean(),

      // ======================================================
      // TODAY EXPENSE
      // Expense में field = userId
      // ======================================================

      Expense.find({
        userId,
        date: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }).lean(),

      // ======================================================
      // MONTH CUSTOMER MILK
      // ======================================================

      CustomerMilkLog.find({
        user: userId,
        date: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      })
        .populate("customer", "name customerCode phone")
        .sort({
          date: -1,
          createdAt: -1,
        })
        .lean(),

      // ======================================================
      // MONTH PRODUCTION MILK
      // ======================================================

      MilkLog.find({
        user: userId,
        date: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      }).lean(),

      // ======================================================
      // MONTH PAYMENTS
      // ======================================================

      CustomerPayment.find({
        userId,
        paymentDate: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
        status: "completed",
      }).lean(),

      // ======================================================
      // MONTH EXPENSE
      // ======================================================

      Expense.find({
        userId,
        date: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      }).lean(),

      // ======================================================
      // RECENT CUSTOMER MILK
      // ======================================================

      CustomerMilkLog.find({
        user: userId,
      })
        .populate("customer", "name phone customerCode")
        .sort({
          date: -1,
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      // ======================================================
      // RECENT EXPENSES
      // ======================================================

      Expense.find({
        userId,
      })
        .sort({
          date: -1,
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      // ======================================================
      // RECENT PAYMENTS
      // ======================================================

      CustomerPayment.find({
        userId,
        status: "completed",
      })
        .populate("customerId", "name phone customerCode")
        .sort({
          paymentDate: -1,
          createdAt: -1,
        })
        .limit(10)
        .lean(),
    ]);

    // ========================================================
    // DEBUG - CATTLE
    // ========================================================

    console.log("CATTLE DASHBOARD:", {
      totalCows,
      milkingCows,
      nonMilkingCows,
      userId,
    });

    // ========================================================
    // TODAY CUSTOMER MILK
    // ========================================================

    const todayCustomerMorningMilk = todayCustomerMilk.reduce(
      (sum, item) => sum + Number(item.morningMilk || 0),
      0,
    );

    const todayCustomerEveningMilk = todayCustomerMilk.reduce(
      (sum, item) => sum + Number(item.eveningMilk || 0),
      0,
    );

    const todayCustomerMilkTotal = todayCustomerMilk.reduce(
      (sum, item) => sum + Number(item.totalMilk || 0),
      0,
    );

    const todayCustomerAmount = todayCustomerMilk.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    // ========================================================
    // TODAY PRODUCTION
    // ========================================================

    const todayProductionMorning = todayProductionMilk.reduce(
      (sum, item) => sum + Number(item.morningMilk || 0),
      0,
    );

    const todayProductionEvening = todayProductionMilk.reduce(
      (sum, item) => sum + Number(item.eveningMilk || 0),
      0,
    );

    const todayProductionTotal = todayProductionMilk.reduce(
      (sum, item) =>
        sum +
        Number(
          item.totalMilk ||
            Number(item.morningMilk || 0) + Number(item.eveningMilk || 0),
        ),
      0,
    );

    // ========================================================
    // TODAY EXPENSE
    // ========================================================

    const todayExpenseTotal = todayExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    // ========================================================
    // MONTH CUSTOMER MILK
    // ========================================================

    const monthlyCustomerMilkTotal = monthlyCustomerMilk.reduce(
      (sum, item) => sum + Number(item.totalMilk || 0),
      0,
    );

    const monthlyCustomerMilkAmount = monthlyCustomerMilk.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    // ========================================================
    // MONTH PRODUCTION
    // ========================================================

    const monthlyProductionMorning = monthlyProductionMilk.reduce(
      (sum, item) => sum + Number(item.morningMilk || 0),
      0,
    );

    const monthlyProductionEvening = monthlyProductionMilk.reduce(
      (sum, item) => sum + Number(item.eveningMilk || 0),
      0,
    );

    const monthlyProductionTotal = monthlyProductionMilk.reduce(
      (sum, item) =>
        sum +
        Number(
          item.totalMilk ||
            Number(item.morningMilk || 0) + Number(item.eveningMilk || 0),
        ),
      0,
    );

    // ========================================================
    // MONTH PAYMENTS
    // ========================================================

    const monthlyPaymentTotal = monthlyPayments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    // ========================================================
    // MONTH EXPENSE
    // ========================================================

    const monthlyExpenseTotal = monthlyExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    // ========================================================
    // CUSTOMER PENDING
    // ========================================================

    const monthlyPending = monthlyCustomerMilkAmount - monthlyPaymentTotal;

    // ========================================================
    // REMAINING MILK
    // ========================================================

    const monthlyRemainingMilk = Math.max(
      monthlyProductionTotal - monthlyCustomerMilkTotal,
      0,
    );

    const todayRemainingMilk = Math.max(
      todayProductionTotal - todayCustomerMilkTotal,
      0,
    );

    // ========================================================
    // MILK SALE %
    // ========================================================

    const monthlyMilkSalePercentage =
      monthlyProductionTotal > 0
        ? (monthlyCustomerMilkTotal / monthlyProductionTotal) * 100
        : 0;

    // ========================================================
    // DAILY AVERAGE
    // ========================================================

    const currentDay = now.getDate();

    const monthlyAverageProduction =
      currentDay > 0 ? monthlyProductionTotal / currentDay : 0;

    const monthlyAverageCustomerMilk =
      currentDay > 0 ? monthlyCustomerMilkTotal / currentDay : 0;

    // ========================================================
    // FINAL DASHBOARD DATA
    // ========================================================

    const dashboardData = {
      // ======================================================
      // CATTLE
      // ======================================================

      cows: {
        total: Number(totalCows || 0),
        milking: Number(milkingCows || 0),
        nonMilking: Number(nonMilkingCows || 0),

        // Frontend में alternative names के लिए भी
        totalCows: Number(totalCows || 0),
        milkingCows: Number(milkingCows || 0),
        nonMilkingCows: Number(nonMilkingCows || 0),
      },

      // ======================================================
      // CUSTOMERS
      // ======================================================

      customers: {
        total: Number(totalCustomers || 0),
        active: Number(totalCustomers || 0),
      },

      // ======================================================
      // TODAY
      // ======================================================

      today: {
        productionMorning: round(todayProductionMorning),
        productionEvening: round(todayProductionEvening),

        morningMilk: round(todayProductionMorning),
        eveningMilk: round(todayProductionEvening),

        productionMilk: round(todayProductionTotal),

        customerMorningMilk: round(todayCustomerMorningMilk),
        customerEveningMilk: round(todayCustomerEveningMilk),

        customerMilk: round(todayCustomerMilkTotal),

        totalMilk: round(todayProductionTotal),

        soldMilk: round(todayCustomerMilkTotal),

        remainingMilk: round(todayRemainingMilk),

        milkSaleAmount: round(todayCustomerAmount),

        expense: round(todayExpenseTotal),
      },

      // ======================================================
      // MONTH
      // ======================================================

      month: {
        production: round(monthlyProductionTotal),

        productionMilk: round(monthlyProductionTotal),

        morningProduction: round(monthlyProductionMorning),

        eveningProduction: round(monthlyProductionEvening),

        milk: round(monthlyCustomerMilkTotal),

        customerMilk: round(monthlyCustomerMilkTotal),

        milkAmount: round(monthlyCustomerMilkAmount),

        payments: round(monthlyPaymentTotal),

        expenses: round(monthlyExpenseTotal),

        expense: round(monthlyExpenseTotal),

        pending: round(Math.max(monthlyPending, 0)),

        balance: round(monthlyPending),

        remainingMilk: round(monthlyRemainingMilk),

        milkSalePercentage: round(monthlyMilkSalePercentage),

        averageDailyProduction: round(monthlyAverageProduction),

        averageDailyCustomerMilk: round(monthlyAverageCustomerMilk),
      },

      // ======================================================
      // RECENT
      // ======================================================

      recent: {
        milkLogs: recentMilkLogs,
        expenses: recentExpenses,
        payments: recentPayments,
      },

      // ======================================================
      // SUMMARY
      // ======================================================

      summary: {
        totalProduction: round(monthlyProductionTotal),

        totalCustomerMilk: round(monthlyCustomerMilkTotal),

        totalPayments: round(monthlyPaymentTotal),

        totalExpenses: round(monthlyExpenseTotal),

        pendingAmount: round(Math.max(monthlyPending, 0)),

        netAmount: round(monthlyPaymentTotal - monthlyExpenseTotal),
      },
    };

    // ========================================================
    // FINAL LOG
    // ========================================================

    console.log("DASHBOARD FINAL:", {
      userId,

      cows: dashboardData.cows,

      customers: dashboardData.customers,

      production: dashboardData.month.production,

      customerMilk: dashboardData.month.customerMilk,

      payments: dashboardData.month.payments,

      expenses: dashboardData.month.expenses,

      pending: dashboardData.month.pending,
    });

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Dashboard data loaded successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("==============================================");
    console.error("DASHBOARD ERROR:", error);
    console.error("==============================================");

    return res.status(500).json({
      success: false,
      message: "Dashboard data load नहीं हो पाया",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getDashboard,
};

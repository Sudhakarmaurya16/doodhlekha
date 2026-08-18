const mongoose = require("mongoose");
const Expense = require("../models/Expense");

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

const getUserId = (req) => {
  return req.user?.id;
};

/*
|--------------------------------------------------------------------------
| CREATE EXPENSE
|--------------------------------------------------------------------------
*/

const createExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    /*
    |--------------------------------------------------------------------------
    | AUTH CHECK
    |--------------------------------------------------------------------------
    */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST DATA
    |--------------------------------------------------------------------------
    */

    const { date, category, amount, description, paymentMethod, notes } =
      req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Expense category is required",
      });
    }

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const expenseAmount = Number(amount);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    const expenseDate = new Date(date);

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense date",
      });
    }

    expenseDate.setHours(0, 0, 0, 0);

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    const expense = await Expense.create({
      userId,

      date: expenseDate,

      category,

      amount: expenseAmount,

      description: description?.trim() || "",

      paymentMethod: paymentMethod || "cash",

      notes: notes?.trim() || "",
    });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: "Expense successfully added",
      data: expense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Expense save नहीं हो पाया",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET EXPENSES
|--------------------------------------------------------------------------
|
| GET /api/expenses
|
| Optional:
|
| ?startDate=2026-08-01
| ?endDate=2026-08-31
| ?category=feed
|
|--------------------------------------------------------------------------
*/

const getExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY
    |--------------------------------------------------------------------------
    */

    const { startDate, endDate, category } = req.query;

    /*
    |--------------------------------------------------------------------------
    | BASE FILTER
    |--------------------------------------------------------------------------
    |
    | सबसे important:
    |
    | सिर्फ logged-in user का data।
    |
    */

    const filter = {
      userId,
    };

    /*
    |--------------------------------------------------------------------------
    | DATE FILTER
    |--------------------------------------------------------------------------
    */

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);

        filter.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);

        filter.date.$lte = end;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY FILTER
    |--------------------------------------------------------------------------
    */

    if (category && category !== "all") {
      filter.category = category;
    }

    /*
    |--------------------------------------------------------------------------
    | GET DATA
    |--------------------------------------------------------------------------
    */

    const expenses = await Expense.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = expenses.reduce(
      (acc, expense) => {
        const expenseAmount = Number(expense.amount) || 0;

        acc.total += expenseAmount;

        if (!acc.byCategory[expense.category]) {
          acc.byCategory[expense.category] = 0;
        }

        acc.byCategory[expense.category] += expenseAmount;

        return acc;
      },
      {
        total: 0,
        byCategory: {},
      },
    );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      count: expenses.length,

      summary,

      data: expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Expense records load नहीं हो पाए",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET TODAY EXPENSE
|--------------------------------------------------------------------------
*/

const getTodayExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TODAY
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    /*
    |--------------------------------------------------------------------------
    | USER-WISE QUERY
    |--------------------------------------------------------------------------
    */

    const expenses = await Expense.find({
      userId,

      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({
      createdAt: -1,
    });

    /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

    const total = expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: expenses,

      total,
    });
  } catch (error) {
    console.error("Today Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Today's expenses load नहीं हुए",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET MONTHLY EXPENSE
|--------------------------------------------------------------------------
|
| GET /api/expenses/monthly?year=2026&month=8
|
|--------------------------------------------------------------------------
*/

const getMonthlyExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | YEAR / MONTH
    |--------------------------------------------------------------------------
    */

    const year = Number(req.query.year);

    const month = Number(req.query.month);

    const now = new Date();

    const selectedYear =
      Number.isInteger(year) && year >= 2000 ? year : now.getFullYear();

    const selectedMonth =
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : now.getMonth() + 1;

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);

    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedYear, selectedMonth, 0);

    endDate.setHours(23, 59, 59, 999);

    /*
    |--------------------------------------------------------------------------
    | USER-WISE QUERY
    |--------------------------------------------------------------------------
    */

    const expenses = await Expense.find({
      userId,

      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({
      date: -1,
      createdAt: -1,
    });

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = expenses.reduce(
      (acc, expense) => {
        const amount = Number(expense.amount || 0);

        acc.total += amount;

        if (!acc.byCategory[expense.category]) {
          acc.byCategory[expense.category] = 0;
        }

        acc.byCategory[expense.category] += amount;

        return acc;
      },
      {
        total: 0,
        byCategory: {},
      },
    );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      period: {
        year: selectedYear,
        month: selectedMonth,
      },

      summary,

      data: expenses,
    });
  } catch (error) {
    console.error("Monthly Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Monthly expense load नहीं हुआ",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE EXPENSE
|--------------------------------------------------------------------------
|
| Important:
| यहाँ सिर्फ उसी user का expense update होगा।
|
|--------------------------------------------------------------------------
*/

const updateExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND OWN EXPENSE
    |--------------------------------------------------------------------------
    */

    const expense = await Expense.findOne({
      _id: req.params.id,

      userId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record नहीं मिला",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST DATA
    |--------------------------------------------------------------------------
    */

    const { date, category, amount, description, paymentMethod, notes } =
      req.body;

    /*
    |--------------------------------------------------------------------------
    | AMOUNT VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      amount !== undefined &&
      (Number.isNaN(Number(amount)) || Number(amount) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount 0 से ज्यादा होना चाहिए",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    if (date) {
      const updatedDate = new Date(date);

      if (Number.isNaN(updatedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expense date",
        });
      }

      updatedDate.setHours(0, 0, 0, 0);

      expense.date = updatedDate;
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (category) {
      expense.category = category;
    }

    /*
    |--------------------------------------------------------------------------
    | AMOUNT
    |--------------------------------------------------------------------------
    */

    if (amount !== undefined) {
      expense.amount = Number(amount);
    }

    /*
    |--------------------------------------------------------------------------
    | DESCRIPTION
    |--------------------------------------------------------------------------
    */

    if (description !== undefined) {
      expense.description = description?.trim() || "";
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD
    |--------------------------------------------------------------------------
    */

    if (paymentMethod) {
      expense.paymentMethod = paymentMethod;
    }

    /*
    |--------------------------------------------------------------------------
    | NOTES
    |--------------------------------------------------------------------------
    */

    if (notes !== undefined) {
      expense.notes = notes?.trim() || "";
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await expense.save();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message: "Expense successfully updated",

      data: expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Expense update नहीं हो पाया",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE EXPENSE
|--------------------------------------------------------------------------
|
| सिर्फ उसी user का expense delete होगा।
|
|--------------------------------------------------------------------------
*/

const deleteExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | USER-WISE DELETE
    |--------------------------------------------------------------------------
    */

    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,

      userId,
    });

    /*
    |--------------------------------------------------------------------------
    | NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record नहीं मिला",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message: "Expense successfully deleted",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Expense delete नहीं हो पाया",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  createExpense,
  getExpenses,
  getTodayExpense,
  getMonthlyExpense,
  updateExpense,
  deleteExpense,
};

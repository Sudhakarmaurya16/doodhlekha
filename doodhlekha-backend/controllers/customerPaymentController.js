const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const CustomerPayment = require("../models/CustomerPayment");

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

const getISTMonthRange = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (monthNumber < 1 || monthNumber > 12) {
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
  };
};

// ============================================================
// ADD PAYMENT
// POST /api/customer-payments/:customerId
// ============================================================

const addPayment = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Login session invalid है। फिर से login करें।",
      });
    }

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Customer ID सही नहीं है।",
      });
    }

    // ========================================================
    // CUSTOMER + USER CHECK
    // ========================================================

    const customer = await Customer.findOne({
      _id: customerId,
      user: userId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "यह customer आपके account में नहीं मिला।",
      });
    }

    if (customer.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "यह customer inactive है।",
      });
    }

    // ========================================================
    // AMOUNT
    // ========================================================

    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "कृपया सही payment amount डालें।",
      });
    }

    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    const allowedMethods = ["cash", "upi", "bank", "cheque"];

    const paymentMethod = req.body.paymentMethod || "cash";

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method सही नहीं है।",
      });
    }

    // ========================================================
    // PAYMENT DATE - IST
    // ========================================================

    let paymentDate = new Date();

    if (req.body.paymentDate) {
      paymentDate = new Date(`${req.body.paymentDate}T00:00:00+05:30`);

      if (Number.isNaN(paymentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Payment date सही नहीं है।",
        });
      }
    }

    // ========================================================
    // SAVE
    // IMPORTANT: userId MUST BE SAVED
    // ========================================================

    const payment = await CustomerPayment.create({
      userId,
      customerId: customer._id,
      amount: round(amount),
      paymentDate,
      paymentMethod,
      note: typeof req.body.note === "string" ? req.body.note.trim() : "",
      status: "completed",
    });

    const savedPayment = await CustomerPayment.findById(payment._id)
      .populate("customerId", "name customerCode phone milkType")
      .lean();

    console.log("=================================");
    console.log("PAYMENT SAVED SUCCESSFULLY");
    console.log({
      paymentId: payment._id,
      userId,
      customerId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
    });
    console.log("=================================");

    return res.status(201).json({
      success: true,
      message: "Payment सफलतापूर्वक जमा हो गया।",
      data: savedPayment,
    });
  } catch (error) {
    console.error("ADD PAYMENT ERROR:", error);

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {})
        .map((item) => item.message)
        .filter(Boolean);

      return res.status(400).json({
        success: false,
        message: messages.join(", ") || "Payment data सही नहीं है।",
      });
    }

    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Payment data सही format में नहीं है।",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment save नहीं हो सका।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// GET PAYMENTS
// GET /api/customer-payments/:customerId
// ?month=2026-08
// ============================================================

const getCustomerPayments = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { customerId } = req.params;
    const { month } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      user: userId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    const query = {
      userId,
      customerId,
      status: "completed",
    };

    if (month) {
      const range = getISTMonthRange(month);

      if (!range) {
        return res.status(400).json({
          success: false,
          message: "Month format YYYY-MM होना चाहिए।",
        });
      }

      query.paymentDate = {
        $gte: range.start,
        $lt: range.end,
      };
    }

    const payments = await CustomerPayment.find(query)
      .populate("customerId", "name customerCode phone milkType")
      .sort({
        paymentDate: -1,
        createdAt: -1,
      })
      .lean();

    const totalPaid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      totalPaid: round(totalPaid),
      data: payments,
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment history load नहीं हो पाई।",
    });
  }
};

// ============================================================
// CANCEL PAYMENT
// DELETE /api/customer-payments/payment/:paymentId
// ============================================================

const cancelPayment = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { paymentId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID.",
      });
    }

    const payment = await CustomerPayment.findOne({
      _id: paymentId,
      userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment नहीं मिला।",
      });
    }

    payment.status = "cancelled";

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment cancel हो गया।",
    });
  } catch (error) {
    console.error("CANCEL PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment cancel नहीं हो पाया।",
    });
  }
};

module.exports = {
  addPayment,
  getCustomerPayments,
  cancelPayment,
};

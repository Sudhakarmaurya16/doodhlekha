const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const CustomerPayment = require("../models/CustomerPayment");

/* =========================================================
   MONTH RANGE
========================================================= */

const getMonthRange = (month) => {
  let year;
  let monthNumber;

  if (!month) {
    const now = new Date();

    year = now.getFullYear();
    monthNumber = now.getMonth() + 1;
  } else {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month).trim());

    if (!match) {
      return {
        error: "Month format YYYY-MM होना चाहिए",
      };
    }

    year = Number(match[1]);
    monthNumber = Number(match[2]);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100 ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return {
        error: "Invalid month",
      };
    }
  }

  const start = new Date(year, monthNumber - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, monthNumber, 1);
  end.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    year,
    month: monthNumber,
    monthKey: `${year}-${String(monthNumber).padStart(2, "0")}`,
  };
};

/* =========================================================
   DATE RANGE
========================================================= */

const getDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      error: "Start date और end date दोनों जरूरी हैं",
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      error: "Invalid date range",
    };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start > end) {
    return {
      error: "Start date end date से बड़ी नहीं हो सकती",
    };
  }

  return {
    start,
    end,
  };
};

/* =========================================================
   VALIDATE USER ID
========================================================= */

const validateUserId = (userId) => {
  if (!userId) {
    const error = new Error("Authentication required");

    error.statusCode = 401;

    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user");

    error.statusCode = 401;

    throw error;
  }

  return new mongoose.Types.ObjectId(userId);
};

/* =========================================================
   VALIDATE CUSTOMER ID
========================================================= */

const validateCustomerId = (customerId) => {
  if (!customerId) {
    const error = new Error("Customer ID is required");

    error.statusCode = 400;

    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    const error = new Error("Invalid customer ID");

    error.statusCode = 400;

    throw error;
  }

  return new mongoose.Types.ObjectId(customerId);
};

/* =========================================================
   ENSURE CUSTOMER BELONGS TO LOGGED-IN USER
========================================================= */

const ensureCustomer = async (customerId, userId) => {
  const validCustomerId = validateCustomerId(customerId);
  const validUserId = validateUserId(userId);

  const customer = await Customer.findOne({
    _id: validCustomerId,
    userId: validUserId,
  }).lean();

  if (!customer) {
    const error = new Error("Customer नहीं मिला");

    error.statusCode = 404;

    throw error;
  }

  return customer;
};

/* =========================================================
   ROUND MONEY
========================================================= */

const roundMoney = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
};

/* =========================================================
   GET CUSTOMER MONTHLY LEDGER
========================================================= */

const getCustomerMonthlyLedger = async (customerId, month, userId) => {
  /* =======================================================
     USER
  ======================================================= */

  const validUserId = validateUserId(userId);

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const customer = await ensureCustomer(customerId, validUserId);

  /* =======================================================
     MONTH
  ======================================================= */

  const monthData = getMonthRange(month);

  if (monthData.error) {
    const error = new Error(monthData.error);

    error.statusCode = 400;

    throw error;
  }

  const { start, end, year, month: monthNumber, monthKey } = monthData;

  /* =======================================================
     DATABASE REQUESTS
  ======================================================= */

  const [milkLogs, payments] = await Promise.all([
    CustomerMilkLog.find({
      customer: customer._id,

      userId: validUserId,

      date: {
        $gte: start,
        $lt: end,
      },
    })
      .sort({
        date: 1,
      })
      .lean(),

    CustomerPayment.find({
      customerId: customer._id,

      userId: validUserId,

      paymentDate: {
        $gte: start,
        $lt: end,
      },

      status: "completed",
    })
      .sort({
        paymentDate: 1,
        createdAt: 1,
      })
      .lean(),
  ]);

  /* =======================================================
     MILK CALCULATION
  ======================================================= */

  let totalMilk = 0;
  let morningMilk = 0;
  let eveningMilk = 0;
  let totalAmount = 0;

  milkLogs.forEach((log) => {
    const morning = Number(log.morningMilk || 0);
    const evening = Number(log.eveningMilk || 0);

    const calculatedMilk = morning + evening;

    const milk =
      log.totalMilk !== undefined && log.totalMilk !== null
        ? Number(log.totalMilk)
        : calculatedMilk;

    const amount = Number(log.amount || 0);

    morningMilk += morning;
    eveningMilk += evening;
    totalMilk += milk;
    totalAmount += amount;
  });

  /* =======================================================
     PAYMENT CALCULATION
  ======================================================= */

  let totalPaid = 0;

  payments.forEach((payment) => {
    totalPaid += Number(payment.amount || 0);
  });

  /* =======================================================
     ROUNDING
  ======================================================= */

  totalMilk = roundMoney(totalMilk);
  morningMilk = roundMoney(morningMilk);
  eveningMilk = roundMoney(eveningMilk);
  totalAmount = roundMoney(totalAmount);
  totalPaid = roundMoney(totalPaid);

  /* =======================================================
     PENDING
  ======================================================= */

  const pendingAmount = roundMoney(Math.max(totalAmount - totalPaid, 0));

  /* =======================================================
     ADVANCE
  ======================================================= */

  const advanceAmount = roundMoney(Math.max(totalPaid - totalAmount, 0));

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  let paymentStatus = "pending";

  if (totalAmount <= 0) {
    paymentStatus = "no_bill";
  } else if (totalPaid >= totalAmount) {
    paymentStatus = "paid";
  } else if (totalPaid > 0) {
    paymentStatus = "partial";
  }

  /* =======================================================
     CLEAN MILK LOGS
  ======================================================= */

  const cleanLogs = milkLogs.map((log) => ({
    _id: log._id,

    customer: log.customer,

    date: log.date,

    morningMilk: Number(log.morningMilk || 0),

    eveningMilk: Number(log.eveningMilk || 0),

    totalMilk: Number(log.totalMilk || 0),

    rate: Number(log.rate || 0),

    amount: roundMoney(log.amount || 0),

    notes: log.notes || "",
  }));

  /* =======================================================
     CLEAN PAYMENTS
  ======================================================= */

  const cleanPayments = payments.map((payment) => ({
    _id: payment._id,

    customerId: payment.customerId,

    amount: roundMoney(payment.amount),

    paymentDate: payment.paymentDate,

    paymentMethod: payment.paymentMethod,

    note: payment.note || "",

    status: payment.status,
  }));

  /* =======================================================
     FINAL RESPONSE
  ======================================================= */

  return {
    customer: {
      _id: customer._id,

      name: customer.name,

      customerCode: customer.customerCode,

      phone: customer.phone,

      milkType: customer.milkType,

      defaultRate: Number(customer.defaultRate || 0),

      status: customer.status,
    },

    period: {
      year,

      month: monthNumber,

      monthKey,

      startDate: start,

      endDate: end,
    },

    summary: {
      totalMilk,

      morningMilk,

      eveningMilk,

      totalAmount,

      totalPaid,

      pendingAmount,

      advanceAmount,

      paymentStatus,
    },

    logs: cleanLogs,

    payments: cleanPayments,
  };
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getMonthRange,

  getDateRange,

  ensureCustomer,

  getCustomerMonthlyLedger,

  roundMoney,
};

const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const CustomerMilkLog = require("../models/CustomerMilkLog");
const CustomerPayment = require("../models/CustomerPayment");

// =====================================================
// HELPERS
// =====================================================

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

const round = (value) => Number(Number(value || 0).toFixed(2));

const noCache = (res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
};

// =====================================================
// IST MONTH RANGE
// =====================================================

const getCurrentMonthRange = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0, 0);

  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);

  return {
    start,
    end,
  };
};

// =====================================================
// GENERATE CUSTOMER CODE
// =====================================================

const generateCustomerCode = async (userId) => {
  const lastCustomer = await Customer.findOne({
    user: userId,
  })
    .sort({
      createdAt: -1,
    })
    .select("customerCode")
    .lean();

  if (!lastCustomer) {
    return "CUS-0001";
  }

  const match = String(lastCustomer.customerCode || "").match(/CUS-(\d+)/);

  if (!match) {
    return "CUS-0001";
  }

  const lastNumber = Number(match[1]);

  return `CUS-${String(lastNumber + 1).padStart(4, "0")}`;
};

// =====================================================
// CREATE CUSTOMER
// POST /api/customers
// =====================================================

const createCustomer = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. कृपया दोबारा login करें।",
      });
    }

    const {
      name,
      phone,
      alternatePhone,
      address,
      village,
      customerType,
      milkType,
      defaultRate,
      joiningDate,
      notes,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer phone number is required.",
      });
    }

    const cleanPhone = String(phone).trim();

    // Same farmer + same phone duplicate check
    const existingCustomer = await Customer.findOne({
      user: userId,
      phone: cleanPhone,
      status: "active",
    }).lean();

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "इस mobile number से customer पहले से मौजूद है।",
      });
    }

    const customerCode = await generateCustomerCode(userId);

    const rate = Number(defaultRate || 0);

    if (!Number.isFinite(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Milk rate सही नहीं है।",
      });
    }

    const customer = await Customer.create({
      user: userId,
      customerCode,

      name: String(name).trim(),

      phone: cleanPhone,

      alternatePhone:
        typeof alternatePhone === "string" ? alternatePhone.trim() : "",

      address: typeof address === "string" ? address.trim() : "",

      village: typeof village === "string" ? village.trim() : "",

      customerType: customerType || "home",

      milkType: milkType || "cow",

      defaultRate: rate,

      joiningDate: joiningDate || new Date(),

      notes: typeof notes === "string" ? notes.trim() : "",

      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Customer successfully added.",
      data: customer,
    });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Customer code या mobile number पहले से मौजूद है।",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Customer save नहीं हो पाया।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

const getCustomers = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { search = "", status = "active" } = req.query;

    const filter = {
      user: userId,
    };

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    if (status !== "all") {
      filter.status = status;
    }

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (String(search).trim()) {
      const searchText = String(search).trim();

      filter.$or = [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          customerCode: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    const customers = await Customer.find(filter)
      .select("-__v")
      .sort({
        createdAt: -1,
      })
      .lean();

    if (customers.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // =================================================
    // CURRENT MONTH
    // =================================================

    const { start, end } = getCurrentMonthRange();

    const customerIds = customers.map((customer) => customer._id);

    // =================================================
    // MILK SUMMARY
    // =================================================

    const milkSummary = await CustomerMilkLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),

          customer: {
            $in: customerIds,
          },

          date: {
            $gte: start,
            $lt: end,
          },
        },
      },

      {
        $group: {
          _id: "$customer",

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

          totalAmount: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },
        },
      },
    ]);

    // =================================================
    // PAYMENT SUMMARY
    // IMPORTANT:
    // Payment अलग CustomerPayment collection में है
    // =================================================

    const paymentSummary = await CustomerPayment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),

          customerId: {
            $in: customerIds,
          },

          status: "completed",

          paymentDate: {
            $gte: start,
            $lt: end,
          },
        },
      },

      {
        $group: {
          _id: "$customerId",

          totalPaid: {
            $sum: {
              $ifNull: ["$amount", 0],
            },
          },

          paymentCount: {
            $sum: 1,
          },
        },
      },
    ]);

    // =================================================
    // MAP MILK DATA
    // =================================================

    const milkMap = new Map();

    milkSummary.forEach((item) => {
      milkMap.set(String(item._id), {
        morningMilk: round(item.morningMilk),
        eveningMilk: round(item.eveningMilk),
        totalMilk: round(item.totalMilk),
        totalAmount: round(item.totalAmount),
      });
    });

    // =================================================
    // MAP PAYMENT DATA
    // =================================================

    const paymentMap = new Map();

    paymentSummary.forEach((item) => {
      paymentMap.set(String(item._id), {
        totalPaid: round(item.totalPaid),
        paymentCount: Number(item.paymentCount || 0),
      });
    });

    // =================================================
    // FINAL CUSTOMER DATA
    // =================================================

    const finalCustomers = customers.map((customer) => {
      const id = String(customer._id);

      const milk = milkMap.get(id) || {
        morningMilk: 0,
        eveningMilk: 0,
        totalMilk: 0,
        totalAmount: 0,
      };

      const payment = paymentMap.get(id) || {
        totalPaid: 0,
        paymentCount: 0,
      };

      const totalBill = round(milk.totalAmount);

      const totalPaid = round(payment.totalPaid);

      // Pending कभी negative नहीं होगा
      const pendingAmount = round(Math.max(totalBill - totalPaid, 0));

      // अगर customer ने bill से ज्यादा payment कर दी
      const advanceAmount = round(Math.max(totalPaid - totalBill, 0));

      return {
        ...customer,

        // =================================================
        // CARD SUMMARY
        // =================================================

        summary: {
          morningMilk: milk.morningMilk,

          eveningMilk: milk.eveningMilk,

          totalMilk: milk.totalMilk,

          totalAmount: totalBill,

          totalBill,

          totalPaid,

          pendingAmount,

          advanceAmount,

          paymentCount: payment.paymentCount,

          paymentStatus:
            pendingAmount > 0 ? "pending" : totalBill > 0 ? "paid" : "no_bill",

          month: `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1,
          ).padStart(2, "0")}`,
        },
      };
    });

    console.log(
      "CUSTOMER LIST SUMMARY:",
      finalCustomers.map((item) => ({
        id: item._id,
        name: item.name,
        bill: item.summary.totalBill,
        paid: item.summary.totalPaid,
        pending: item.summary.pendingAmount,
      })),
    );

    return res.status(200).json({
      success: true,
      count: finalCustomers.length,
      data: finalCustomers,
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Customer records load नहीं हो पाए।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// =====================================================

const getCustomerById = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      user: userId,
    })
      .select("-__v")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    // =================================================
    // CURRENT MONTH SUMMARY
    // =================================================

    const { start, end } = getCurrentMonthRange();

    const customerObjectId = new mongoose.Types.ObjectId(id);

    const [milkResult, paymentResult] = await Promise.all([
      CustomerMilkLog.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),

            customer: customerObjectId,

            date: {
              $gte: start,
              $lt: end,
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
      ]),

      CustomerPayment.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),

            customerId: customerObjectId,

            status: "completed",

            paymentDate: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: null,

            totalPaid: {
              $sum: {
                $ifNull: ["$amount", 0],
              },
            },

            paymentCount: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const milk = milkResult[0] || {};

    const payment = paymentResult[0] || {};

    const totalBill = round(milk.totalAmount);

    const totalPaid = round(payment.totalPaid);

    const pendingAmount = round(Math.max(totalBill - totalPaid, 0));

    const advanceAmount = round(Math.max(totalPaid - totalBill, 0));

    return res.status(200).json({
      success: true,

      data: {
        ...customer,

        summary: {
          morningMilk: round(milk.morningMilk),

          eveningMilk: round(milk.eveningMilk),

          totalMilk: round(milk.totalMilk),

          totalAmount: totalBill,

          totalBill,

          totalPaid,

          pendingAmount,

          advanceAmount,

          paymentCount: Number(payment.paymentCount || 0),
        },
      },
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Customer load नहीं हो पाया।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// =====================================================

const updateCustomer = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      user: userId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    const {
      name,
      phone,
      alternatePhone,
      address,
      village,
      customerType,
      milkType,
      defaultRate,
      joiningDate,
      status,
      notes,
    } = req.body;

    // =================================================
    // NAME
    // =================================================

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot be empty.",
        });
      }

      customer.name = cleanName;
    }

    // =================================================
    // PHONE
    // =================================================

    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();

      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          message: "Customer phone cannot be empty.",
        });
      }

      const duplicate = await Customer.findOne({
        user: userId,
        phone: cleanPhone,
        _id: {
          $ne: customer._id,
        },
        status: "active",
      }).lean();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "यह mobile number किसी दूसरे customer के पास है।",
        });
      }

      customer.phone = cleanPhone;
    }

    // =================================================
    // OTHER FIELDS
    // =================================================

    if (alternatePhone !== undefined) {
      customer.alternatePhone =
        typeof alternatePhone === "string" ? alternatePhone.trim() : "";
    }

    if (address !== undefined) {
      customer.address = typeof address === "string" ? address.trim() : "";
    }

    if (village !== undefined) {
      customer.village = typeof village === "string" ? village.trim() : "";
    }

    if (customerType !== undefined) {
      customer.customerType = customerType;
    }

    if (milkType !== undefined) {
      customer.milkType = milkType;
    }

    if (defaultRate !== undefined) {
      const rate = Number(defaultRate);

      if (!Number.isFinite(rate) || rate < 0) {
        return res.status(400).json({
          success: false,
          message: "Milk rate सही नहीं है।",
        });
      }

      customer.defaultRate = rate;
    }

    if (joiningDate !== undefined) {
      customer.joiningDate = joiningDate;
    }

    if (status !== undefined) {
      customer.status = status;
    }

    if (notes !== undefined) {
      customer.notes = typeof notes === "string" ? notes.trim() : "";
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer successfully updated.",
      data: customer,
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Customer data already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Customer update नहीं हो पाया।",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// DELETE / DEACTIVATE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

const deleteCustomer = async (req, res) => {
  noCache(res);

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: id,
        user: userId,
      },
      {
        $set: {
          status: "inactive",
        },
      },
      {
        new: true,
      },
    ).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer नहीं मिला।",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer successfully deactivated.",
      data: customer,
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Customer deactivate नहीं हो पाया।",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};

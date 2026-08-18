import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./CustomerLedger.css";

const CustomerLedger = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const customerId = params.customerId || params.id;

  const [customer, setCustomer] = useState(null);

  const [summary, setSummary] = useState(null);

  const [milkLogs, setMilkLogs] = useState([]);

  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [month, setMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  });

  // =========================================================
  // FORMAT NUMBER
  // =========================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // LOAD CUSTOMER
  // =========================================================

  const loadCustomer = useCallback(async () => {
    if (!customerId) {
      throw new Error("Customer ID नहीं मिला");
    }

    // CustomerCard से customer already मिला हो तो वही use करें
    const stateCustomer = location.state?.customer;

    if (stateCustomer && String(stateCustomer?._id) === String(customerId)) {
      setCustomer(stateCustomer);

      return stateCustomer;
    }

    // Direct URL / refresh fallback
    const response = await api.get("/customers", {
      params: {
        status: "active",
      },
    });

    const customers = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.customers)
        ? response.data.customers
        : [];

    const foundCustomer = customers.find(
      (item) => String(item?._id) === String(customerId),
    );

    if (!foundCustomer) {
      throw new Error("Customer नहीं मिला");
    }

    setCustomer(foundCustomer);

    return foundCustomer;
  }, [customerId, location.state]);

  // =========================================================
  // LOAD LEDGER
  // =========================================================

  const loadLedger = useCallback(
    async (showLoader = true) => {
      if (!customerId) return;

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        // Customer
        await loadCustomer();

        // Monthly summary
        const summaryResponse = await api.get(
          `/customer-milk/${customerId}/monthly-summary`,
          {
            params: {
              month,
            },
          },
        );

        const summaryData = summaryResponse.data?.data || {};

        setSummary(summaryData?.summary || null);

        // Milk history
        const milkResponse = await api.get(`/customer-milk/${customerId}`, {
          params: {
            month,
          },
        });

        setMilkLogs(
          Array.isArray(milkResponse.data?.data) ? milkResponse.data.data : [],
        );

        // Payment history
        const paymentResponse = await api.get(
          `/customer-payments/${customerId}`,
          {
            params: {
              month,
            },
          },
        );

        setPayments(
          Array.isArray(paymentResponse.data?.data)
            ? paymentResponse.data.data
            : [],
        );
      } catch (err) {
        console.error("Customer Ledger Error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Customer का हिसाब load नहीं हो पाया",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId, month, loadCustomer],
  );

  // =========================================================
  // INITIAL LOAD / MONTH CHANGE
  // =========================================================

  useEffect(() => {
    loadLedger(true);
  }, [loadLedger]);

  // =========================================================
  // SUMMARY VALUES
  // =========================================================

  const totalMilk = Number(summary?.totalMilk || 0);

  const totalAmount = Number(summary?.totalAmount || 0);

  const totalPaid = Number(summary?.totalPaid || 0);

  const pendingAmount = Number(summary?.pendingAmount || 0);

  const advanceAmount = Number(summary?.advanceAmount || 0);

  // =========================================================
  // CALCULATED DISPLAY DATA
  // =========================================================

  const totalDays = useMemo(() => {
    return milkLogs.length;
  }, [milkLogs]);

  const totalMorningMilk = useMemo(() => {
    return milkLogs.reduce(
      (total, item) => total + Number(item?.morningMilk || 0),
      0,
    );
  }, [milkLogs]);

  const totalEveningMilk = useMemo(() => {
    return milkLogs.reduce(
      (total, item) => total + Number(item?.eveningMilk || 0),
      0,
    );
  }, [milkLogs]);

  // =========================================================
  // MONTH NAME
  // =========================================================

  const monthName = useMemo(() => {
    if (!month) return "";

    const [year, monthNumber] = month.split("-");

    const date = new Date(Number(year), Number(monthNumber) - 1, 1);

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  // =========================================================
  // PAYMENT METHOD
  // =========================================================

  const getPaymentMethod = (method) => {
    const methods = {
      cash: "💵 Cash",
      upi: "📱 UPI",
      bank: "🏦 Bank",
      cheque: "🧾 Cheque",
    };

    return methods[method] || method || "-";
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    navigate("/customers");
  };

  // =========================================================
  // OPEN CUSTOMER DETAILS
  // =========================================================

  const handleCustomerDetails = () => {
    if (!customerId) return;

    navigate(`/customers/${customerId}`, {
      state: {
        customer,
      },
    });
  };

  // =========================================================
  // OPEN MONTHLY BILL
  // =========================================================

  const handleOpenBill = () => {
    if (!customerId) {
      setError("Customer ID नहीं मिला");
      return;
    }

    navigate(`/customers/${customerId}/bill`, {
      state: {
        customer,
      },
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="customer-ledger-page">
        <div className="ledger-loading">
          <div className="ledger-loading-icon">📒</div>

          <h2>हिसाब तैयार हो रहा है...</h2>

          <p>Customer ledger loading...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !customer) {
    return (
      <div className="customer-ledger-page">
        <div className="ledger-error">
          <div>⚠️</div>

          <h2>हिसाब नहीं खुल पाया</h2>

          <p>{error}</p>

          <button onClick={() => loadLedger(true)}>🔄 दोबारा कोशिश करें</button>

          <button className="secondary-btn" onClick={handleBack}>
            ← Customer List
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="customer-ledger-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="ledger-header">
        <div className="ledger-header-left">
          <button className="ledger-back-btn" onClick={handleBack} title="Back">
            ←
          </button>

          <div className="ledger-avatar">
            {customer?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <div>
            <div className="ledger-title-row">
              <h1>{customer?.name || "Customer"}</h1>

              <span className="ledger-active">Active</span>
            </div>

            <p>
              {customer?.customerCode || "No Code"}

              {customer?.phone ? ` • ${customer.phone}` : ""}
            </p>
          </div>
        </div>

        <div className="ledger-header-actions">
          <button
            type="button"
            className="ledger-bill-btn"
            onClick={handleOpenBill}
            title="Monthly Bill"
          >
            🧾
            <span>
              Monthly Bill
              <small>मासिक बिल</small>
            </span>
          </button>

          <button
            type="button"
            className="ledger-details-btn"
            onClick={handleCustomerDetails}
            title="Customer Details"
          >
            👤
            <span>
              Customer Details
              <small>ग्राहक विवरण</small>
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================
          MONTH FILTER
      ===================================================== */}

      <div className="ledger-toolbar">
        <div className="ledger-month-box">
          <span>📅</span>

          <div>
            <label>महीना चुनें</label>

            <small>Select Month</small>
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <button
          className="ledger-refresh-btn"
          onClick={() => loadLedger(false)}
          disabled={refreshing}
        >
          {refreshing ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && <div className="ledger-inline-error">⚠️ {error}</div>}

      {/* =====================================================
          MONTH TITLE
      ===================================================== */}

      <div className="ledger-period-title">
        <div>
          <h2>📒 {monthName} का पूरा हिसाब</h2>

          <p>Milk + Bill + Payment — सब एक जगह</p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="ledger-summary-grid">
        {/* MILK */}

        <div className="ledger-summary-card milk">
          <div className="summary-card-icon">🥛</div>

          <div>
            <span>कुल दूध</span>

            <small>Total Milk</small>

            <strong>
              {formatNumber(totalMilk)}
              <em>L</em>
            </strong>
          </div>
        </div>

        {/* BILL */}

        <div className="ledger-summary-card bill">
          <div className="summary-card-icon">🧾</div>

          <div>
            <span>कुल बिल</span>

            <small>Total Bill</small>

            <strong>₹{formatNumber(totalAmount)}</strong>
          </div>
        </div>

        {/* PAID */}

        <div className="ledger-summary-card paid">
          <div className="summary-card-icon">✅</div>

          <div>
            <span>जमा पैसा</span>

            <small>Total Paid</small>

            <strong>₹{formatNumber(totalPaid)}</strong>
          </div>
        </div>

        {/* PENDING */}

        <div className="ledger-summary-card pending">
          <div className="summary-card-icon">⏳</div>

          <div>
            <span>बाकी पैसा</span>

            <small>Pending</small>

            <strong>₹{formatNumber(pendingAmount)}</strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          QUICK STATS
      ===================================================== */}

      <div className="ledger-quick-stats">
        <div>
          <span>📅</span>

          <div>
            <strong>{totalDays}</strong>

            <small>Milk Days</small>
          </div>
        </div>

        <div>
          <span>🌅</span>

          <div>
            <strong>{formatNumber(totalMorningMilk)} L</strong>

            <small>Morning Milk</small>
          </div>
        </div>

        <div>
          <span>🌆</span>

          <div>
            <strong>{formatNumber(totalEveningMilk)} L</strong>

            <small>Evening Milk</small>
          </div>
        </div>

        <div>
          <span>💰</span>

          <div>
            <strong>₹{formatNumber(advanceAmount)}</strong>

            <small>Advance</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          MILK HISTORY
      ===================================================== */}

      <section className="ledger-section">
        <div className="ledger-section-header">
          <div>
            <h3>🥛 दूध का हिसाब</h3>

            <p>Milk History • {monthName}</p>
          </div>

          <span>{milkLogs.length} Records</span>
        </div>

        {milkLogs.length === 0 ? (
          <div className="ledger-empty">
            <span>🥛</span>

            <strong>इस महीने दूध की entry नहीं है</strong>

            <small>No milk records for this month</small>
          </div>
        ) : (
          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Morning</th>
                  <th>Evening</th>
                  <th>Total</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {milkLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong>{formatDate(log.date)}</strong>
                    </td>

                    <td>🌅 {formatNumber(log.morningMilk)} L</td>

                    <td>🌆 {formatNumber(log.eveningMilk)} L</td>

                    <td>
                      <strong>{formatNumber(log.totalMilk)} L</strong>
                    </td>

                    <td>₹{formatNumber(log.rate)}</td>

                    <td>
                      <strong>₹{formatNumber(log.amount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}

      <section className="ledger-section">
        <div className="ledger-section-header">
          <div>
            <h3>💰 Payment का हिसाब</h3>

            <p>Customer ने कब कितना पैसा दिया</p>
          </div>

          <span>{payments.length} Payments</span>
        </div>

        {payments.length === 0 ? (
          <div className="ledger-empty">
            <span>💰</span>

            <strong>इस महीने कोई payment नहीं है</strong>

            <small>No payment records for this month</small>
          </div>
        ) : (
          <div className="ledger-payment-list">
            {payments.map((payment) => (
              <div className="ledger-payment-row" key={payment._id}>
                <div className="payment-date-icon">💰</div>

                <div className="payment-info">
                  <strong>₹{formatNumber(payment.amount)}</strong>

                  <span>{formatDate(payment.paymentDate)}</span>
                </div>

                <div className="payment-method">
                  {getPaymentMethod(payment.paymentMethod)}
                </div>

                <div className="payment-note">{payment.note || "No note"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          FINAL BALANCE
      ===================================================== */}

      <div
        className={`ledger-balance ${
          pendingAmount > 0 ? "has-pending" : "cleared"
        }`}
      >
        <div>
          <span>
            {pendingAmount > 0
              ? "⏳ ग्राहक से पैसा लेना बाकी है"
              : "✅ पूरा हिसाब साफ है"}
          </span>

          <small>
            {pendingAmount > 0
              ? "Customer payment pending"
              : "Payment completely settled"}
          </small>
        </div>

        <strong>₹{formatNumber(pendingAmount)}</strong>
      </div>
    </div>
  );
};

export default CustomerLedger;

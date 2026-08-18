import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";

import "./CustomerBill.css";

/* =========================================================
   HELPERS
========================================================= */

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatNumber = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatMoney = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const roundMoney = (value) => {
  return Number(safeNumber(value).toFixed(2));
};

/* =========================================================
   CUSTOMER BILL
========================================================= */

const CustomerBill = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const params = useParams();

  const currentCustomerId = params.customerId || params.id;

  /* =======================================================
     STATE
  ======================================================= */

  const [customer, setCustomer] = useState(location.state?.customer || null);

  const [summary, setSummary] = useState(null);

  const [milkLogs, setMilkLogs] = useState([]);

  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [month, setMonth] = useState(getCurrentMonth());

  /* =======================================================
     PRINT MODE
  ======================================================= */

  useEffect(() => {
    document.body.classList.add("customer-bill-print-mode");

    return () => {
      document.body.classList.remove("customer-bill-print-mode");
    };
  }, []);

  /* =======================================================
     MONTH NAME
  ======================================================= */

  const monthName = useMemo(() => {
    if (!month) {
      return "";
    }

    const [year, monthNumber] = month.split("-").map(Number);

    if (!year || !monthNumber) {
      return "";
    }

    return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  const loadCustomer = useCallback(async () => {
    if (!currentCustomerId) {
      throw new Error("Customer ID नहीं मिला।");
    }

    if (
      location.state?.customer &&
      String(location.state.customer?._id || location.state.customer?.id) ===
        String(currentCustomerId)
    ) {
      setCustomer(location.state.customer);
      return location.state.customer;
    }

    try {
      const response = await api.get(`/customers/${currentCustomerId}`);
      const payload = response?.data;
      const found =
        payload?.data ||
        payload?.customer ||
        payload?.result ||
        (payload?._id || payload?.id ? payload : null);

      if (found) {
        setCustomer(found);
        return found;
      }
    } catch (error) {
      console.warn("Single customer API warning:", error?.response?.status);
    }

    const response = await api.get("/customers");
    const payload = response?.data || {};
    const customers = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.customers)
        ? payload.customers
        : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(payload)
            ? payload
            : [];

    const foundCustomer = customers.find(
      (item) => String(item?._id || item?.id) === String(currentCustomerId),
    );

    if (!foundCustomer) {
      throw new Error("Customer record नहीं मिला।");
    }

    setCustomer(foundCustomer);
    return foundCustomer;
  }, [currentCustomerId, location.state]);
  /* =======================================================
     LOAD BILL DATA
     
     IMPORTANT:
     
     Bill में:
     
     1. Monthly Summary
     2. Milk Logs
     3. Payment History
     
     तीनों fresh API से आएंगे।
  ======================================================= */

  const loadBillData = useCallback(
    async (showLoader = true) => {
      if (!currentCustomerId) {
        setError("Customer ID नहीं मिला।");
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        /* ===============================================
           CUSTOMER
        =============================================== */

        await loadCustomer();

        /* ===============================================
           MONTHLY SUMMARY
        =============================================== */

        const summaryResponse = await api.get(
          `/customer-milk/${currentCustomerId}/monthly-summary`,
          {
            params: {
              month,
            },
          },
        );

        const summaryResponseData = summaryResponse?.data || {};

        const summaryData =
          summaryResponseData?.data?.summary ||
          summaryResponseData?.summary ||
          summaryResponseData?.data ||
          {};

        setSummary(summaryData);

        /* ===============================================
           MILK LOGS
        =============================================== */

        let loadedMilkLogs = [];

        try {
          const milkResponse = await api.get(
            `/customer-milk/${currentCustomerId}`,
            {
              params: {
                month,
              },
            },
          );

          const milkResponseData = milkResponse?.data || {};

          if (Array.isArray(milkResponseData?.data)) {
            loadedMilkLogs = milkResponseData.data;
          } else if (Array.isArray(milkResponseData?.logs)) {
            loadedMilkLogs = milkResponseData.logs;
          } else if (Array.isArray(milkResponseData?.milkLogs)) {
            loadedMilkLogs = milkResponseData.milkLogs;
          } else if (Array.isArray(milkResponseData?.data?.logs)) {
            loadedMilkLogs = milkResponseData.data.logs;
          }
        } catch (milkError) {
          console.warn("Milk history API warning:", milkError);

          /*
            अगर direct milk history API fail हो,
            तो monthly summary के logs use करें।
          */

          if (Array.isArray(summaryData?.logs)) {
            loadedMilkLogs = summaryData.logs;
          } else if (Array.isArray(summaryData?.milkLogs)) {
            loadedMilkLogs = summaryData.milkLogs;
          }
        }

        setMilkLogs(Array.isArray(loadedMilkLogs) ? loadedMilkLogs : []);

        /* ===============================================
           PAYMENT HISTORY
           
           VERY IMPORTANT FIX
           
           Payment का final paid amount हमेशा
           payment history से calculate होगा।
           
           summary.totalPaid पर depend नहीं करेंगे।
        =============================================== */

        const paymentResponse = await api.get(
          `/customer-payments/${currentCustomerId}`,
          {
            params: {
              month,
            },
          },
        );

        const paymentResponseData = paymentResponse?.data || {};

        let loadedPayments = [];

        if (Array.isArray(paymentResponseData?.data)) {
          loadedPayments = paymentResponseData.data;
        } else if (Array.isArray(paymentResponseData?.payments)) {
          loadedPayments = paymentResponseData.payments;
        } else if (Array.isArray(paymentResponseData?.data?.payments)) {
          loadedPayments = paymentResponseData.data.payments;
        }

        setPayments(
          (Array.isArray(loadedPayments) ? loadedPayments : []).filter(
            (payment) =>
              !payment?.status || String(payment.status) === "completed",
          ),
        );
      } catch (err) {
        console.error("Customer Bill Error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Monthly bill load नहीं हो पाया।",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentCustomerId, month, loadCustomer],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadBillData(true);
  }, [loadBillData]);

  /* =======================================================
     MILK TOTALS
  ======================================================= */

  const totalMilk = useMemo(() => {
    /*
      पहले backend summary से totalMilk लें।

      अगर available नहीं है,
      तो logs से calculate करें।
    */

    const backendTotal = safeNumber(summary?.totalMilk);

    if (backendTotal > 0) {
      return roundMoney(backendTotal);
    }

    return roundMoney(
      milkLogs.reduce(
        (total, item) =>
          total +
          safeNumber(
            item?.totalMilk ??
              safeNumber(item?.morningMilk) + safeNumber(item?.eveningMilk),
          ),
        0,
      ),
    );
  }, [summary, milkLogs]);

  /* =======================================================
     MORNING MILK
  ======================================================= */

  const totalMorningMilk = useMemo(() => {
    const backendValue = summary?.totalMorningMilk;

    if (backendValue !== undefined && backendValue !== null) {
      return roundMoney(backendValue);
    }

    return roundMoney(
      milkLogs.reduce(
        (total, item) => total + safeNumber(item?.morningMilk),
        0,
      ),
    );
  }, [summary, milkLogs]);

  /* =======================================================
     EVENING MILK
  ======================================================= */

  const totalEveningMilk = useMemo(() => {
    const backendValue = summary?.totalEveningMilk;

    if (backendValue !== undefined && backendValue !== null) {
      return roundMoney(backendValue);
    }

    return roundMoney(
      milkLogs.reduce(
        (total, item) => total + safeNumber(item?.eveningMilk),
        0,
      ),
    );
  }, [summary, milkLogs]);

  /* =======================================================
     TOTAL BILL
     
     Backend summary is source of truth.
  ======================================================= */

  const totalAmount = useMemo(() => {
    return roundMoney(summary?.totalAmount || 0);
  }, [summary]);

  /* =======================================================
     TOTAL PAID
     
     IMPORTANT FIX
     
     यहां summary.totalPaid नहीं लिया जाएगा।
     
     Payment API से जो actual completed payments
     आए हैं उनका total calculate होगा।
  ======================================================= */

  const totalPaid = useMemo(() => {
    if (!Array.isArray(payments)) {
      return 0;
    }

    const total = payments.reduce((sum, payment) => {
      /*
          केवल completed payment count करें।
          
          Backend normally cancelled payments
          return नहीं करता, लेकिन frontend safety
          के लिए यह check भी रखा गया है।
        */

      if (payment?.status && payment.status !== "completed") {
        return sum;
      }

      return sum + safeNumber(payment?.amount);
    }, 0);

    return roundMoney(total);
  }, [payments]);

  /* =======================================================
     PAYMENT TOTAL
     
     Same as totalPaid.
  ======================================================= */

  const paymentTotal = useMemo(() => {
    return totalPaid;
  }, [totalPaid]);

  /* =======================================================
     PENDING
     
     IMPORTANT FIX
     
     Pending हमेशा:
     
     Total Bill - Actual Paid
     
     से calculate होगा।
  ======================================================= */

  const balanceCalculation = useMemo(() => {
    const bill = roundMoney(totalAmount);

    const paid = roundMoney(totalPaid);

    const difference = roundMoney(bill - paid);

    if (difference > 0) {
      return {
        pending: difference,
        advance: 0,
        status: "pending",
      };
    }

    if (difference < 0) {
      return {
        pending: 0,
        advance: Math.abs(difference),
        status: "advance",
      };
    }

    return {
      pending: 0,
      advance: 0,
      status: bill > 0 ? "paid" : "no_bill",
    };
  }, [totalAmount, totalPaid]);

  const pendingAmount = balanceCalculation.pending;

  const advanceAmount = balanceCalculation.advance;

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus = balanceCalculation.status;

  /* =======================================================
     CUSTOMER DETAILS
  ======================================================= */

  const customerName = customer?.name || "Customer";

  const customerCode = customer?.customerCode || "-";

  const customerPhone = customer?.phone || "-";

  /* =======================================================
     MILK TYPE
  ======================================================= */

  const getMilkType = useCallback(() => {
    if (customer?.milkType === "buffalo") {
      return "भैंस";
    }

    if (customer?.milkType === "mixed") {
      return "मिक्स";
    }

    return "गाय";
  }, [customer?.milkType]);

  /* =======================================================
     CUSTOMER TYPE
  ======================================================= */

  const getCustomerType = useCallback(() => {
    switch (customer?.customerType) {
      case "shop":
        return "दुकान";

      case "hotel":
        return "होटल";

      case "restaurant":
        return "Restaurant";

      case "other":
        return "अन्य";

      default:
        return "घर";
    }
  }, [customer?.customerType]);

  /* =======================================================
     PAYMENT METHOD
  ======================================================= */

  const getPaymentMethod = (method) => {
    switch (method) {
      case "cash":
        return "Cash";

      case "upi":
        return "UPI";

      case "bank":
        return "Bank";

      case "cheque":
        return "Cheque";

      default:
        return method || "-";
    }
  };

  /* =======================================================
     BACK TO LEDGER
  ======================================================= */

  const handleBack = () => {
    navigate(`/customers/${currentCustomerId}/ledger`, {
      state: {
        customer,
      },
    });
  };

  /* =======================================================
     LEDGER
  ======================================================= */

  const handleLedger = () => {
    navigate(`/customers/${currentCustomerId}/ledger`, {
      state: {
        customer,
      },
    });
  };

  /* =======================================================
     PAYMENT PAGE
  ======================================================= */

  const handlePaymentPage = () => {
    navigate(`/customers/${currentCustomerId}/payment`, {
      state: { customer },
    });
  };

  /* =======================================================
     WHATSAPP BILL
     
     FREE:
     WhatsApp Web / WhatsApp App
     
     इसमें actual bill numbers वही होंगे
     जो screen पर दिख रहे हैं।
  ======================================================= */

  const handleWhatsAppBill = () => {
    const rawPhone = String(customer?.phone || "").replace(/\D/g, "");

    if (!rawPhone) {
      window.alert("Customer का mobile number उपलब्ध नहीं है।");

      return;
    }

    let phone = rawPhone;

    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    if (phone.length < 10) {
      window.alert("Customer का mobile number सही नहीं है।");

      return;
    }

    const statusText =
      paymentStatus === "paid"
        ? "✅ पूरा भुगतान हो गया है"
        : paymentStatus === "advance"
          ? `💰 Advance: ${formatMoney(advanceAmount)}`
          : `⏳ बाकी: ${formatMoney(pendingAmount)}`;

    const message = [
      `🙏 नमस्ते ${customerName} जी,`,
      "",
      "🥛 *DOODHLEKHA*",
      "📄 *मासिक दूध बिल*",
      "",
      `📅 अवधि: ${monthName}`,
      `👤 Customer ID: ${customerCode}`,
      `📱 मोबाइल: ${customerPhone}`,
      "",
      `🥛 कुल दूध: ${formatNumber(totalMilk)} L`,
      `🌅 सुबह: ${formatNumber(totalMorningMilk)} L`,
      `🌙 शाम: ${formatNumber(totalEveningMilk)} L`,
      "",
      `💰 कुल बिल: ${formatMoney(totalAmount)}`,
      `✅ जमा: ${formatMoney(totalPaid)}`,
      `⏳ बाकी: ${formatMoney(pendingAmount)}`,
      "",
      statusText,
      "",
      "📋 भुगतान और दूध का पूरा हिसाब bill में उपलब्ध है।",
      "",
      "धन्यवाद 🙏",
      "DOODHLEKHA",
      "दूध का सही हिसाब • किसान का भरोसा",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${phone}` + `?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="customer-bill-page">
        <div className="bill-loading">
          <div className="bill-loading-icon">🧾</div>

          <div className="bill-spinner" />

          <h2>Bill तैयार हो रहा है...</h2>

          <p>कृपया थोड़ी देर प्रतीक्षा करें</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !customer) {
    return (
      <div className="customer-bill-page">
        <div className="bill-error">
          <div className="bill-error-icon">⚠️</div>

          <h2>Bill load नहीं हो पाया</h2>

          <p>{error}</p>

          <div className="bill-error-actions">
            <button type="button" onClick={() => loadBillData(true)}>
              🔄 दोबारा कोशिश करें
            </button>

            <button
              type="button"
              className="bill-secondary-btn"
              onClick={() => navigate("/customers")}
            >
              ← Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="customer-bill-page">
      {/* =================================================
          SCREEN ACTION BAR
      ================================================= */}

      <div className="bill-action-bar no-print">
        <button type="button" className="bill-back-btn" onClick={handleBack}>
          ← <span>Ledger</span>
        </button>

        <div className="bill-action-right">
          <button
            type="button"
            className="bill-ledger-btn"
            onClick={handlePaymentPage}
          >
            💰 Payment
          </button>
          {/* MONTH */}

          <label className="bill-month-btn">
            📅
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>

          {/* REFRESH */}

          <button
            type="button"
            className="bill-ledger-btn"
            onClick={() => loadBillData(false)}
            disabled={refreshing}
          >
            {refreshing ? "⟳ Loading..." : "↻ Refresh"}
          </button>

          {/* LEDGER */}

          <button
            type="button"
            className="bill-ledger-btn"
            onClick={handleLedger}
          >
            📒 Ledger
          </button>

          {/* WHATSAPP */}

          <button
            type="button"
            className="bill-print-btn"
            onClick={handleWhatsAppBill}
          >
            📱 WhatsApp Bill
          </button>

          {/* PRINT */}

          <button
            type="button"
            className="bill-print-btn"
            onClick={handlePrint}
          >
            🖨️ Print Bill
          </button>
        </div>
      </div>

      {/* =================================================
          BILL PAPER
      ================================================= */}

      <div className="customer-bill-paper">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="shop-bill-header">
          <div>
            <h1>DOODHLEKHA</h1>

            <p>DAIRY MILK BILL</p>
          </div>

          <div className="shop-bill-title">
            <strong>मासिक दूध बिल</strong>

            <span>{monthName}</span>
          </div>
        </header>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        <section className="shop-customer-strip">
          <div>
            <span>ग्राहक का नाम</span>

            <strong>{customer?.name || "-"}</strong>
          </div>

          <div>
            <span>Customer ID</span>

            <strong>{customer?.customerCode || "-"}</strong>
          </div>

          <div>
            <span>मोबाइल</span>

            <strong>{customer?.phone || "-"}</strong>
          </div>

          <div>
            <span>दूध</span>

            <strong>{getMilkType()}</strong>
          </div>

          <div>
            <span>प्रकार</span>

            <strong>{getCustomerType()}</strong>
          </div>

          {customer?.village && (
            <div>
              <span>गांव</span>

              <strong>{customer.village}</strong>
            </div>
          )}
        </section>

        {/* =================================================
            MAIN SUMMARY
        ================================================= */}

        <section className="shop-bill-summary">
          {/* TOTAL MILK */}

          <div>
            <span>कुल दूध</span>

            <strong>{formatNumber(totalMilk)} L</strong>
          </div>

          {/* TOTAL BILL */}

          <div>
            <span>कुल बिल</span>

            <strong>{formatMoney(totalAmount)}</strong>
          </div>

          {/* TOTAL PAID */}

          <div className="paid-summary">
            <span>जमा</span>

            <strong>{formatMoney(totalPaid)}</strong>
          </div>

          {/* PENDING */}

          <div className={pendingAmount > 0 ? "due" : "clear"}>
            <span>
              {pendingAmount > 0
                ? "बाकी"
                : paymentStatus === "advance"
                  ? "Advance"
                  : "स्थिति"}
            </span>

            <strong>
              {pendingAmount > 0
                ? formatMoney(pendingAmount)
                : paymentStatus === "advance"
                  ? formatMoney(advanceAmount)
                  : totalAmount > 0
                    ? "PAID"
                    : "NO BILL"}
            </strong>
          </div>
        </section>

        {/* =================================================
            MILK DETAILS
        ================================================= */}

        <section className="shop-bill-section">
          <div className="shop-section-title">
            <strong>दूध का विवरण</strong>

            <span>Milk Details</span>
          </div>

          <table className="shop-milk-table">
            <thead>
              <tr>
                <th>दिनांक</th>

                <th>सुबह</th>

                <th>शाम</th>

                <th>कुल</th>

                <th>रेट</th>

                <th>रकम</th>
              </tr>
            </thead>

            <tbody>
              {milkLogs.length > 0 ? (
                milkLogs.map((log) => (
                  <tr key={log?._id || `${log?.date}-${Math.random()}`}>
                    <td>{formatDate(log?.date)}</td>

                    <td>{formatNumber(log?.morningMilk)} L</td>

                    <td>{formatNumber(log?.eveningMilk)} L</td>

                    <td>
                      {formatNumber(
                        log?.totalMilk ??
                          safeNumber(log?.morningMilk) +
                            safeNumber(log?.eveningMilk),
                      )}{" "}
                      L
                    </td>

                    <td>{formatMoney(log?.rate)}</td>

                    <td>{formatMoney(log?.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="shop-empty">
                    इस महीने कोई दूध दर्ज नहीं है
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td>कुल</td>

                <td>{formatNumber(totalMorningMilk)} L</td>

                <td>{formatNumber(totalEveningMilk)} L</td>

                <td>{formatNumber(totalMilk)} L</td>

                <td>-</td>

                <td>{formatMoney(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* =================================================
            PAYMENT DETAILS
        ================================================= */}

        <section className="shop-bill-section payment-section">
          <div className="shop-section-title">
            <strong>जमा पैसे का विवरण</strong>

            <span>Payment Details</span>
          </div>

          {payments.length > 0 ? (
            <table className="shop-payment-table">
              <thead>
                <tr>
                  <th>दिनांक</th>

                  <th>भुगतान तरीका</th>

                  <th>रकम</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment?._id}>
                    <td>{formatDate(payment?.paymentDate)}</td>

                    <td>{getPaymentMethod(payment?.paymentMethod)}</td>

                    <td>{formatMoney(payment?.amount)}</td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="2">इस महीने कुल जमा</td>

                  <td>{formatMoney(paymentTotal)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="shop-no-payment">
              इस महीने कोई payment दर्ज नहीं है
            </div>
          )}
        </section>

        {/* =================================================
            FINAL TOTAL
        ================================================= */}

        <section className="shop-total-box">
          <div>
            <span>कुल बिल</span>

            <strong>{formatMoney(totalAmount)}</strong>
          </div>

          <div>
            <span>जमा पैसा</span>

            <strong>{formatMoney(totalPaid)}</strong>
          </div>

          <div className={pendingAmount > 0 ? "due" : "clear"}>
            <span>
              {pendingAmount > 0
                ? "बाकी पैसा"
                : paymentStatus === "advance"
                  ? "Advance"
                  : "भुगतान पूरा"}
            </span>

            <strong>
              {pendingAmount > 0
                ? formatMoney(pendingAmount)
                : paymentStatus === "advance"
                  ? formatMoney(advanceAmount)
                  : "✓ PAID"}
            </strong>
          </div>
        </section>

        {/* =================================================
            PAYMENT STATUS MESSAGE
        ================================================= */}

        <div
          className={`shop-payment-status ${
            pendingAmount > 0
              ? "has-pending"
              : paymentStatus === "advance"
                ? "has-advance"
                : "fully-paid"
          }`}
        >
          {pendingAmount > 0 && (
            <>
              <span>⏳</span>

              <strong>ग्राहक का ₹{formatNumber(pendingAmount)} बाकी है।</strong>
            </>
          )}

          {pendingAmount === 0 && paymentStatus === "paid" && (
            <>
              <span>✅</span>

              <strong>पूरा भुगतान हो गया है।</strong>
            </>
          )}

          {paymentStatus === "advance" && (
            <>
              <span>💰</span>

              <strong>
                ग्राहक के पास ₹{formatNumber(advanceAmount)} Advance है।
              </strong>
            </>
          )}

          {paymentStatus === "no_bill" && (
            <>
              <span>ℹ️</span>

              <strong>इस महीने अभी कोई बिल नहीं है।</strong>
            </>
          )}
        </div>

        {/* =================================================
            ADVANCE
        ================================================= */}

        {advanceAmount > 0 && (
          <div className="shop-advance">
            Advance: <strong>{formatMoney(advanceAmount)}</strong>
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="shop-bill-footer">
          <div>
            <strong>DOODHLEKHA</strong>

            <span>दूध का सही हिसाब • किसान का भरोसा</span>
          </div>

          <div>
            <span>Bill Date</span>

            <strong>{formatDate(new Date())}</strong>
          </div>
        </footer>

        <div className="shop-thanks">धन्यवाद 🙏</div>
      </div>
    </div>
  );
};

export default CustomerBill;

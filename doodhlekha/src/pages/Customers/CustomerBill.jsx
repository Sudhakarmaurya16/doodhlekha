import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./CustomerBill.css";

const CustomerBill = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, id } = useParams();

  const currentCustomerId = customerId || id;

  const [customer, setCustomer] = useState(location.state?.customer || null);
  const [summary, setSummary] = useState(null);
  const [milkLogs, setMilkLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    document.body.classList.add("customer-bill-print-mode");
    return () => document.body.classList.remove("customer-bill-print-mode");
  }, []);

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const monthName = useMemo(() => {
    if (!month) return "";
    const [year, monthNumber] = month.split("-");
    return new Date(
      Number(year),
      Number(monthNumber) - 1,
      1,
    ).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [month]);

  const loadCustomer = useCallback(async () => {
    if (!currentCustomerId) throw new Error("Customer ID नहीं मिला");

    if (
      location.state?.customer &&
      String(location.state.customer?._id) === String(currentCustomerId)
    ) {
      setCustomer(location.state.customer);
      return location.state.customer;
    }

    const response = await api.get("/customers", {
      params: { status: "active" },
    });

    const customers = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    const foundCustomer = customers.find(
      (item) => String(item?._id) === String(currentCustomerId),
    );

    if (!foundCustomer) throw new Error("Customer नहीं मिला");

    setCustomer(foundCustomer);
    return foundCustomer;
  }, [currentCustomerId, location.state]);

  const loadBillData = useCallback(async () => {
    if (!currentCustomerId) return;

    try {
      setLoading(true);
      setError("");

      await loadCustomer();

      const [summaryResponse, milkResponse, paymentResponse] =
        await Promise.all([
          api.get(`/customer-milk/${currentCustomerId}/monthly-summary`, {
            params: { month },
          }),
          api.get(`/customer-milk/${currentCustomerId}`, {
            params: { month },
          }),
          api.get(`/customer-payments/${currentCustomerId}`, {
            params: { month },
          }),
        ]);

      setSummary(
        summaryResponse.data?.data?.summary ||
          summaryResponse.data?.summary ||
          null,
      );

      setMilkLogs(
        Array.isArray(milkResponse.data?.data) ? milkResponse.data.data : [],
      );

      setPayments(
        Array.isArray(paymentResponse.data?.data)
          ? paymentResponse.data.data
          : [],
      );
    } catch (err) {
      console.error("Customer Bill Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Monthly bill load नहीं हो पाया",
      );
    } finally {
      setLoading(false);
    }
  }, [currentCustomerId, month, loadCustomer]);

  useEffect(() => {
    loadBillData();
  }, [loadBillData]);

  const totalMilk = Number(summary?.totalMilk || 0);
  const totalAmount = Number(summary?.totalAmount || 0);
  const totalPaid = Number(summary?.totalPaid || 0);

  const pendingAmount = Math.max(
    Number(summary?.pendingAmount ?? totalAmount - totalPaid),
    0,
  );

  const advanceAmount = Number(summary?.advanceAmount || 0);

  const totalMorningMilk = useMemo(
    () =>
      milkLogs.reduce(
        (total, item) => total + Number(item?.morningMilk || 0),
        0,
      ),
    [milkLogs],
  );

  const totalEveningMilk = useMemo(
    () =>
      milkLogs.reduce(
        (total, item) => total + Number(item?.eveningMilk || 0),
        0,
      ),
    [milkLogs],
  );

  const paymentTotal = useMemo(
    () =>
      payments.reduce(
        (total, payment) => total + Number(payment?.amount || 0),
        0,
      ),
    [payments],
  );

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

  const getMilkType = () => {
    if (customer?.milkType === "buffalo") return "भैंस";
    if (customer?.milkType === "mixed") return "मिक्स";
    return "गाय";
  };

  const getCustomerType = () => {
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
  };

  const handleBack = () => {
    navigate(`/customers/${currentCustomerId}/ledger`, {
      state: { customer },
    });
  };

  const handleLedger = () => {
    navigate(`/customers/${currentCustomerId}/ledger`, {
      state: { customer },
    });
  };

  // =====================================================
  // WHATSAPP BILL
  // Free WhatsApp share using the customer's mobile number.
  // =====================================================
  const handleWhatsAppBill = () => {
    const rawPhone = String(customer?.phone || "").replace(/\D/g, "");

    if (!rawPhone) {
      window.alert("Customer का mobile number उपलब्ध नहीं है।");
      return;
    }

    let phone = rawPhone;
    if (phone.length === 10) phone = `91${phone}`;
    if (phone.length < 10) {
      window.alert("Customer का mobile number सही नहीं है।");
      return;
    }

    const message = [
      `🙏 नमस्ते ${customer?.name || "Customer"} जी,`,
      "",
      "🥛 *DOODHLEKHA - दूध का मासिक बिल*",
      `📅 अवधि: ${monthName}`,
      `👤 Customer ID: ${customer?.customerCode || "-"}`,
      "",
      `🥛 कुल दूध: ${formatNumber(totalMilk)} L`,
      `💰 कुल बिल: ₹${formatNumber(totalAmount)}`,
      `✅ जमा: ₹${formatNumber(totalPaid)}`,
      `⏳ बाकी: ₹${formatNumber(pendingAmount)}`,
      "",
      "📋 दूध का पूरा विवरण और भुगतान history bill में उपलब्ध है।",
      "",
      "धन्यवाद 🙏",
      "DOODHLEKHA - दूध का सही हिसाब",
    ].join("\n");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

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

  if (error && !customer) {
    return (
      <div className="customer-bill-page">
        <div className="bill-error">
          <div className="bill-error-icon">⚠️</div>
          <h2>Bill load नहीं हो पाया</h2>
          <p>{error}</p>
          <div className="bill-error-actions">
            <button type="button" onClick={loadBillData}>
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

  return (
    <div className="customer-bill-page">
      {/* SCREEN ACTIONS */}
      <div className="bill-action-bar no-print">
        <button type="button" className="bill-back-btn" onClick={handleBack}>
          ← <span>Ledger</span>
        </button>

        <div className="bill-action-right">
          <label className="bill-month-btn">
            📅
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="bill-ledger-btn"
            onClick={handleLedger}
          >
            📒 Ledger
          </button>

          <button
            type="button"
            className="bill-print-btn"
            onClick={handleWhatsAppBill}
          >
            📱 WhatsApp Bill
          </button>

          <button
            type="button"
            className="bill-print-btn"
            onClick={() => window.print()}
          >
            🖨️ Print Bill
          </button>
        </div>
      </div>

      {/* SHOP STYLE BILL */}
      <div className="customer-bill-paper">
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

        <section className="shop-bill-summary">
          <div>
            <span>कुल दूध</span>
            <strong>{formatNumber(totalMilk)} L</strong>
          </div>
          <div>
            <span>कुल बिल</span>
            <strong>{formatMoney(totalAmount)}</strong>
          </div>
          <div>
            <span>जमा</span>
            <strong>{formatMoney(totalPaid)}</strong>
          </div>
          <div className={pendingAmount > 0 ? "due" : "clear"}>
            <span>{pendingAmount > 0 ? "बाकी" : "स्थिति"}</span>
            <strong>
              {pendingAmount > 0 ? formatMoney(pendingAmount) : "PAID"}
            </strong>
          </div>
        </section>

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
              {milkLogs.length ? (
                milkLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDate(log.date)}</td>
                    <td>{formatNumber(log.morningMilk)} L</td>
                    <td>{formatNumber(log.eveningMilk)} L</td>
                    <td>{formatNumber(log.totalMilk)} L</td>
                    <td>{formatMoney(log.rate)}</td>
                    <td>{formatMoney(log.amount)}</td>
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

        <section className="shop-bill-section payment-section">
          <div className="shop-section-title">
            <strong>जमा पैसे का विवरण</strong>
            <span>Payment Details</span>
          </div>

          {payments.length ? (
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
                  <tr key={payment._id}>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{getPaymentMethod(payment.paymentMethod)}</td>
                    <td>{formatMoney(payment.amount)}</td>
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
            <span>{pendingAmount > 0 ? "बाकी पैसा" : "भुगतान पूरा"}</span>
            <strong>
              {pendingAmount > 0 ? formatMoney(pendingAmount) : "✓ PAID"}
            </strong>
          </div>
        </section>

        {advanceAmount > 0 && (
          <div className="shop-advance">
            Advance: <strong>{formatMoney(advanceAmount)}</strong>
          </div>
        )}

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

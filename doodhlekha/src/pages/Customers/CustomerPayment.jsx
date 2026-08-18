import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  IndianRupee,
  Loader2,
  NotebookPen,
  ReceiptIndianRupee,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";

import "./CustomerPayment.css";

/* =========================================================
   HELPERS
   ========================================================= */

const getCurrentMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMethodName = (method) => {
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
      return "Cash";
  }
};

/* =========================================================
   COMPONENT
   ========================================================= */

const CustomerPayment = () => {
  const navigate = useNavigate();

  const { id, customerId } = useParams();

  const selectedCustomerId = customerId || id;

  /* =======================================================
     STATES
  ======================================================= */

  const [customer, setCustomer] = useState(null);

  const [summary, setSummary] = useState(null);

  const [payments, setPayments] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [loading, setLoading] = useState(true);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    note: "",
  });

  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  const loadCustomer = async () => {
    try {
      const response = await api.get(`/customers/${selectedCustomerId}`);

      setCustomer(
        response.data?.data || response.data?.customer || response.data,
      );
    } catch (error) {
      console.error("Customer Load Error:", error);
    }
  };

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary = async () => {
    try {
      const response = await api.get(
        `/customer-milk/${selectedCustomerId}/monthly-summary`,
        {
          params: {
            month: selectedMonth,
          },
        },
      );

      setSummary(response.data?.data || null);
    } catch (error) {
      console.error("Customer Summary Error:", error);
    }
  };

  /* =======================================================
     LOAD PAYMENTS
  ======================================================= */

  const loadPayments = async () => {
    try {
      const response = await api.get(
        `/customer-payments/${selectedCustomerId}`,
        {
          params: {
            month: selectedMonth,
          },
        },
      );

      setPayments(response.data?.data || []);
    } catch (error) {
      console.error("Payment History Error:", error);

      setPayments([]);
    }
  };

  /* =======================================================
     LOAD ALL
  ======================================================= */

  const loadPageData = async () => {
    try {
      setLoading(true);

      await Promise.all([loadCustomer(), loadSummary(), loadPayments()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomerId) return;

    loadPageData();
  }, [selectedCustomerId, selectedMonth]);

  /* =======================================================
     SUMMARY VALUES
  ======================================================= */

  const totalAmount = Number(summary?.summary?.totalAmount || 0);

  /* =======================================================
     PAYMENT HISTORY TOTAL
  ======================================================= */

  // Payment history is the source of truth.
  // Cancelled payments are never included.
  const historyPaid = useMemo(() => {
    return payments.reduce((total, payment) => {
      if (String(payment?.status || "completed") !== "completed") {
        return total;
      }

      return total + Number(payment?.amount || 0);
    }, 0);
  }, [payments]);

  const totalPaid = Number(historyPaid.toFixed(2));

  // Positive = pending, negative = advance/credit.
  const balance = Number((totalAmount - totalPaid).toFixed(2));
  const pendingAmount = Math.max(balance, 0);
  const advanceAmount = Math.max(-balance, 0);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  const openPaymentModal = () => {
    setMessage({
      type: "",
      text: "",
    });

    setForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      note: "",
    });

    setShowPaymentModal(true);
  };

  /* =======================================================
     CLOSE PAYMENT
  ======================================================= */

  const closePaymentModal = () => {
    if (paymentLoading) return;

    setShowPaymentModal(false);
  };

  /* =======================================================
     ADD PAYMENT
  ======================================================= */

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setMessage({
        type: "error",
        text: "कृपया सही payment amount डालें।",
      });

      return;
    }

    if (pendingAmount > 0 && amount > pendingAmount) {
      setMessage({
        type: "error",
        text: `Pending amount ₹${formatMoney(
          pendingAmount,
        )} है। इससे ज्यादा payment दर्ज नहीं कर सकते।`,
      });

      return;
    }

    try {
      setPaymentLoading(true);

      await api.post(`/customer-payments/${selectedCustomerId}`, {
        amount,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        note: form.note.trim(),
      });

      setMessage({
        type: "success",
        text: "Payment सफलतापूर्वक दर्ज हो गया।",
      });

      setShowPaymentModal(false);

      await Promise.all([loadSummary(), loadPayments()]);
    } catch (error) {
      console.error("Add Payment Error:", error);

      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Payment save नहीं हो सका।",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  /* =======================================================
     CANCEL PAYMENT
  ======================================================= */

  const handleCancelPayment = async (paymentId) => {
    const confirmed = window.confirm(
      "क्या आप इस payment को cancel करना चाहते हैं?",
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(paymentId);

      await api.delete(`/customer-payments/payment/${paymentId}`);

      await Promise.all([loadSummary(), loadPayments()]);
    } catch (error) {
      console.error("Cancel Payment Error:", error);

      alert(error?.response?.data?.message || "Payment cancel नहीं हो सका।");
    } finally {
      setDeleteLoading(null);
    }
  };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    navigate("/customers");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="customer-payment-page">
        <div className="payment-page-loading">
          <div className="payment-loading-icon">
            <Loader2 size={30} />
          </div>

          <h3>Customer का हिसाब तैयार हो रहा है...</h3>

          <p>Customer Payment Loading...</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     CUSTOMER NOT FOUND
  ======================================================= */

  if (!customer) {
    return (
      <div className="customer-payment-page">
        <div className="payment-empty-page">
          <ReceiptIndianRupee size={48} />

          <h2>Customer नहीं मिला</h2>

          <p>Customer details उपलब्ध नहीं हैं।</p>

          <button onClick={handleBack}>
            <ArrowLeft size={17} />
            Customers पर वापस जाएँ
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="customer-payment-page">
      {/* =================================================
          TOP HEADER
      ================================================= */}

      <div className="customer-payment-top">
        <button className="payment-back-btn" onClick={handleBack}>
          <ArrowLeft size={18} />

          <span>Customers</span>
        </button>

        <div className="payment-top-actions">
          <button
            className="payment-history-btn"
            onClick={() => {
              document.getElementById("payment-history")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            <ReceiptIndianRupee size={17} />

            <div>
              <strong>Payment History</strong>

              <small>भुगतान इतिहास</small>
            </div>
          </button>

          <button
            className="add-payment-top-btn"
            onClick={openPaymentModal}
            disabled={pendingAmount <= 0}
          >
            <IndianRupee size={18} />

            <div>
              <strong>Payment जमा करें</strong>

              <small>Add Payment</small>
            </div>
          </button>
        </div>
      </div>

      {/* =================================================
          CUSTOMER HEADER
      ================================================= */}

      <div className="payment-customer-header">
        <div className="payment-customer-main">
          <div className="payment-customer-avatar">
            {customer.name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <div className="payment-customer-name-row">
              <h1>{customer.name}</h1>

              <span>Active</span>
            </div>

            <p>{customer.customerCode || "Customer"}</p>

            <div className="payment-customer-contact">
              {customer.phone && <span>📞 {customer.phone}</span>}

              <span>
                {customer.milkType === "buffalo"
                  ? "🐃 भैंस का दूध"
                  : customer.milkType === "mixed"
                    ? "🥛 मिक्स दूध"
                    : "🐄 गाय का दूध"}
              </span>
            </div>
          </div>
        </div>

        <div className="payment-customer-purpose">
          <Wallet size={22} />

          <div>
            <strong>Customer Payment</strong>

            <small>ग्राहक का हिसाब-किताब</small>
          </div>
        </div>
      </div>

      {/* =================================================
          SUCCESS / ERROR
      ================================================= */}

      {message.text && (
        <div className={`payment-page-message ${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <X size={18} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="payment-summary-grid">
        <div className="payment-summary-card bill">
          <div className="payment-summary-icon">
            <ReceiptIndianRupee size={21} />
          </div>

          <div>
            <small>कुल बिल</small>

            <strong>₹{formatMoney(totalAmount)}</strong>

            <span>Total Bill</span>
          </div>
        </div>

        <div className="payment-summary-card paid">
          <div className="payment-summary-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <small>जमा भुगतान</small>

            <strong>₹{formatMoney(totalPaid)}</strong>

            <span>Total Paid</span>
          </div>
        </div>

        <div className="payment-summary-card pending">
          <div className="payment-summary-icon">
            <Wallet size={21} />
          </div>

          <div>
            <small>
              {advanceAmount > 0 ? "Advance / Credit" : "बाकी पैसा"}
            </small>

            <strong>
              ₹{formatMoney(advanceAmount > 0 ? advanceAmount : pendingAmount)}
            </strong>

            <span>
              {advanceAmount > 0 ? "Advance Amount" : "Pending Amount"}
            </span>
          </div>
        </div>

        <button
          className={`payment-main-action ${
            pendingAmount > 0 ? "pending" : "clear"
          }`}
          onClick={openPaymentModal}
          disabled={pendingAmount <= 0}
        >
          <div className="payment-main-action-icon">
            {pendingAmount > 0 ? (
              <IndianRupee size={22} />
            ) : (
              <CheckCircle2 size={22} />
            )}
          </div>

          <div>
            <strong>
              {pendingAmount > 0 ? "Payment जमा करें" : "पूरा हिसाब हो गया"}
            </strong>

            <small>
              {pendingAmount > 0 ? "Add customer payment" : "No pending amount"}
            </small>
          </div>

          {pendingAmount > 0 && (
            <ChevronDown size={18} className="payment-action-arrow" />
          )}
        </button>
      </div>

      {/* =================================================
          MONTH FILTER
      ================================================= */}

      <div className="payment-month-toolbar">
        <div className="payment-month-title">
          <CalendarDays size={19} />

          <div>
            <strong>Payment History</strong>

            <small>भुगतान का पूरा इतिहास</small>
          </div>
        </div>

        <div className="payment-month-filter">
          <label>Month</label>

          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          />
        </div>
      </div>

      {/* =================================================
          HISTORY
      ================================================= */}

      <div className="payment-history-card" id="payment-history">
        <div className="payment-history-header">
          <div>
            <h2>
              <ReceiptIndianRupee size={18} />
              Payment History
            </h2>

            <p>इस महीने ग्राहक से मिले सभी payment</p>
          </div>

          <div className="payment-history-total">
            <small>इस महीने जमा</small>

            <strong>₹{formatMoney(historyPaid)}</strong>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="payment-history-empty">
            <div>
              <Wallet size={30} />
            </div>

            <h3>अभी कोई payment नहीं है</h3>

            <p>इस महीने customer से मिला payment यहाँ दिखाई देगा।</p>

            {pendingAmount > 0 && (
              <button onClick={openPaymentModal}>
                <IndianRupee size={16} />
                Payment जोड़ें
              </button>
            )}
          </div>
        ) : (
          <div className="payment-history-table-wrapper">
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>
                    Date
                    <small>तारीख</small>
                  </th>

                  <th>
                    Amount
                    <small>रकम</small>
                  </th>

                  <th>
                    Method
                    <small>तरीका</small>
                  </th>

                  <th>
                    Note
                    <small>नोट</small>
                  </th>

                  <th>
                    Action
                    <small>कार्य</small>
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <strong>{formatDate(payment.paymentDate)}</strong>
                    </td>

                    <td>
                      <strong className="payment-amount-cell">
                        ₹{formatMoney(payment.amount)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`payment-method-badge ${payment.paymentMethod}`}
                      >
                        {payment.paymentMethod === "cash" && (
                          <Banknote size={13} />
                        )}

                        {payment.paymentMethod === "upi" && (
                          <Smartphone size={13} />
                        )}

                        {payment.paymentMethod === "bank" && (
                          <CreditCard size={13} />
                        )}

                        {payment.paymentMethod === "cheque" && (
                          <NotebookPen size={13} />
                        )}

                        {getMethodName(payment.paymentMethod)}
                      </span>
                    </td>

                    <td>
                      <span className="payment-note-cell">
                        {payment.note || "—"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="payment-cancel-btn"
                        disabled={deleteLoading === payment._id}
                        onClick={() => handleCancelPayment(payment._id)}
                      >
                        {deleteLoading === payment._id ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <X size={14} />
                        )}
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          PAYMENT INFO
      ================================================= */}

      <div className="payment-info-footer">
        <div className="payment-info-icon">
          <Wallet size={22} />
        </div>

        <div>
          <strong>बाकी भुगतान</strong>

          <small>
            Customer को अभी ₹{formatMoney(pendingAmount)} देना बाकी है।
          </small>
        </div>

        {pendingAmount > 0 && (
          <button onClick={openPaymentModal}>
            <IndianRupee size={16} />
            Payment जमा करें
          </button>
        )}
      </div>

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {showPaymentModal && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentModal();
            }
          }}
        >
          <div className="payment-modal">
            {/* MODAL HEADER */}

            <div className="payment-modal-header">
              <div className="payment-modal-title">
                <div>
                  <IndianRupee size={22} />
                </div>

                <div>
                  <h2>Payment जमा करें</h2>

                  <p>ग्राहक से मिला पैसा दर्ज करें</p>
                </div>
              </div>

              <button
                className="payment-modal-close"
                onClick={closePaymentModal}
                disabled={paymentLoading}
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form className="payment-form" onSubmit={handleSubmitPayment}>
              {/* PENDING */}

              <div className="payment-form-pending">
                <div>
                  <small>बाकी राशि</small>

                  <strong>₹{formatMoney(pendingAmount)}</strong>
                </div>

                <span>Pending</span>
              </div>

              {/* AMOUNT */}

              <div className="payment-form-group">
                <label>
                  Payment Amount
                  <span>भुगतान राशि</span>
                </label>

                <div className="payment-amount-input">
                  <span>₹</span>

                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    max={pendingAmount || undefined}
                    required
                    autoFocus
                  />
                </div>

                <small className="payment-field-help">
                  Maximum ₹{formatMoney(pendingAmount)} तक payment दर्ज कर सकते
                  हैं।
                </small>
              </div>

              {/* DATE */}

              <div className="payment-form-group">
                <label>
                  Payment Date
                  <span>भुगतान की तारीख</span>
                </label>

                <div className="payment-input-with-icon">
                  <CalendarDays size={17} />

                  <input
                    type="date"
                    name="paymentDate"
                    value={form.paymentDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* METHOD */}

              <div className="payment-form-group">
                <label>
                  Payment Method
                  <span>पैसा किससे मिला?</span>
                </label>

                <div className="payment-method-grid">
                  <button
                    type="button"
                    className={form.paymentMethod === "cash" ? "selected" : ""}
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        paymentMethod: "cash",
                      }))
                    }
                  >
                    <Banknote size={19} />

                    <span>Cash</span>

                    <small>नकद</small>
                  </button>

                  <button
                    type="button"
                    className={form.paymentMethod === "upi" ? "selected" : ""}
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        paymentMethod: "upi",
                      }))
                    }
                  >
                    <Smartphone size={19} />

                    <span>UPI</span>

                    <small>ऑनलाइन</small>
                  </button>

                  <button
                    type="button"
                    className={form.paymentMethod === "bank" ? "selected" : ""}
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        paymentMethod: "bank",
                      }))
                    }
                  >
                    <CreditCard size={19} />

                    <span>Bank</span>

                    <small>बैंक</small>
                  </button>

                  <button
                    type="button"
                    className={
                      form.paymentMethod === "cheque" ? "selected" : ""
                    }
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        paymentMethod: "cheque",
                      }))
                    }
                  >
                    <NotebookPen size={19} />

                    <span>Cheque</span>

                    <small>चेक</small>
                  </button>
                </div>
              </div>

              {/* NOTE */}

              <div className="payment-form-group">
                <label>
                  Note
                  <span>कोई जानकारी हो तो लिखें</span>
                </label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="जैसे: August का payment, advance आदि..."
                  rows="3"
                />
              </div>

              {/* ERROR */}

              {message.type === "error" && (
                <div className="payment-form-error">
                  <X size={16} />

                  {message.text}
                </div>
              )}

              {/* ACTION */}

              <div className="payment-form-actions">
                <button
                  type="button"
                  className="payment-cancel-form-btn"
                  onClick={closePaymentModal}
                  disabled={paymentLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="payment-save-btn"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Payment Save करें
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayment;

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import CustomerForm from "./CustomerForm";
import CustomerMilkModal from "./CustomerMilkModal";

import "./Customers.css";

// =====================================================
// HELPERS
// =====================================================

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => {
  return numberValue(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatMoney = (value) => {
  return numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// CUSTOMER CARD
// =====================================================

const CustomerCard = ({ customer, onAddMilk, onDeactivate }) => {
  const navigate = useNavigate();

  const [todayMilk, setTodayMilk] = useState(null);

  const [todayLoading, setTodayLoading] = useState(true);

  // ===================================================
  // LOAD TODAY MILK
  // ===================================================

  const loadTodayMilk = useCallback(async () => {
    if (!customer?._id) {
      setTodayLoading(false);
      return;
    }

    try {
      setTodayLoading(true);

      const response = await api.get(`/customer-milk/${customer._id}/today`, {
        params: {
          _t: Date.now(),
        },
      });

      setTodayMilk(response.data?.data || null);
    } catch (error) {
      console.error("Customer Today Milk Error:", error);

      setTodayMilk(null);
    } finally {
      setTodayLoading(false);
    }
  }, [customer?._id]);

  useEffect(() => {
    loadTodayMilk();
  }, [loadTodayMilk]);

  // ===================================================
  // SUMMARY FROM BACKEND
  // ===================================================

  const summary = customer?.summary || {};

  const totalMilk = numberValue(summary.totalMilk);

  const totalBill = numberValue(summary.totalBill ?? summary.totalAmount);

  const totalPaid = numberValue(summary.totalPaid);

  const pendingAmount = Math.max(
    numberValue(summary.pendingAmount ?? totalBill - totalPaid),
    0,
  );

  const advanceAmount = Math.max(
    numberValue(summary.advanceAmount ?? totalPaid - totalBill),
    0,
  );

  const paymentCount = numberValue(summary.paymentCount);

  // ===================================================
  // TODAY
  // ===================================================

  const morningMilk = numberValue(todayMilk?.morningMilk);

  const eveningMilk = numberValue(todayMilk?.eveningMilk);

  const todayTotalMilk = numberValue(
    todayMilk?.totalMilk ?? morningMilk + eveningMilk,
  );

  const todayAmount = numberValue(todayMilk?.amount);

  // ===================================================
  // MILK TYPE
  // ===================================================

  const milkInfo = useMemo(() => {
    switch (customer?.milkType) {
      case "buffalo":
        return {
          icon: "🐃",
          hindi: "भैंस का दूध",
          english: "Buffalo Milk",
        };

      case "mixed":
        return {
          icon: "🥛",
          hindi: "मिक्स दूध",
          english: "Mixed Milk",
        };

      default:
        return {
          icon: "🐄",
          hindi: "गाय का दूध",
          english: "Cow Milk",
        };
    }
  }, [customer?.milkType]);

  // ===================================================
  // PAYMENT STATUS
  // ===================================================

  const paymentStatus = useMemo(() => {
    if (advanceAmount > 0) {
      return {
        type: "advance",
        icon: "💰",
        hindi: "अग्रिम जमा",
        english: "Advance",
      };
    }

    if (pendingAmount > 0) {
      return {
        type: "pending",
        icon: "⏳",
        hindi: "बाकी है",
        english: "Pending",
      };
    }

    if (totalBill > 0) {
      return {
        type: "paid",
        icon: "✅",
        hindi: "हिसाब साफ",
        english: "Paid",
      };
    }

    return {
      type: "empty",
      icon: "ℹ️",
      hindi: "अभी बिल नहीं",
      english: "No Bill",
    };
  }, [advanceAmount, pendingAmount, totalBill]);

  // ===================================================
  // DETAILS
  // ===================================================

  const handleDetails = () => {
    if (!customer?._id) return;

    navigate(`/customers/${customer._id}`);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <article className="customer-card-3d">
      {/* =============================================
          HEADER
      ============================================== */}

      <div className="customer-card-top">
        <div className="customer-avatar">
          {String(customer?.name || "C")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="customer-main-info">
          <div className="customer-name-row">
            <h3>{customer?.name || "Unknown Customer"}</h3>

            <span className="customer-active-badge">● Active</span>
          </div>

          <span className="customer-code">
            {customer?.customerCode || "CUS-0000"}
          </span>
        </div>
      </div>

      {/* =============================================
          CUSTOMER BASIC INFO
      ============================================== */}

      <div className="customer-info-row">
        <div className="customer-info-item">
          <span>📞</span>

          <div>
            <strong>{customer?.phone || "-"}</strong>

            <small>Mobile / मोबाइल</small>
          </div>
        </div>

        <div className="customer-info-item">
          <span>{milkInfo.icon}</span>

          <div>
            <strong>{milkInfo.hindi}</strong>

            <small>{milkInfo.english}</small>
          </div>
        </div>
      </div>

      {/* =============================================
          TODAY MILK
      ============================================== */}

      <div className="customer-today-milk">
        <div className="today-milk-header">
          <div>
            <span>🥛</span>

            <div>
              <strong>आज का दूध</strong>
              <small>Today's Milk</small>
            </div>
          </div>

          <strong className="today-amount">₹{formatMoney(todayAmount)}</strong>
        </div>

        {todayLoading ? (
          <div className="customer-card-loading">
            <span>⏳</span>
            <span>दूध का हिसाब load हो रहा है...</span>
          </div>
        ) : todayMilk ? (
          <div className="today-milk-grid">
            <div className="today-milk-box">
              <span>🌅</span>

              <strong>{formatNumber(morningMilk)} L</strong>

              <small>
                Morning
                <br />
                सुबह
              </small>
            </div>

            <div className="today-milk-box">
              <span>🌆</span>

              <strong>{formatNumber(eveningMilk)} L</strong>

              <small>
                Evening
                <br />
                शाम
              </small>
            </div>

            <div className="today-milk-box">
              <span>🥛</span>

              <strong>{formatNumber(todayTotalMilk)} L</strong>

              <small>
                Total
                <br />
                कुल
              </small>
            </div>
          </div>
        ) : (
          <div className="customer-no-today-milk">
            🥛 आज दूध दर्ज नहीं हुआ
            <small>No milk recorded today</small>
          </div>
        )}
      </div>

      {/* =============================================
          MONTHLY SUMMARY
      ============================================== */}

      <div className="customer-month-summary">
        <div>
          <strong>
            {formatNumber(totalMilk)}
            <small>L</small>
          </strong>

          <span>इस महीने</span>

          <small>This Month</small>
        </div>

        <div>
          <strong>₹{formatMoney(totalBill)}</strong>

          <span>कुल बिल</span>

          <small>Total Bill</small>
        </div>
      </div>

      {/* =============================================
          PAYMENT SUMMARY
      ============================================== */}

      <div className="customer-payment-summary">
        <div className="paid-box">
          <span>✅ जमा / Paid</span>

          <strong>₹{formatMoney(totalPaid)}</strong>

          <small>
            {paymentCount} payment
            {paymentCount === 1 ? "" : "s"}
          </small>
        </div>

        <div
          className={
            paymentStatus.type === "pending"
              ? "pending-box"
              : paymentStatus.type === "advance"
                ? "advance-box"
                : "pending-box clear-payment-box"
          }
        >
          <span>
            {paymentStatus.icon} {paymentStatus.hindi}
          </span>

          <strong>
            ₹
            {formatMoney(
              paymentStatus.type === "advance" ? advanceAmount : pendingAmount,
            )}
          </strong>

          <small>{paymentStatus.english}</small>
        </div>
      </div>

      {/* =============================================
          PAYMENT STATUS BANNER
      ============================================== */}

      {totalBill > 0 && (
        <div className={`customer-payment-status ${paymentStatus.type}`}>
          <span>{paymentStatus.icon}</span>

          <div>
            <strong>
              {paymentStatus.type === "pending"
                ? `₹${formatMoney(pendingAmount)} बाकी है`
                : paymentStatus.type === "advance"
                  ? `₹${formatMoney(advanceAmount)} ज्यादा जमा है`
                  : "पूरा हिसाब साफ है"}
            </strong>

            <small>
              {paymentStatus.type === "pending"
                ? "Customer payment बाकी / Payment Pending"
                : paymentStatus.type === "advance"
                  ? "Advance payment / अग्रिम जमा"
                  : "No pending payment / कोई बाकी नहीं"}
            </small>
          </div>
        </div>
      )}

      {/* =============================================
          ACTIONS
      ============================================== */}

      <div className="customer-card-actions">
        <button
          type="button"
          className="add-milk-card-btn"
          onClick={() => onAddMilk(customer)}
        >
          🥛
          <div>
            <strong>आज दूध जोड़ें</strong>

            <small>Add Milk</small>
          </div>
        </button>

        <button
          type="button"
          className="more-customer-btn"
          onClick={handleDetails}
          title="Customer Details"
        >
          ⋮
        </button>
      </div>

      {/* =============================================
          DEACTIVATE
      ============================================== */}

      <button
        type="button"
        className="deactivate-customer-btn"
        onClick={() => onDeactivate(customer)}
      >
        Customer Inactive करें
      </button>
    </article>
  );
};

// =====================================================
// MAIN CUSTOMERS
// =====================================================

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showMilkModal, setShowMilkModal] = useState(false);

  // ===================================================
  // FETCH CUSTOMERS
  // ===================================================

  const fetchCustomers = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/customers", {
          params: {
            search: search.trim(),
            status: "active",
            _t: Date.now(),
          },
        });

        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setCustomers(list);
      } catch (error) {
        console.error("Fetch Customers Error:", error);

        if (!silent) {
          alert(
            error?.response?.data?.message || "Customer list load नहीं हो पाई।",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  // ===================================================
  // INITIAL / SEARCH
  // ===================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // ===================================================
  // PAYMENT UPDATED
  // ===================================================

  useEffect(() => {
    const handlePaymentUpdated = () => {
      fetchCustomers(true);
    };

    window.addEventListener("customer-payment-updated", handlePaymentUpdated);

    return () => {
      window.removeEventListener(
        "customer-payment-updated",
        handlePaymentUpdated,
      );
    };
  }, [fetchCustomers]);

  // ===================================================
  // PAGE FOCUS
  // ===================================================

  useEffect(() => {
    const handleFocus = () => {
      fetchCustomers(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchCustomers(true);
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchCustomers]);

  // ===================================================
  // CUSTOMER SAVED
  // ===================================================

  const handleCustomerSaved = async () => {
    setShowForm(false);

    await fetchCustomers(true);
  };

  // ===================================================
  // ADD MILK
  // ===================================================

  const handleAddMilk = (customer) => {
    setSelectedCustomer(customer);

    setShowMilkModal(true);
  };

  // ===================================================
  // MILK SAVED
  // ===================================================

  const handleMilkSaved = async () => {
    setShowMilkModal(false);

    setSelectedCustomer(null);

    await fetchCustomers(true);
  };

  // ===================================================
  // DEACTIVATE
  // ===================================================

  const handleDeactivate = async (customer) => {
    if (!customer?._id) return;

    const confirmed = window.confirm(
      `क्या आप "${customer.name}" को inactive करना चाहते हैं?\n\nDo you want to deactivate this customer?`,
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/customers/${customer._id}`);

      if (response.data?.success) {
        alert("✅ Customer successfully inactive हो गया।");

        await fetchCustomers(true);
      }
    } catch (error) {
      console.error("Deactivate Customer Error:", error);

      alert(
        error?.response?.data?.message || "Customer deactivate नहीं हो पाया।",
      );
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = () => {
    fetchCustomers(true);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="customers-page">
      {/* =============================================
          HEADER
      ============================================== */}

      <div className="customers-header">
        <div className="customers-title">
          <div className="customers-main-icon">👥</div>

          <div>
            <h1>Customers</h1>

            <p>
              अपने सभी ग्राहकों का हिसाब
              <span>Customer Management</span>
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              border: "1px solid #dbe5e1",
              background: "#fff",
              borderRadius: "12px",
              padding: "11px 15px",
              cursor: refreshing ? "not-allowed" : "pointer",
              fontWeight: 800,
              color: "#14532d",
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing ? "⏳" : "↻"} Refresh
          </button>

          <button
            type="button"
            className="add-customer-btn"
            onClick={() => setShowForm(true)}
          >
            <span>➕</span>

            <div>
              <strong>नया ग्राहक</strong>

              <small>Add Customer</small>
            </div>
          </button>
        </div>
      </div>

      {/* =============================================
          SEARCH
      ============================================== */}

      <div className="customers-toolbar">
        <div className="customer-search">
          <span>🔎</span>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नाम, मोबाइल या Customer ID खोजें..."
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="customer-count">
          <strong>{customers.length}</strong>

          <div>
            <span>Active Customers</span>

            <small>सक्रिय ग्राहक</small>
          </div>
        </div>
      </div>

      {/* =============================================
          PAYMENT INFO
      ============================================== */}

      <div
        style={{
          marginBottom: "15px",
          padding: "13px 17px",
          borderRadius: "14px",
          background: "linear-gradient(135deg,#ecfdf5,#f0fdf4)",
          border: "1px solid #bbf7d0",
          color: "#166534",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        💰 <strong>Payment / भुगतान:</strong> Card में जमा और बाकी रकम latest
        payment के अनुसार दिखाई जाएगी।
      </div>

      {/* =============================================
          CUSTOMER LIST
      ============================================== */}

      {loading ? (
        <div className="customers-loading">
          <div>👥</div>

          <h3>Customer list load हो रही है...</h3>

          <p>Please wait...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="customers-empty">
          <div>👤</div>

          <h2>अभी कोई ग्राहक नहीं है</h2>

          <p>अपना पहला customer जोड़कर दूध का हिसाब शुरू करें।</p>

          <small>Add your first customer to start tracking milk.</small>

          <button type="button" onClick={() => setShowForm(true)}>
            ➕ नया ग्राहक जोड़ें
          </button>
        </div>
      ) : (
        <div className="customers-grid">
          {customers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onAddMilk={handleAddMilk}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      )}

      {/* =============================================
          CUSTOMER FORM
      ============================================== */}

      {showForm && (
        <CustomerForm
          onClose={() => setShowForm(false)}
          onSaved={handleCustomerSaved}
        />
      )}

      {/* =============================================
          MILK MODAL
      ============================================== */}

      {showMilkModal && selectedCustomer && (
        <CustomerMilkModal
          customer={selectedCustomer}
          onClose={() => {
            setShowMilkModal(false);

            setSelectedCustomer(null);
          }}
          onSaved={handleMilkSaved}
        />
      )}
    </div>
  );
};

export default Customers;

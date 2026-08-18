// import React, { useEffect, useState } from "react";
// import api from "../../services/api";
// import { useNavigate } from "react-router-dom";

// const CustomerCard = ({ customer, onAddMilk, onDeactivate }) => {
//   const navigate = useNavigate();

//   const [summary, setSummary] = useState(null);
//   const [todayMilk, setTodayMilk] = useState(null);
//   const [loading, setLoading] = useState(true);

//   /* =========================================================
//      LOAD CUSTOMER DATA
//   ========================================================= */

//   const loadCustomerData = async () => {
//     if (!customer?._id) {
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);

//       const [summaryResponse, todayResponse] = await Promise.all([
//         api.get(`/customer-milk/${customer._id}/monthly-summary`),

//         api.get(`/customer-milk/${customer._id}/today`),
//       ]);

//       setSummary(summaryResponse.data?.data || null);

//       setTodayMilk(todayResponse.data?.data || null);
//     } catch (error) {
//       console.error("Customer Card Error:", error);

//       setSummary(null);
//       setTodayMilk(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =========================================================
//      EFFECT
//   ========================================================= */

//   useEffect(() => {
//     loadCustomerData();
//   }, [customer?._id]);

//   /* =========================================================
//      NUMBER FORMAT
//   ========================================================= */

//   const formatNumber = (value) => {
//     const number = Number(value);

//     if (!Number.isFinite(number)) {
//       return "0";
//     }

//     return number.toLocaleString("en-IN", {
//       maximumFractionDigits: 2,
//     });
//   };

//   /* =========================================================
//      MONTH SUMMARY
//   ========================================================= */

//   const summaryData = summary?.summary || {};

//   const totalMilk = Number(summaryData.totalMilk || 0);

//   const totalAmount = Number(summaryData.totalAmount || 0);

//   /*
//    * Payment data CustomerPayment module से आएगा.
//    * CustomerMilkLog में paidAmount नहीं होना चाहिए.
//    */

//   const totalPaid = Number(summaryData.totalPaid || 0);

//   const calculatedPending = Math.max(totalAmount - totalPaid, 0);

//   const pendingAmount = Number(summaryData.pendingAmount ?? calculatedPending);

//   /* =========================================================
//      TODAY CUSTOMER MILK
//   ========================================================= */

//   const morningMilk = Number(todayMilk?.morningMilk || 0);

//   const eveningMilk = Number(todayMilk?.eveningMilk || 0);

//   const todayTotalMilk = Number(
//     todayMilk?.totalMilk ?? morningMilk + eveningMilk,
//   );

//   const todayAmount = Number(todayMilk?.amount || 0);

//   /* =========================================================
//      MILK TYPE
//   ========================================================= */

//   const getMilkIcon = () => {
//     switch (customer?.milkType) {
//       case "buffalo":
//         return "🐃";

//       case "mixed":
//         return "🥛";

//       case "cow":
//       default:
//         return "🐄";
//     }
//   };

//   const getMilkTypeName = () => {
//     switch (customer?.milkType) {
//       case "buffalo":
//         return "भैंस का दूध";

//       case "mixed":
//         return "मिक्स दूध";

//       case "cow":
//       default:
//         return "गाय का दूध";
//     }
//   };

//   /* =========================================================
//      CUSTOMER DETAILS
//   ========================================================= */

//   const handleCustomerDetails = () => {
//     if (!customer?._id) {
//       alert("Customer ID नहीं मिला");

//       return;
//     }

//     navigate(`/customers/${customer._id}`, {
//       state: {
//         customer,
//       },
//     });
//   };

//   /* =========================================================
//      ADD MILK
//   ========================================================= */

//   const handleAddMilk = () => {
//     if (!customer?._id) {
//       alert("Customer ID नहीं मिला");

//       return;
//     }

//     if (typeof onAddMilk === "function") {
//       onAddMilk(customer);
//     }
//   };

//   /* =========================================================
//      DEACTIVATE
//   ========================================================= */

//   const handleDeactivate = () => {
//     if (!customer?._id) {
//       alert("Customer ID नहीं मिला");

//       return;
//     }

//     if (typeof onDeactivate === "function") {
//       onDeactivate(customer);
//     }
//   };

//   /* =========================================================
//      STATUS
//   ========================================================= */

//   const isInactive = customer?.status === "inactive";

//   /* =========================================================
//      RENDER
//   ========================================================= */

//   return (
//     <div
//       className={`customer-card ${isInactive ? "customer-card-inactive" : ""}`}
//     >
//       {/* =====================================================
//           HEADER
//       ===================================================== */}

//       <div className="customer-card-header">
//         <div className="customer-avatar">
//           {customer?.name?.charAt(0)?.toUpperCase() || "C"}
//         </div>

//         <div className="customer-card-name">
//           <h3>{customer?.name || "Customer"}</h3>

//           <p>{customer?.customerCode || "No Code"}</p>
//         </div>

//         <div
//           className={`customer-status ${isInactive ? "inactive" : "active"}`}
//         >
//           {isInactive ? "Inactive" : "Active"}
//         </div>
//       </div>

//       {/* =====================================================
//           BASIC INFO
//       ===================================================== */}

//       <div className="customer-basic-info">
//         {/* PHONE */}

//         <div>
//           <span>📞</span>

//           <div>
//             <strong>{customer?.phone || "Mobile नहीं है"}</strong>

//             <small>Mobile</small>
//           </div>
//         </div>

//         {/* MILK TYPE */}

//         <div>
//           <span>{getMilkIcon()}</span>

//           <div>
//             <strong>{getMilkTypeName()}</strong>

//             <small>Milk Type</small>
//           </div>
//         </div>
//       </div>

//       {/* =====================================================
//           TODAY CUSTOMER MILK
//       ===================================================== */}

//       <div className="customer-today-box">
//         <div className="customer-today-header">
//           <div>
//             <strong>🥛 आज का दूध</strong>

//             <small>Today's Customer Milk</small>
//           </div>

//           {todayMilk && <span>₹{formatNumber(todayAmount)}</span>}
//         </div>

//         {loading ? (
//           <div className="card-loading">
//             <span>🥛</span>
//             Loading...
//           </div>
//         ) : todayMilk ? (
//           <div className="today-milk-grid">
//             {/* MORNING */}

//             <div>
//               <span>🌅</span>

//               <strong>
//                 {formatNumber(morningMilk)}

//                 <small>L</small>
//               </strong>

//               <p>Morning</p>
//             </div>

//             {/* EVENING */}

//             <div>
//               <span>🌆</span>

//               <strong>
//                 {formatNumber(eveningMilk)}

//                 <small>L</small>
//               </strong>

//               <p>Evening</p>
//             </div>

//             {/* TOTAL */}

//             <div>
//               <span>🥛</span>

//               <strong>
//                 {formatNumber(todayTotalMilk)}

//                 <small>L</small>
//               </strong>

//               <p>Total</p>
//             </div>
//           </div>
//         ) : (
//           <div className="no-today-milk">
//             <span>🥛</span>

//             <div>
//               <strong>आज दूध दर्ज नहीं हुआ</strong>

//               <small>No milk recorded today</small>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* =====================================================
//           MONTH SUMMARY
//       ===================================================== */}

//       <div className="customer-month-summary">
//         <div>
//           <strong>
//             {formatNumber(totalMilk)}

//             <small>L</small>
//           </strong>

//           <span>इस महीने</span>

//           <small>This Month</small>
//         </div>

//         <div>
//           <strong>₹{formatNumber(totalAmount)}</strong>

//           <span>कुल बिल</span>

//           <small>Total Bill</small>
//         </div>
//       </div>

//       {/* =====================================================
//           PAYMENT SUMMARY
//           Payment अभी भी अलग module से आएगा.
//       ===================================================== */}

//       <div className="customer-payment-summary">
//         <div className="paid-box">
//           <span>✅ Paid</span>

//           <strong>₹{formatNumber(totalPaid)}</strong>
//         </div>

//         <div className="pending-box">
//           <span>⏳ Pending</span>

//           <strong>₹{formatNumber(pendingAmount)}</strong>
//         </div>
//       </div>

//       {/* =====================================================
//           ACTIONS
//       ===================================================== */}

//       <div className="customer-card-actions">
//         <button
//           type="button"
//           className="add-milk-card-btn"
//           onClick={handleAddMilk}
//           disabled={isInactive}
//         >
//           <span>🥛</span>

//           <div>
//             <strong>आज दूध जोड़ें</strong>

//             <small>Add Milk</small>
//           </div>
//         </button>

//         <button
//           type="button"
//           className="more-customer-btn"
//           onClick={handleCustomerDetails}
//           title="Customer Details"
//           aria-label="Customer Details"
//         >
//           ⋮
//         </button>
//       </div>

//       {/* =====================================================
//           DEACTIVATE
//       ===================================================== */}

//       {!isInactive && (
//         <button
//           type="button"
//           className="deactivate-customer-btn"
//           onClick={handleDeactivate}
//         >
//           Customer Inactive करें
//         </button>
//       )}
//     </div>
//   );
// };

// export default CustomerCard;

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const CustomerCard = ({ customer, onAddMilk, onDeactivate }) => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(customer?.financialSummary || null);

  const [todayMilk, setTodayMilk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // FORMAT
  // =====================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // LOAD CUSTOMER DATA
  // =====================================================

  const loadCustomerData = useCallback(
    async (silent = false) => {
      if (!customer?._id) return;

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [summaryResponse, todayResponse] = await Promise.all([
          api.get(`/customer-milk/${customer._id}/monthly-summary`, {
            params: {
              month: new Date().toISOString().slice(0, 7),
            },
          }),

          api.get(`/customer-milk/${customer._id}/today`),
        ]);

        const summaryData = summaryResponse.data?.data?.summary || {};

        setSummary({
          ...summaryData,
          totalMilk: Number(summaryData.totalMilk || 0),
          totalAmount: Number(summaryData.totalAmount || 0),
          totalPaid: Number(summaryData.totalPaid || 0),
          pendingAmount: Number(summaryData.pendingAmount || 0),
        });

        setTodayMilk(todayResponse.data?.data || null);
      } catch (error) {
        console.error("Customer Card Error:", error);

        /*
         * अगर monthly-summary fail हो जाए,
         * तो customer list से मिला latest
         * financial summary दिखाते रहेंगे।
         */
        if (!summary && customer?.financialSummary) {
          setSummary(customer.financialSummary);
        }

        setTodayMilk(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customer?._id, customer?.financialSummary],
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!customer?._id) return;

    setSummary(
      customer.financialSummary || {
        totalMilk: customer.totalMilk || 0,
        totalAmount: customer.totalAmount || 0,
        totalPaid: customer.totalPaid || 0,
        pendingAmount: customer.pendingAmount || 0,
      },
    );

    loadCustomerData();
  }, [customer?._id]);

  // =====================================================
  // IMPORTANT:
  // PAYMENT PAGE से वापस आने पर card refresh होगा
  // =====================================================

  useEffect(() => {
    const handlePaymentUpdated = () => {
      loadCustomerData(true);
    };

    const handleWindowFocus = () => {
      loadCustomerData(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCustomerData(true);
      }
    };

    window.addEventListener("customer-payment-updated", handlePaymentUpdated);

    window.addEventListener("focus", handleWindowFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(
        "customer-payment-updated",
        handlePaymentUpdated,
      );

      window.removeEventListener("focus", handleWindowFocus);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadCustomerData]);

  // =====================================================
  // PAYMENT SUMMARY
  // =====================================================

  const summaryData = summary || {};

  const totalMilk = Number(
    summaryData.totalMilk ??
      customer?.financialSummary?.totalMilk ??
      customer?.totalMilk ??
      0,
  );

  const totalAmount = Number(
    summaryData.totalAmount ??
      customer?.financialSummary?.totalAmount ??
      customer?.totalAmount ??
      0,
  );

  const totalPaid = Number(
    summaryData.totalPaid ??
      customer?.financialSummary?.totalPaid ??
      customer?.totalPaid ??
      0,
  );

  const pendingAmount = Math.max(
    Number(
      summaryData.pendingAmount ??
        customer?.financialSummary?.pendingAmount ??
        customer?.pendingAmount ??
        totalAmount - totalPaid,
    ),
    0,
  );

  // =====================================================
  // TODAY MILK
  // =====================================================

  const morningMilk = Number(todayMilk?.morningMilk || 0);

  const eveningMilk = Number(todayMilk?.eveningMilk || 0);

  const todayTotalMilk = Number(
    todayMilk?.totalMilk ?? morningMilk + eveningMilk,
  );

  const todayAmount = Number(todayMilk?.amount || 0);

  // =====================================================
  // MILK TYPE
  // =====================================================

  const getMilkIcon = () => {
    if (customer?.milkType === "buffalo") {
      return "🐃";
    }

    if (customer?.milkType === "mixed") {
      return "🥛";
    }

    return "🐄";
  };

  const getMilkTypeName = () => {
    if (customer?.milkType === "buffalo") {
      return "भैंस का दूध";
    }

    if (customer?.milkType === "mixed") {
      return "मिक्स दूध";
    }

    return "गाय का दूध";
  };

  // =====================================================
  // DETAILS
  // =====================================================

  const handleCustomerDetails = () => {
    if (!customer?._id) {
      alert("Customer ID नहीं मिला।");
      return;
    }

    navigate(`/customers/${customer._id}`);
  };

  // =====================================================
  // PAYMENT PAGE
  // =====================================================

  const handlePayment = () => {
    if (!customer?._id) {
      alert("Customer ID नहीं मिला।");
      return;
    }

    navigate(`/customers/${customer._id}/payment`);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customer-card">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="customer-card-header">
        <div className="customer-avatar">
          {customer?.name?.charAt(0)?.toUpperCase() || "C"}
        </div>

        <div className="customer-card-name">
          <h3>{customer?.name || "Customer"}</h3>

          <p>{customer?.customerCode || "No Code"}</p>
        </div>

        <div className="customer-status">Active</div>
      </div>

      {/* =================================================
          BASIC INFO
      ================================================= */}

      <div className="customer-basic-info">
        <div>
          <span>📞</span>

          <div>
            <strong>{customer?.phone || "Mobile नहीं है"}</strong>

            <small>Mobile</small>
          </div>
        </div>

        <div>
          <span>{getMilkIcon()}</span>

          <div>
            <strong>{getMilkTypeName()}</strong>

            <small>Milk Type</small>
          </div>
        </div>
      </div>

      {/* =================================================
          TODAY MILK
      ================================================= */}

      <div className="customer-today-box">
        <div className="customer-today-header">
          <div>
            <strong>🥛 आज का दूध</strong>

            <small>Today's Milk</small>
          </div>

          <span>₹{formatNumber(todayAmount)}</span>
        </div>

        {loading ? (
          <div className="card-loading">Loading...</div>
        ) : (
          <div className="today-milk-grid">
            <div>
              <span>🌅</span>

              <strong>
                {formatNumber(morningMilk)}
                <small>L</small>
              </strong>

              <p>Morning</p>
            </div>

            <div>
              <span>🌆</span>

              <strong>
                {formatNumber(eveningMilk)}
                <small>L</small>
              </strong>

              <p>Evening</p>
            </div>

            <div>
              <span>🥛</span>

              <strong>
                {formatNumber(todayTotalMilk)}
                <small>L</small>
              </strong>

              <p>Total</p>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          MONTH SUMMARY
      ================================================= */}

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
          <strong>₹{formatNumber(totalAmount)}</strong>

          <span>कुल बिल</span>

          <small>Total Bill</small>
        </div>
      </div>

      {/* =================================================
          PAYMENT SUMMARY
      ================================================= */}

      <div className="customer-payment-summary">
        <div className="paid-box">
          <span>✅ जमा / Paid</span>

          <strong>₹{formatNumber(totalPaid)}</strong>
        </div>

        <div className="pending-box">
          <span>⏳ बाकी / Pending</span>

          <strong>₹{formatNumber(pendingAmount)}</strong>
        </div>
      </div>

      {/* =================================================
          PAYMENT STATUS
      ================================================= */}

      <div
        style={{
          marginTop: "10px",
          padding: "9px 12px",
          borderRadius: "12px",
          background: pendingAmount > 0 ? "#fff7ed" : "#ecfdf5",
          color: pendingAmount > 0 ? "#c2410c" : "#047857",
          fontSize: "13px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <span>
          {pendingAmount > 0
            ? "⚠️ ग्राहक का पैसा बाकी है"
            : "✅ पूरा हिसाब साफ है"}
        </span>

        {refreshing && (
          <span
            style={{
              fontSize: "11px",
              opacity: 0.7,
            }}
          >
            Updating...
          </span>
        )}
      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

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
          onClick={handleCustomerDetails}
          title="Customer Details"
        >
          ⋮
        </button>

        <button
          type="button"
          onClick={handlePayment}
          style={{
            border: "none",
            borderRadius: "12px",
            padding: "10px 13px",
            background: pendingAmount > 0 ? "#00a65a" : "#e2e8f0",
            color: pendingAmount > 0 ? "#fff" : "#475569",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          💰
          <span style={{ marginLeft: 5 }}>Payment</span>
        </button>
      </div>

      {/* =================================================
          DEACTIVATE
      ================================================= */}

      <button
        type="button"
        className="deactivate-customer-btn"
        onClick={() => onDeactivate(customer)}
      >
        Customer Inactive करें
      </button>
    </div>
  );
};

export default CustomerCard;

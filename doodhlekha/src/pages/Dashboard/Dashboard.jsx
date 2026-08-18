// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";
// import "./Dashboard.css";

// const Dashboard = () => {
//   const navigate = useNavigate();

//   const [dashboard, setDashboard] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");

//   // =====================================================
//   // HELPERS
//   // =====================================================

//   const getNumber = (value) => {
//     const number = Number(value);
//     return Number.isFinite(number) ? number : 0;
//   };

//   const money = (value) =>
//     `₹${getNumber(value).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;

//   const liters = (value) =>
//     `${getNumber(value).toLocaleString("en-IN", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     })} L`;

//   // =====================================================
//   // NAVIGATION
//   // =====================================================

//   const goTo = useCallback(
//     (path) => {
//       if (!path) return;
//       navigate(path);
//     },
//     [navigate],
//   );

//   const handleCardKeyDown = useCallback(
//     (event, path) => {
//       if (event.key === "Enter" || event.key === " ") {
//         event.preventDefault();
//         goTo(path);
//       }
//     },
//     [goTo],
//   );

//   // =====================================================
//   // LOAD DASHBOARD
//   // =====================================================

//   const loadDashboard = useCallback(async (isRefresh = false) => {
//     try {
//       setError("");

//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }

//       const response = await api.get("/dashboard", {
//         params: {
//           _t: Date.now(),
//         },
//       });

//       const result = response?.data;

//       if (!result?.success) {
//         throw new Error(result?.message || "Dashboard data load नहीं हो पाया।");
//       }

//       setDashboard(result.data || {});
//     } catch (err) {
//       console.error("Dashboard Load Error:", err);

//       if (err?.response?.status === 401) {
//         setError(
//           "आपका login session expire हो गया है। कृपया दोबारा login करें।",
//         );
//       } else {
//         setError(
//           err?.response?.data?.message ||
//             err?.message ||
//             "Dashboard data load नहीं हो पाया।",
//         );
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadDashboard();
//   }, [loadDashboard]);

//   // =====================================================
//   // DATA
//   // =====================================================

//   const data = dashboard || {};

//   const cows = data.cows || {};
//   const customers = data.customers || {};
//   const today = data.today || {};
//   const month = data.month || {};
//   const recent = data.recent || {};

//   // =====================================================
//   // MILK BALANCE
//   // =====================================================

//   const milkBalance = useMemo(() => {
//     const production = getNumber(today.totalMilk);
//     const sold = getNumber(today.customerMilk);

//     if (production <= 0) {
//       return 0;
//     }

//     return Math.max(production - sold, 0);
//   }, [today.totalMilk, today.customerMilk]);

//   const todayMilk =
//     getNumber(today.totalMilk) ||
//     getNumber(today.morningMilk) + getNumber(today.eveningMilk);

//   const monthNet = getNumber(month.payments) - getNumber(month.expenses);

//   const recentMilkLogs = Array.isArray(recent.milkLogs) ? recent.milkLogs : [];

//   const recentExpenses = Array.isArray(recent.expenses) ? recent.expenses : [];

//   const recentPayments = Array.isArray(recent.payments) ? recent.payments : [];

//   // =====================================================
//   // LOADING
//   // =====================================================

//   if (loading) {
//     return (
//       <div className="dashboard-page">
//         <div className="dashboard-loading">
//           <div className="dashboard-spinner" />

//           <h3>Dashboard लोड हो रहा है...</h3>

//           <p>आपका डेयरी हिसाब तैयार किया जा रहा है।</p>
//         </div>
//       </div>
//     );
//   }

//   // =====================================================
//   // PAGE
//   // =====================================================

//   return (
//     <div className="dashboard-page">
//       <div className="dashboard-container">
//         {/* =====================================================
//             HEADER
//         ===================================================== */}

//         <div className="dashboard-header">
//           <div>
//             <div className="dashboard-eyebrow">🥛 DOODHLEKHA</div>

//             <h1>नमस्ते किसान जी 👋</h1>

//             <p>आपकी डेयरी का आज का पूरा हिसाब एक ही जगह।</p>
//           </div>

//           <div className="dashboard-actions">
//             <button
//               type="button"
//               className="dashboard-btn secondary"
//               onClick={() => loadDashboard(true)}
//               disabled={refreshing}
//             >
//               <span className={refreshing ? "spin" : ""}>↻</span>

//               {refreshing ? "Loading..." : "Refresh"}
//             </button>

//             <button
//               type="button"
//               className="dashboard-btn primary"
//               onClick={() => goTo("/reports")}
//             >
//               📊 Reports
//             </button>
//           </div>
//         </div>

//         {/* =====================================================
//             ERROR
//         ===================================================== */}

//         {error && (
//           <div className="dashboard-error">
//             <div className="dashboard-error-icon">!</div>

//             <div>
//               <strong>Dashboard data नहीं मिला</strong>

//               <p>{error}</p>
//             </div>

//             <button type="button" onClick={() => loadDashboard(true)}>
//               फिर कोशिश करें
//             </button>
//           </div>
//         )}

//         {/* =====================================================
//             TODAY HERO
//         ===================================================== */}

//         <section
//           className="dashboard-hero clickable-section"
//           onClick={() => goTo("/milk-sale")}
//           role="button"
//           tabIndex={0}
//           onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//         >
//           <div className="hero-content">
//             <span className="hero-badge">📅 आज का हिसाब</span>

//             <h2>आज की डेयरी स्थिति</h2>

//             <p>दूध उत्पादन, बिक्री और खर्च का आसान हिसाब।</p>

//             <div className="hero-stats">
//               <div>
//                 <span>आज का दूध</span>
//                 <strong>{liters(todayMilk)}</strong>
//               </div>

//               <div>
//                 <span>सुबह</span>
//                 <strong>{liters(today.morningMilk)}</strong>
//               </div>

//               <div>
//                 <span>शाम</span>
//                 <strong>{liters(today.eveningMilk)}</strong>
//               </div>
//             </div>
//           </div>

//           <div className="hero-milk-icon">🥛</div>
//         </section>

//         {/* =====================================================
//             MAIN STAT CARDS
//         ===================================================== */}

//         <div className="dashboard-grid four">
//           {/* COWS */}

//           <div
//             className="dashboard-card stat-card clickable-card"
//             onClick={() => goTo("/cows")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/cows")}
//             title="गाय / भैंस की जानकारी खोलें"
//           >
//             <div className="stat-icon blue">🐄</div>

//             <div className="stat-content">
//               <span>कुल गाय / भैंस</span>

//               <strong>{getNumber(cows.total)}</strong>

//               <small>दूध देने वाली: {getNumber(cows.milking)}</small>
//             </div>

//             <span className="card-arrow">→</span>
//           </div>

//           {/* CUSTOMERS */}

//           <div
//             className="dashboard-card stat-card clickable-card"
//             onClick={() => goTo("/customers")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/customers")}
//             title="Customers खोलें"
//           >
//             <div className="stat-icon purple">👥</div>

//             <div className="stat-content">
//               <span>Active Customers</span>

//               <strong>{getNumber(customers.total)}</strong>

//               <small>कुल सक्रिय ग्राहक</small>
//             </div>

//             <span className="card-arrow">→</span>
//           </div>

//           {/* MILK SALE */}

//           <div
//             className="dashboard-card stat-card clickable-card"
//             onClick={() => goTo("/milk-sale")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//             title="Milk Sale खोलें"
//           >
//             <div className="stat-icon green">🥛</div>

//             <div className="stat-content">
//               <span>आज दूध बिक्री</span>

//               <strong>{liters(todayMilk)}</strong>

//               <small>{money(today.milkSaleAmount)}</small>
//             </div>

//             <span className="card-arrow">→</span>
//           </div>

//           {/* EXPENSE */}

//           <div
//             className="dashboard-card stat-card clickable-card"
//             onClick={() => goTo("/expenses")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/expenses")}
//             title="Expenses खोलें"
//           >
//             <div className="stat-icon orange">💸</div>

//             <div className="stat-content">
//               <span>आज का खर्च</span>

//               <strong>{money(today.expense)}</strong>

//               <small>आज का कुल खर्च</small>
//             </div>

//             <span className="card-arrow">→</span>
//           </div>
//         </div>

//         {/* =====================================================
//             TODAY OVERVIEW
//         ===================================================== */}

//         <section className="dashboard-section">
//           <div className="section-heading">
//             <div>
//               <span className="section-label">TODAY</span>

//               <h2>आज का पूरा हिसाब</h2>
//             </div>

//             <button type="button" onClick={() => goTo("/milk-sale")}>
//               दूध बिक्री देखें →
//             </button>
//           </div>

//           <div className="dashboard-grid three">
//             {/* MORNING */}

//             <div
//               className="dashboard-card overview-card clickable-card"
//               onClick={() => goTo("/milk-sale")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//             >
//               <div className="overview-top">
//                 <span className="overview-icon">🌅</span>

//                 <span className="overview-title">Morning Milk</span>
//               </div>

//               <strong>{liters(today.morningMilk)}</strong>

//               <p>सुबह का कुल दूध</p>
//             </div>

//             {/* EVENING */}

//             <div
//               className="dashboard-card overview-card clickable-card"
//               onClick={() => goTo("/milk-sale")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//             >
//               <div className="overview-top">
//                 <span className="overview-icon">🌙</span>

//                 <span className="overview-title">Evening Milk</span>
//               </div>

//               <strong>{liters(today.eveningMilk)}</strong>

//               <p>शाम का कुल दूध</p>
//             </div>

//             {/* SALE AMOUNT */}

//             <div
//               className="dashboard-card overview-card clickable-card"
//               onClick={() => goTo("/milk-sale")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//             >
//               <div className="overview-top">
//                 <span className="overview-icon">💰</span>

//                 <span className="overview-title">Milk Sale Amount</span>
//               </div>

//               <strong>{money(today.milkSaleAmount)}</strong>

//               <p>आज दूध से बिक्री</p>
//             </div>
//           </div>
//         </section>

//         {/* =====================================================
//             MONTH SUMMARY
//         ===================================================== */}

//         <section className="dashboard-section">
//           <div className="section-heading">
//             <div>
//               <span className="section-label">THIS MONTH</span>

//               <h2>इस महीने का हिसाब</h2>
//             </div>
//           </div>

//           <div className="dashboard-grid four">
//             {/* CUSTOMER MILK */}

//             <div
//               className="dashboard-card financial-card clickable-card"
//               onClick={() => goTo("/milk-sale")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//             >
//               <span className="financial-icon">🥛</span>

//               <span>Customer Milk</span>

//               <strong>{liters(month.milk)}</strong>

//               <small>ग्राहकों को दिया दूध</small>
//             </div>

//             {/* MILK AMOUNT */}

//             <div
//               className="dashboard-card financial-card clickable-card"
//               onClick={() => goTo("/reports")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/reports")}
//             >
//               <span className="financial-icon">🧾</span>

//               <span>Milk Amount</span>

//               <strong>{money(month.milkAmount)}</strong>

//               <small>दूध की कुल कीमत</small>
//             </div>

//             {/* PAYMENT */}

//             <div
//               className="dashboard-card financial-card clickable-card"
//               onClick={() => goTo("/customers")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/customers")}
//             >
//               <span className="financial-icon">💵</span>

//               <span>Payment Received</span>

//               <strong>{money(month.payments)}</strong>

//               <small>ग्राहकों से प्राप्त</small>
//             </div>

//             {/* EXPENSE */}

//             <div
//               className="dashboard-card financial-card clickable-card"
//               onClick={() => goTo("/expenses")}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => handleCardKeyDown(e, "/expenses")}
//             >
//               <span className="financial-icon">💸</span>

//               <span>Expenses</span>

//               <strong>{money(month.expenses)}</strong>

//               <small>कुल खर्च</small>
//             </div>
//           </div>

//           {/* NET */}

//           <div
//             className={`net-card ${
//               monthNet >= 0 ? "positive" : "negative"
//             } clickable-section`}
//             onClick={() => goTo("/reports")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/reports")}
//           >
//             <div>
//               <span>NET AMOUNT</span>

//               <h3>{money(monthNet)}</h3>

//               <p>Payment Received − Total Expenses</p>
//             </div>

//             <div className="net-icon">{monthNet >= 0 ? "📈" : "📉"}</div>
//           </div>
//         </section>

//         {/* =====================================================
//             MILK DISTRIBUTION
//         ===================================================== */}

//         <section className="dashboard-section">
//           <div className="section-heading">
//             <div>
//               <span className="section-label">MILK</span>

//               <h2>दूध की स्थिति</h2>
//             </div>
//           </div>

//           <div
//             className="milk-status-card clickable-section"
//             onClick={() => goTo("/milk-sale")}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//           >
//             <div className="milk-status-main">
//               <div className="large-milk-icon">🥛</div>

//               <div>
//                 <span>आज उपलब्ध दूध</span>

//                 <strong>{liters(milkBalance)}</strong>

//                 <p>Production − Customer Sale</p>
//               </div>
//             </div>

//             <div className="milk-progress-area">
//               <div className="progress-label">
//                 <span>आज का दूध</span>

//                 <strong>{liters(todayMilk)}</strong>
//               </div>

//               <div className="progress-track">
//                 <div
//                   className="progress-fill"
//                   style={{
//                     width:
//                       todayMilk > 0
//                         ? `${Math.min(
//                             ((getNumber(todayMilk) - milkBalance) /
//                               getNumber(todayMilk)) *
//                               100,
//                             100,
//                           )}%`
//                         : "0%",
//                   }}
//                 />
//               </div>

//               <div className="progress-bottom">
//                 <span>
//                   बिक्री: {liters(Math.max(todayMilk - milkBalance, 0))}
//                 </span>

//                 <span>बाकी: {liters(milkBalance)}</span>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* =====================================================
//             RECENT ACTIVITY
//         ===================================================== */}

//         <section className="dashboard-section">
//           <div className="section-heading">
//             <div>
//               <span className="section-label">RECENT ACTIVITY</span>

//               <h2>हाल की गतिविधियां</h2>
//             </div>
//           </div>

//           <div className="activity-grid">
//             {/* =================================================
//                 MILK
//             ================================================= */}

//             <div className="dashboard-card activity-card">
//               <div className="activity-header">
//                 <div>
//                   <span className="activity-icon milk">🥛</span>

//                   <div>
//                     <h3>Recent Milk</h3>

//                     <p>हाल की दूध entries</p>
//                   </div>
//                 </div>

//                 <button type="button" onClick={() => goTo("/milk-sale")}>
//                   View
//                 </button>
//               </div>

//               <div className="activity-list">
//                 {recentMilkLogs.length === 0 ? (
//                   <div className="empty-activity">
//                     🥛
//                     <span>अभी कोई milk entry नहीं है</span>
//                   </div>
//                 ) : (
//                   recentMilkLogs.slice(0, 5).map((item, index) => {
//                     const customer = item.customer || item.customerId || {};

//                     return (
//                       <div
//                         className="activity-row clickable-row"
//                         key={item._id || index}
//                         onClick={() => goTo("/milk-sale")}
//                         role="button"
//                         tabIndex={0}
//                         onKeyDown={(e) => handleCardKeyDown(e, "/milk-sale")}
//                       >
//                         <div>
//                           <strong>
//                             {customer.name ||
//                               customer.customerName ||
//                               "Customer"}
//                           </strong>

//                           <small>
//                             {item.date
//                               ? new Date(item.date).toLocaleDateString("en-IN")
//                               : "-"}
//                           </small>
//                         </div>

//                         <strong>{liters(item.totalMilk)}</strong>
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             </div>

//             {/* =================================================
//                 PAYMENTS
//             ================================================= */}

//             <div className="dashboard-card activity-card">
//               <div className="activity-header">
//                 <div>
//                   <span className="activity-icon payment">💰</span>

//                   <div>
//                     <h3>Recent Payments</h3>

//                     <p>हाल में जमा payment</p>
//                   </div>
//                 </div>

//                 <button type="button" onClick={() => goTo("/customers")}>
//                   View
//                 </button>
//               </div>

//               <div className="activity-list">
//                 {recentPayments.length === 0 ? (
//                   <div className="empty-activity">
//                     💰
//                     <span>अभी कोई payment नहीं है</span>
//                   </div>
//                 ) : (
//                   recentPayments.slice(0, 5).map((item, index) => {
//                     const customer = item.customerId || item.customer || {};

//                     return (
//                       <div
//                         className="activity-row clickable-row"
//                         key={item._id || index}
//                         onClick={() => goTo("/customers")}
//                         role="button"
//                         tabIndex={0}
//                         onKeyDown={(e) => handleCardKeyDown(e, "/customers")}
//                       >
//                         <div>
//                           <strong>
//                             {customer.name ||
//                               customer.customerName ||
//                               "Customer"}
//                           </strong>

//                           <small>
//                             {item.paymentDate
//                               ? new Date(item.paymentDate).toLocaleDateString(
//                                   "en-IN",
//                                 )
//                               : "-"}
//                           </small>
//                         </div>

//                         <strong className="amount-positive">
//                           +{money(item.amount)}
//                         </strong>
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             </div>

//             {/* =================================================
//                 EXPENSES
//             ================================================= */}

//             <div className="dashboard-card activity-card">
//               <div className="activity-header">
//                 <div>
//                   <span className="activity-icon expense">💸</span>

//                   <div>
//                     <h3>Recent Expenses</h3>

//                     <p>हाल के खर्च</p>
//                   </div>
//                 </div>

//                 <button type="button" onClick={() => goTo("/expenses")}>
//                   View
//                 </button>
//               </div>

//               <div className="activity-list">
//                 {recentExpenses.length === 0 ? (
//                   <div className="empty-activity">
//                     💸
//                     <span>अभी कोई expense नहीं है</span>
//                   </div>
//                 ) : (
//                   recentExpenses.slice(0, 5).map((item, index) => (
//                     <div
//                       className="activity-row clickable-row"
//                       key={item._id || index}
//                       onClick={() => goTo("/expenses")}
//                       role="button"
//                       tabIndex={0}
//                       onKeyDown={(e) => handleCardKeyDown(e, "/expenses")}
//                     >
//                       <div>
//                         <strong>
//                           {item.description || item.category || "Expense"}
//                         </strong>

//                         <small>
//                           {item.date
//                             ? new Date(item.date).toLocaleDateString("en-IN")
//                             : "-"}
//                         </small>
//                       </div>

//                       <strong className="amount-negative">
//                         -{money(item.amount)}
//                       </strong>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* =====================================================
//             QUICK ACTIONS
//         ===================================================== */}

//         <section className="dashboard-section">
//           <div className="section-heading">
//             <div>
//               <span className="section-label">QUICK ACTIONS</span>

//               <h2>जल्दी से काम करें</h2>
//             </div>
//           </div>

//           <div className="quick-actions">
//             {/* CUSTOMERS */}

//             <button type="button" onClick={() => goTo("/customers")}>
//               <span>👥</span>

//               <div>
//                 <strong>Customer</strong>

//                 <small>ग्राहक देखें</small>
//               </div>

//               <b>→</b>
//             </button>

//             {/* MILK */}

//             <button type="button" onClick={() => goTo("/milk-sale")}>
//               <span>🥛</span>

//               <div>
//                 <strong>Milk Sale</strong>

//                 <small>दूध बिक्री देखें</small>
//               </div>

//               <b>→</b>
//             </button>

//             {/* EXPENSE */}

//             <button type="button" onClick={() => goTo("/expenses")}>
//               <span>💸</span>

//               <div>
//                 <strong>Expense</strong>

//                 <small>खर्च जोड़ें</small>
//               </div>

//               <b>→</b>
//             </button>

//             {/* REPORT */}

//             <button type="button" onClick={() => goTo("/reports")}>
//               <span>📊</span>

//               <div>
//                 <strong>Reports</strong>

//                 <small>पूरी रिपोर्ट</small>
//               </div>

//               <b>→</b>
//             </button>
//           </div>
//         </section>

//         {/* =====================================================
//             FOOTER
//         ===================================================== */}

//         <footer className="dashboard-footer">
//           <strong>DOODHLEKHA</strong>

//           <span>Smart Dairy Management</span>
//         </footer>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // ROUTES
  // =====================================================

  const ROUTES = {
    dashboard: "/dashboard",
    cows: "/cow-entry",
    milkLogs: "/milk-logs",
    saleMilk: "/sale-milk",
    expenses: "/daily-expense",
    customers: "/customers",
    reports: "/reports",
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const money = (value) =>
    `₹${getNumber(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const liters = (value) =>
    `${getNumber(value).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} L`;

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goTo = useCallback(
    (path) => {
      if (!path) return;
      navigate(path);
    },
    [navigate],
  );

  const handleCardKeyDown = useCallback(
    (event, path) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goTo(path);
      }
    },
    [goTo],
  );

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/dashboard", {
        params: {
          _t: Date.now(),
        },
      });

      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Dashboard data load नहीं हो पाया।");
      }

      setDashboard(result.data || {});
    } catch (err) {
      console.error("Dashboard Load Error:", err);

      if (err?.response?.status === 401) {
        setError(
          "आपका login session expire हो गया है। कृपया दोबारा login करें।",
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Dashboard data load नहीं हो पाया।",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =====================================================
  // DATA
  // =====================================================

  const data = dashboard || {};

  const cows = data.cows || {};
  const customers = data.customers || {};
  const today = data.today || {};
  const month = data.month || {};
  const recent = data.recent || {};

  // New dashboard API structure support
  const milkLogs = data.milkLogs || {};
  const saleMilk = data.saleMilk || {};
  const todayMilkData = data.todayMilk || {};
  const monthlyMilk = data.monthlyMilk || {};

  // =====================================================
  // NORMALIZED VALUES
  // =====================================================

  const todayMorningMilk =
    getNumber(today.morningMilk) ||
    getNumber(milkLogs.today?.morning) ||
    getNumber(todayMilkData.morning);

  const todayEveningMilk =
    getNumber(today.eveningMilk) ||
    getNumber(milkLogs.today?.evening) ||
    getNumber(todayMilkData.evening);

  const todayMilk =
    getNumber(today.totalMilk) ||
    getNumber(milkLogs.today?.total) ||
    getNumber(todayMilkData.total) ||
    todayMorningMilk + todayEveningMilk;

  const todayMilkAmount =
    getNumber(today.milkSaleAmount) || getNumber(todayMilkData.amount);

  const todayExpense =
    getNumber(today.expense) || getNumber(data.todayExpenses);

  const monthlyMilkTotal =
    getNumber(month.milk) || getNumber(monthlyMilk.total);

  const monthlyMilkAmount =
    getNumber(month.milkAmount) || getNumber(monthlyMilk.amount);

  const monthlyPayments =
    getNumber(month.payments) || getNumber(data.monthlyPayments);

  const monthlyExpenses =
    getNumber(month.expenses) || getNumber(data.monthlyExpenses);

  const monthlyNet = monthlyPayments - monthlyExpenses;

  // =====================================================
  // SALE / REMAINING MILK
  // =====================================================

  const saleToday =
    getNumber(saleMilk.today?.totalSale) || getNumber(today.customerMilk);

  const availableToday = getNumber(saleMilk.today?.available) || todayMilk;

  const remainingToday =
    getNumber(saleMilk.today?.remaining) ||
    Math.max(availableToday - saleToday, 0);

  // =====================================================
  // RECENT DATA
  // =====================================================

  const recentMilkLogs = Array.isArray(recent.milkLogs)
    ? recent.milkLogs
    : Array.isArray(recent.customerMilk)
      ? recent.customerMilk
      : [];

  const recentExpenses = Array.isArray(recent.expenses) ? recent.expenses : [];

  const recentPayments = Array.isArray(recent.payments) ? recent.payments : [];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />

          <h3>Dashboard लोड हो रहा है...</h3>

          <p>आपका डेयरी हिसाब तैयार किया जा रहा है।</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow">🥛 DOODHLEKHA</div>

            <h1>नमस्ते किसान जी 👋</h1>

            <p>आपकी डेयरी का आज का पूरा हिसाब एक ही जगह।</p>
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="dashboard-btn secondary"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <span className={refreshing ? "spin" : ""}>↻</span>

              {refreshing ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="dashboard-btn primary"
              onClick={() => goTo(ROUTES.reports)}
            >
              📊 Reports
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="dashboard-error">
            <div className="dashboard-error-icon">!</div>

            <div>
              <strong>Dashboard data नहीं मिला</strong>

              <p>{error}</p>
            </div>

            <button type="button" onClick={() => loadDashboard(true)}>
              फिर कोशिश करें
            </button>
          </div>
        )}

        {/* =================================================
            TODAY HERO
        ================================================= */}

        <section
          className="dashboard-hero clickable-section"
          onClick={() => goTo(ROUTES.saleMilk)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => handleCardKeyDown(e, ROUTES.saleMilk)}
        >
          <div className="hero-content">
            <span className="hero-badge">📅 आज का हिसाब</span>

            <h2>आज की डेयरी स्थिति</h2>

            <p>दूध उत्पादन, बिक्री और खर्च का आसान हिसाब।</p>

            <div className="hero-stats">
              <div>
                <span>आज का दूध</span>
                <strong>{liters(todayMilk)}</strong>
              </div>

              <div>
                <span>सुबह</span>
                <strong>{liters(todayMorningMilk)}</strong>
              </div>

              <div>
                <span>शाम</span>
                <strong>{liters(todayEveningMilk)}</strong>
              </div>
            </div>
          </div>

          <div className="hero-milk-icon">🥛</div>
        </section>

        {/* =================================================
            MAIN STAT CARDS
        ================================================= */}

        <div className="dashboard-grid four">
          {/* COW */}

          <div
            className="dashboard-card stat-card clickable-card"
            onClick={() => goTo(ROUTES.cows)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.cows)}
            title="गाय / भैंस की जानकारी खोलें"
          >
            <div className="stat-icon blue">🐄</div>

            <div className="stat-content">
              <span>कुल गाय / भैंस</span>

              <strong>{getNumber(cows.total)}</strong>

              <small>दूध देने वाली: {getNumber(cows.milking)}</small>
            </div>

            <span className="card-arrow">→</span>
          </div>

          {/* CUSTOMERS */}

          <div
            className="dashboard-card stat-card clickable-card"
            onClick={() => goTo(ROUTES.customers)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.customers)}
            title="Customers खोलें"
          >
            <div className="stat-icon purple">👥</div>

            <div className="stat-content">
              <span>Active Customers</span>

              <strong>{getNumber(customers.active ?? customers.total)}</strong>

              <small>कुल सक्रिय ग्राहक</small>
            </div>

            <span className="card-arrow">→</span>
          </div>

          {/* MILK SALE */}

          <div
            className="dashboard-card stat-card clickable-card"
            onClick={() => goTo(ROUTES.saleMilk)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.saleMilk)}
            title="Milk Sale खोलें"
          >
            <div className="stat-icon green">🥛</div>

            <div className="stat-content">
              <span>आज दूध बिक्री</span>

              <strong>{liters(todayMilk)}</strong>

              <small>{money(todayMilkAmount)}</small>
            </div>

            <span className="card-arrow">→</span>
          </div>

          {/* EXPENSE */}

          <div
            className="dashboard-card stat-card clickable-card"
            onClick={() => goTo(ROUTES.expenses)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.expenses)}
            title="Expenses खोलें"
          >
            <div className="stat-icon orange">💸</div>

            <div className="stat-content">
              <span>आज का खर्च</span>

              <strong>{money(todayExpense)}</strong>

              <small>आज का कुल खर्च</small>
            </div>

            <span className="card-arrow">→</span>
          </div>
        </div>

        {/* =================================================
            TODAY OVERVIEW
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">TODAY</span>

              <h2>आज का पूरा हिसाब</h2>
            </div>

            <button type="button" onClick={() => goTo(ROUTES.saleMilk)}>
              दूध बिक्री देखें →
            </button>
          </div>

          <div className="dashboard-grid three">
            {/* MORNING */}

            <div
              className="dashboard-card overview-card clickable-card"
              onClick={() => goTo(ROUTES.milkLogs)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.milkLogs)}
            >
              <div className="overview-top">
                <span className="overview-icon">🌅</span>

                <span className="overview-title">Morning Milk</span>
              </div>

              <strong>{liters(todayMorningMilk)}</strong>

              <p>सुबह का कुल दूध</p>
            </div>

            {/* EVENING */}

            <div
              className="dashboard-card overview-card clickable-card"
              onClick={() => goTo(ROUTES.milkLogs)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.milkLogs)}
            >
              <div className="overview-top">
                <span className="overview-icon">🌙</span>

                <span className="overview-title">Evening Milk</span>
              </div>

              <strong>{liters(todayEveningMilk)}</strong>

              <p>शाम का कुल दूध</p>
            </div>

            {/* SALE */}

            <div
              className="dashboard-card overview-card clickable-card"
              onClick={() => goTo(ROUTES.saleMilk)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.saleMilk)}
            >
              <div className="overview-top">
                <span className="overview-icon">💰</span>

                <span className="overview-title">Milk Sale Amount</span>
              </div>

              <strong>{money(todayMilkAmount)}</strong>

              <p>आज दूध से बिक्री</p>
            </div>
          </div>
        </section>

        {/* =================================================
            MONTH SUMMARY
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">THIS MONTH</span>

              <h2>इस महीने का हिसाब</h2>
            </div>
          </div>

          <div className="dashboard-grid four">
            {/* MILK */}

            <div
              className="dashboard-card financial-card clickable-card"
              onClick={() => goTo(ROUTES.saleMilk)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.saleMilk)}
            >
              <span className="financial-icon">🥛</span>

              <span>Customer Milk</span>

              <strong>{liters(monthlyMilkTotal)}</strong>

              <small>ग्राहकों को दिया दूध</small>
            </div>

            {/* MILK AMOUNT */}

            <div
              className="dashboard-card financial-card clickable-card"
              onClick={() => goTo(ROUTES.reports)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.reports)}
            >
              <span className="financial-icon">🧾</span>

              <span>Milk Amount</span>

              <strong>{money(monthlyMilkAmount)}</strong>

              <small>दूध की कुल कीमत</small>
            </div>

            {/* PAYMENT */}

            <div
              className="dashboard-card financial-card clickable-card"
              onClick={() => goTo(ROUTES.customers)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.customers)}
            >
              <span className="financial-icon">💵</span>

              <span>Payment Received</span>

              <strong>{money(monthlyPayments)}</strong>

              <small>ग्राहकों से प्राप्त</small>
            </div>

            {/* EXPENSE */}

            <div
              className="dashboard-card financial-card clickable-card"
              onClick={() => goTo(ROUTES.expenses)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleCardKeyDown(e, ROUTES.expenses)}
            >
              <span className="financial-icon">💸</span>

              <span>Expenses</span>

              <strong>{money(monthlyExpenses)}</strong>

              <small>कुल खर्च</small>
            </div>
          </div>

          {/* NET */}

          <div
            className={`net-card ${
              monthlyNet >= 0 ? "positive" : "negative"
            } clickable-section`}
            onClick={() => goTo(ROUTES.reports)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.reports)}
          >
            <div>
              <span>NET AMOUNT</span>

              <h3>{money(monthlyNet)}</h3>

              <p>Payment Received − Total Expenses</p>
            </div>

            <div className="net-icon">{monthlyNet >= 0 ? "📈" : "📉"}</div>
          </div>
        </section>

        {/* =================================================
            MILK STATUS
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">MILK</span>

              <h2>दूध की स्थिति</h2>
            </div>
          </div>

          <div
            className="milk-status-card clickable-section"
            onClick={() => goTo(ROUTES.saleMilk)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, ROUTES.saleMilk)}
          >
            <div className="milk-status-main">
              <div className="large-milk-icon">🥛</div>

              <div>
                <span>आज उपलब्ध दूध</span>

                <strong>{liters(remainingToday)}</strong>

                <p>Production − Customer Sale</p>
              </div>
            </div>

            <div className="milk-progress-area">
              <div className="progress-label">
                <span>आज का दूध</span>

                <strong>{liters(todayMilk)}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      todayMilk > 0
                        ? `${Math.min((saleToday / todayMilk) * 100, 100)}%`
                        : "0%",
                  }}
                />
              </div>

              <div className="progress-bottom">
                <span>बिक्री: {liters(saleToday)}</span>

                <span>बाकी: {liters(remainingToday)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">RECENT ACTIVITY</span>

              <h2>हाल की गतिविधियां</h2>
            </div>
          </div>

          <div className="activity-grid">
            {/* MILK */}

            <div className="dashboard-card activity-card">
              <div className="activity-header">
                <div>
                  <span className="activity-icon milk">🥛</span>

                  <div>
                    <h3>Recent Milk</h3>

                    <p>हाल की दूध entries</p>
                  </div>
                </div>

                <button type="button" onClick={() => goTo(ROUTES.milkLogs)}>
                  View
                </button>
              </div>

              <div className="activity-list">
                {recentMilkLogs.length === 0 ? (
                  <div className="empty-activity">
                    🥛
                    <span>अभी कोई milk entry नहीं है</span>
                  </div>
                ) : (
                  recentMilkLogs.slice(0, 5).map((item, index) => {
                    const customer = item.customer || item.customerId || {};

                    return (
                      <div
                        className="activity-row clickable-row"
                        key={item._id || item.id || index}
                        onClick={() => goTo(ROUTES.milkLogs)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => handleCardKeyDown(e, ROUTES.milkLogs)}
                      >
                        <div>
                          <strong>
                            {customer.name ||
                              customer.customerName ||
                              item.cow?.name ||
                              item.cowName ||
                              "Milk Entry"}
                          </strong>

                          <small>
                            {item.date
                              ? new Date(item.date).toLocaleDateString("en-IN")
                              : "-"}
                          </small>
                        </div>

                        <strong>{liters(item.totalMilk)}</strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PAYMENTS */}

            <div className="dashboard-card activity-card">
              <div className="activity-header">
                <div>
                  <span className="activity-icon payment">💰</span>

                  <div>
                    <h3>Recent Payments</h3>

                    <p>हाल में जमा payment</p>
                  </div>
                </div>

                <button type="button" onClick={() => goTo(ROUTES.customers)}>
                  View
                </button>
              </div>

              <div className="activity-list">
                {recentPayments.length === 0 ? (
                  <div className="empty-activity">
                    💰
                    <span>अभी कोई payment नहीं है</span>
                  </div>
                ) : (
                  recentPayments.slice(0, 5).map((item, index) => {
                    const customer = item.customerId || item.customer || {};

                    return (
                      <div
                        className="activity-row clickable-row"
                        key={item._id || item.id || index}
                        onClick={() => goTo(ROUTES.customers)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          handleCardKeyDown(e, ROUTES.customers)
                        }
                      >
                        <div>
                          <strong>
                            {customer.name ||
                              customer.customerName ||
                              "Customer"}
                          </strong>

                          <small>
                            {item.paymentDate
                              ? new Date(item.paymentDate).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </small>
                        </div>

                        <strong className="amount-positive">
                          +{money(item.amount)}
                        </strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* EXPENSE */}

            <div className="dashboard-card activity-card">
              <div className="activity-header">
                <div>
                  <span className="activity-icon expense">💸</span>

                  <div>
                    <h3>Recent Expenses</h3>

                    <p>हाल के खर्च</p>
                  </div>
                </div>

                <button type="button" onClick={() => goTo(ROUTES.expenses)}>
                  View
                </button>
              </div>

              <div className="activity-list">
                {recentExpenses.length === 0 ? (
                  <div className="empty-activity">
                    💸
                    <span>अभी कोई expense नहीं है</span>
                  </div>
                ) : (
                  recentExpenses.slice(0, 5).map((item, index) => (
                    <div
                      className="activity-row clickable-row"
                      key={item._id || item.id || index}
                      onClick={() => goTo(ROUTES.expenses)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => handleCardKeyDown(e, ROUTES.expenses)}
                    >
                      <div>
                        <strong>
                          {item.description || item.category || "Expense"}
                        </strong>

                        <small>
                          {item.date
                            ? new Date(item.date).toLocaleDateString("en-IN")
                            : "-"}
                        </small>
                      </div>

                      <strong className="amount-negative">
                        -{money(item.amount)}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">QUICK ACTIONS</span>

              <h2>जल्दी से काम करें</h2>
            </div>
          </div>

          <div className="quick-actions">
            {/* CUSTOMER */}

            <button type="button" onClick={() => goTo(ROUTES.customers)}>
              <span>👥</span>

              <div>
                <strong>Customer</strong>

                <small>ग्राहक देखें</small>
              </div>

              <b>→</b>
            </button>

            {/* COW */}

            <button type="button" onClick={() => goTo(ROUTES.cows)}>
              <span>🐄</span>

              <div>
                <strong>Cow / Buffalo</strong>

                <small>गाय / भैंस देखें</small>
              </div>

              <b>→</b>
            </button>

            {/* MILK */}

            <button type="button" onClick={() => goTo(ROUTES.saleMilk)}>
              <span>🥛</span>

              <div>
                <strong>Milk Sale</strong>

                <small>दूध बिक्री देखें</small>
              </div>

              <b>→</b>
            </button>

            {/* EXPENSE */}

            <button type="button" onClick={() => goTo(ROUTES.expenses)}>
              <span>💸</span>

              <div>
                <strong>Expense</strong>

                <small>खर्च जोड़ें</small>
              </div>

              <b>→</b>
            </button>

            {/* REPORT */}

            <button type="button" onClick={() => goTo(ROUTES.reports)}>
              <span>📊</span>

              <div>
                <strong>Reports</strong>

                <small>पूरी रिपोर्ट</small>
              </div>

              <b>→</b>
            </button>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="dashboard-footer">
          <strong>DOODHLEKHA</strong>

          <span>Smart Dairy Management</span>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;

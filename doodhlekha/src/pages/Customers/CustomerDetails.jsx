// import React, { useCallback, useEffect, useMemo, useState } from "react";

// import { useNavigate, useParams } from "react-router-dom";

// import api from "../../services/api";

// import "./CustomerDetails.css";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const getTodayDate = () => {
//   const date = new Date();

//   const year = date.getFullYear();

//   const month = String(date.getMonth() + 1).padStart(2, "0");

//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getCurrentMonth = () => {
//   const date = new Date();

//   const year = date.getFullYear();

//   const month = String(date.getMonth() + 1).padStart(2, "0");

//   return `${year}-${month}`;
// };

// const formatMoney = (value) => {
//   return Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const formatNumber = (value) => {
//   return Number(value || 0).toLocaleString("en-IN", {
//     maximumFractionDigits: 2,
//   });
// };

// const formatDate = (value) => {
//   if (!value) {
//     return "-";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "-";
//   }

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const getPaymentMethodName = (method) => {
//   const methods = {
//     cash: "Cash",
//     upi: "UPI",
//     bank: "Bank",
//     cheque: "Cheque",
//   };

//   return methods[method] || method || "Cash";
// };

// const getPaymentIcon = (method) => {
//   const icons = {
//     cash: "💵",
//     upi: "📱",
//     bank: "🏦",
//     cheque: "🧾",
//   };

//   return icons[method] || "💳";
// };

// /* =========================================================
//    CUSTOMER DETAILS
// ========================================================= */

// const CustomerDetails = () => {
//   const navigate = useNavigate();

//   // Support both route styles:
//   // /customers/:customerId
//   // /customers/:id
//   // This prevents the details page from becoming blank when the router
//   // uses "id" instead of "customerId".
//   const routeParams = useParams();
//   const customerId =
//     routeParams.customerId ||
//     routeParams.id ||
//     routeParams.customerID ||
//     routeParams.customer_id;

//   /* =======================================================
//      STATE
//   ======================================================= */

//   const [customer, setCustomer] = useState(null);

//   const [summary, setSummary] = useState(null);

//   const [todayMilk, setTodayMilk] = useState(null);

//   const [milkLogs, setMilkLogs] = useState([]);

//   const [payments, setPayments] = useState([]);

//   const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

//   const [loading, setLoading] = useState(true);

//   const [refreshing, setRefreshing] = useState(false);

//   const [paymentLoading, setPaymentLoading] = useState(false);

//   const [deleteLoading, setDeleteLoading] = useState(null);

//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   const [showMilkDetails, setShowMilkDetails] = useState(true);

//   const [message, setMessage] = useState({
//     type: "",
//     text: "",
//   });

//   /* =======================================================
//      PAYMENT FORM
//   ======================================================= */

//   const [paymentForm, setPaymentForm] = useState({
//     amount: "",
//     paymentDate: getTodayDate(),
//     paymentMethod: "cash",
//     note: "",
//   });

//   /* =======================================================
//      LOAD CUSTOMER
//   ======================================================= */

//   const loadCustomer = useCallback(async () => {
//     if (!customerId) {
//       throw new Error(
//         "Customer ID नहीं मिला। URL में customer id उपलब्ध नहीं है।",
//       );
//     }

//     let foundCustomer = null;

//     // -------------------------------------------------------
//     // 1. First try the single-customer API.
//     // Backend route:
//     // GET /api/customers/:id
//     // -------------------------------------------------------
//     try {
//       const response = await api.get(`/customers/${customerId}`);

//       const payload = response?.data;

//       foundCustomer =
//         payload?.data || payload?.customer || payload?.result || null;

//       // Some APIs return the customer object directly.
//       if (
//         !foundCustomer &&
//         payload &&
//         (payload._id || payload.id || payload.customerCode)
//       ) {
//         foundCustomer = payload;
//       }
//     } catch (singleCustomerError) {
//       console.warn(
//         "Single customer API failed, trying customer list:",
//         singleCustomerError?.response?.status,
//       );
//     }

//     // -------------------------------------------------------
//     // 2. Fallback to customer list.
//     // IMPORTANT:
//     // Do NOT use status=active here. Otherwise an inactive customer
//     // can disappear from the details page.
//     // -------------------------------------------------------
//     if (!foundCustomer) {
//       const response = await api.get("/customers");

//       const payload = response?.data;

//       const customers = Array.isArray(payload?.data)
//         ? payload.data
//         : Array.isArray(payload?.customers)
//           ? payload.customers
//           : Array.isArray(payload?.result)
//             ? payload.result
//             : Array.isArray(payload)
//               ? payload
//               : [];

//       foundCustomer = customers.find(
//         (item) => String(item?._id || item?.id) === String(customerId),
//       );
//     }

//     if (!foundCustomer) {
//       throw new Error(
//         "Customer record नहीं मिला। कृपया Customers page से customer दोबारा खोलें।",
//       );
//     }

//     setCustomer(foundCustomer);

//     return foundCustomer;
//   }, [customerId]);

//   /* =======================================================
//      LOAD MONTHLY LEDGER

//      SINGLE SOURCE OF TRUTH

//      Backend:
//      /customer-milk/:customerId/monthly-summary
//   ======================================================= */

//   const loadLedger = useCallback(async () => {
//     if (!customerId) {
//       return;
//     }

//     // -------------------------------------------------------
//     // IMPORTANT FIX:
//     // Monthly summary और payment history दो अलग APIs हैं।
//     // Summary में totalPaid कभी-कभी 0 आता है, जबकि actual
//     // payment /customer-payments endpoint में मौजूद होता है।
//     // इसलिए Paid/Pending के लिए payment history को source of truth
//     // बनाया गया है।
//     // -------------------------------------------------------
//     const [summaryResult, paymentResult] = await Promise.allSettled([
//       api.get(`/customer-milk/${customerId}/monthly-summary`, {
//         params: { month: selectedMonth },
//       }),
//       api.get(`/customer-payments/${customerId}`, {
//         params: { month: selectedMonth },
//       }),
//     ]);

//     // -------------------------------------------------------
//     // MONTHLY MILK SUMMARY
//     // -------------------------------------------------------
//     if (summaryResult.status === "fulfilled") {
//       const responseData = summaryResult.value?.data;
//       const data =
//         responseData?.data || responseData?.summary || responseData || {};

//       setSummary(data);

//       setMilkLogs(
//         Array.isArray(data?.logs)
//           ? data.logs
//           : Array.isArray(data?.milkLogs)
//             ? data.milkLogs
//             : Array.isArray(data?.records)
//               ? data.records
//               : [],
//       );
//     } else {
//       console.error("Customer Monthly Summary Error:", summaryResult.reason);

//       setSummary(null);
//       setMilkLogs([]);
//     }

//     // -------------------------------------------------------
//     // PAYMENT HISTORY
//     // -------------------------------------------------------
//     if (paymentResult.status === "fulfilled") {
//       const paymentData = paymentResult.value?.data || {};
//       const paymentList = Array.isArray(paymentData?.data)
//         ? paymentData.data
//         : [];

//       setPayments(paymentList);
//     } else {
//       console.error("Customer Payment History Error:", paymentResult.reason);

//       // Old backend summary में payments हों तो fallback रखो।
//       const fallbackSummary =
//         summaryResult.status === "fulfilled"
//           ? summaryResult.value?.data?.data || {}
//           : {};

//       setPayments(
//         Array.isArray(fallbackSummary?.payments)
//           ? fallbackSummary.payments
//           : [],
//       );
//     }

//     // अगर दोनों APIs fail हुई हैं तो caller को error मिलेगा।
//     if (
//       summaryResult.status === "rejected" &&
//       paymentResult.status === "rejected"
//     ) {
//       throw summaryResult.reason || paymentResult.reason;
//     }
//   }, [customerId, selectedMonth]);

//   /* =======================================================
//      LOAD TODAY MILK
//   ======================================================= */

//   const loadTodayMilk = useCallback(async () => {
//     if (!customerId) {
//       throw new Error("Customer ID नहीं मिला");
//     }

//     const response = await api.get(`/customer-milk/${customerId}/today`);

//     const payload = response?.data;
//     setTodayMilk(
//       payload?.data ||
//         payload?.todayMilk ||
//         payload?.result ||
//         (payload?.morningMilk !== undefined ||
//         payload?.eveningMilk !== undefined
//           ? payload
//           : null),
//     );
//   }, [customerId]);

//   /* =======================================================
//      LOAD ALL DATA

//      Customer
//      Ledger
//      Today Milk

//      अलग-अलग duplicate calculation नहीं।
//   ======================================================= */

//   const loadPageData = useCallback(
//     async (showFullLoader = true) => {
//       if (!customerId) {
//         setLoading(false);
//         setMessage({
//           type: "error",
//           text: "Customer ID नहीं मिला।",
//         });
//         return;
//       }

//       if (showFullLoader) {
//         setLoading(true);
//       } else {
//         setRefreshing(true);
//       }

//       setMessage({
//         type: "",
//         text: "",
//       });

//       try {
//         // Customer details
//         try {
//           await loadCustomer();
//         } catch (error) {
//           console.error("Customer Details API Error:", error);
//           setCustomer(null);
//           setMessage({
//             type: "error",
//             text:
//               error?.response?.data?.message ||
//               error?.message ||
//               "Customer details load नहीं हो सके।",
//           });
//         }

//         // Monthly milk ledger + payment ledger
//         try {
//           await loadLedger();
//         } catch (error) {
//           console.error("Customer Ledger API Error:", error);
//           setSummary(null);
//           setMilkLogs([]);
//           setPayments([]);
//           setMessage({
//             type: "error",
//             text:
//               error?.response?.data?.message ||
//               "Monthly हिसाब load नहीं हो सका।",
//           });
//         }

//         // Today's milk is independent from the monthly ledger.
//         try {
//           await loadTodayMilk();
//         } catch (error) {
//           console.error("Today Milk API Error:", error);
//           setTodayMilk(null);
//         }
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [customerId, loadCustomer, loadLedger, loadTodayMilk],
//   );

//   /* =======================================================
//      INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {
//     loadPageData(true);
//   }, [loadPageData]);

//   /* =======================================================
//      SUMMARY

//      Backend ledger से directly।
//   ======================================================= */

//   const summaryData =
//     summary?.summary || summary?.data?.summary || summary || {};

//   const totalMilk = Number(summaryData.totalMilk || 0);

//   const morningMilk = Number(summaryData.totalMorningMilk || 0);

//   const eveningMilk = Number(summaryData.totalEveningMilk || 0);

//   const totalAmount = Number(summaryData.totalAmount || 0);

//   // -------------------------------------------------------
//   // PAYMENT TOTALS — ALWAYS CALCULATE FROM ACTUAL PAYMENTS
//   // -------------------------------------------------------
//   //
//   // Backend monthly-summary में totalPaid/pendingAmount पुराने
//   // calculation के कारण 0 आ सकते हैं। Payment history API actual
//   // saved payments देता है, इसलिए card की calculation यहीं से होगी।
//   //
//   const totalPaid = useMemo(() => {
//     return payments.reduce((sum, payment) => {
//       if (String(payment?.status || "completed") !== "completed") {
//         return sum;
//       }

//       return sum + Number(payment?.amount || 0);
//     }, 0);
//   }, [payments]);

//   const calculatedBalance = Number((totalAmount - totalPaid).toFixed(2));

//   const pendingAmount = Math.max(calculatedBalance, 0);

//   const advanceAmount = Math.max(-calculatedBalance, 0);

//   const averageRate = Number(summaryData.averageRate || 0);

//   const paymentStatus =
//     totalAmount <= 0
//       ? "no_bill"
//       : totalPaid >= totalAmount
//         ? "paid"
//         : totalPaid > 0
//           ? "partial"
//           : "pending";

//   /* =======================================================
//      TODAY MILK

//      Backend से direct।
//   ======================================================= */

//   const todayMorning = Number(todayMilk?.morningMilk || 0);

//   const todayEvening = Number(todayMilk?.eveningMilk || 0);

//   const todayTotal = Number(
//     todayMilk?.totalMilk ?? todayMorning + todayEvening,
//   );

//   const todayAmount = Number(todayMilk?.amount || 0);

//   /* =======================================================
//      CUSTOMER NAME
//   ======================================================= */

//   const customerName = customer?.name || "Customer";

//   const customerCode = customer?.customerCode || "No Code";

//   const customerPhone = customer?.phone || "Mobile नहीं है";

//   /* =======================================================
//      MILK TYPE
//   ======================================================= */

//   const milkType = customer?.milkType || "cow";

//   const milkTypeInfo = useMemo(() => {
//     if (milkType === "buffalo") {
//       return {
//         icon: "🐃",
//         name: "भैंस का दूध",
//       };
//     }

//     if (milkType === "mixed") {
//       return {
//         icon: "🥛",
//         name: "मिक्स दूध",
//       };
//     }

//     return {
//       icon: "🐄",
//       name: "गाय का दूध",
//     };
//   }, [milkType]);

//   /* =======================================================
//      MONTH NAME
//   ======================================================= */

//   const monthName = useMemo(() => {
//     if (!selectedMonth) {
//       return "";
//     }

//     const date = new Date(`${selectedMonth}-01T00:00:00`);

//     return date.toLocaleDateString("en-IN", {
//       month: "long",
//       year: "numeric",
//     });
//   }, [selectedMonth]);

//   /* =======================================================
//      PAYMENT STATUS UI
//   ======================================================= */

//   const paymentStatusInfo = useMemo(() => {
//     if (paymentStatus === "paid") {
//       return {
//         label: "Paid",
//         icon: "✓",
//         className: "status-paid",
//       };
//     }

//     if (paymentStatus === "partial") {
//       return {
//         label: "Partial",
//         icon: "◐",
//         className: "status-partial",
//       };
//     }

//     if (paymentStatus === "no_bill") {
//       return {
//         label: "No Bill",
//         icon: "—",
//         className: "status-none",
//       };
//     }

//     return {
//       label: "Pending",
//       icon: "!",
//       className: "status-pending",
//     };
//   }, [paymentStatus]);

//   /* =======================================================
//      OPEN PAYMENT MODAL
//   ======================================================= */

//   const openPaymentModal = () => {
//     setMessage({
//       type: "",
//       text: "",
//     });

//     setPaymentForm({
//       amount: pendingAmount > 0 ? String(pendingAmount) : "",
//       paymentDate: getTodayDate(),
//       paymentMethod: "cash",
//       note: "",
//     });

//     setShowPaymentModal(true);
//   };

//   /* =======================================================
//      CLOSE PAYMENT MODAL
//   ======================================================= */

//   const closePaymentModal = () => {
//     if (paymentLoading) {
//       return;
//     }

//     setShowPaymentModal(false);

//     setMessage({
//       type: "",
//       text: "",
//     });
//   };

//   /* =======================================================
//      PAYMENT INPUT
//   ======================================================= */

//   const handlePaymentChange = (event) => {
//     const { name, value } = event.target;

//     setPaymentForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   /* =======================================================
//      ADD PAYMENT

//      POST:
//      /api/customer-payments/:customerId
//   ======================================================= */

//   const handleSubmitPayment = async (event) => {
//     event.preventDefault();

//     setMessage({
//       type: "",
//       text: "",
//     });

//     const amount = Number(paymentForm.amount);

//     /* -----------------------------------------------
//          AMOUNT
//       ------------------------------------------------ */

//     if (!Number.isFinite(amount) || amount <= 0) {
//       setMessage({
//         type: "error",
//         text: "कृपया सही payment amount डालें।",
//       });

//       return;
//     }

//     /* -----------------------------------------------
//          PAYMENT DATE
//       ------------------------------------------------ */

//     if (!paymentForm.paymentDate) {
//       setMessage({
//         type: "error",
//         text: "कृपया payment date चुनें।",
//       });

//       return;
//     }

//     /* -----------------------------------------------
//          PAYMENT METHOD
//       ------------------------------------------------ */

//     const allowedMethods = ["cash", "upi", "bank", "cheque"];

//     if (!allowedMethods.includes(paymentForm.paymentMethod)) {
//       setMessage({
//         type: "error",
//         text: "कृपया सही payment method चुनें।",
//       });

//       return;
//     }

//     /* -----------------------------------------------
//          PENDING VALIDATION

//          Advance payment भी allow है।

//          इसलिए pending से ज्यादा payment
//          backend को भेज सकते हैं।
//       ------------------------------------------------ */

//     try {
//       setPaymentLoading(true);

//       await api.post(`/customer-payments/${customerId}`, {
//         amount,
//         paymentDate: paymentForm.paymentDate,

//         paymentMethod: paymentForm.paymentMethod,

//         note: paymentForm.note.trim(),
//       });

//       setShowPaymentModal(false);

//       setPaymentForm({
//         amount: "",
//         paymentDate: getTodayDate(),
//         paymentMethod: "cash",
//         note: "",
//       });

//       setMessage({
//         type: "success",
//         text: "Payment सफलतापूर्वक दर्ज हो गया।",
//       });

//       /* ---------------------------------------------
//            IMPORTANT

//            Payment के बाद पूरा ledger फिर से load।

//            इससे:
//            Paid
//            Pending
//            Advance
//            Status

//            सब backend से fresh आएगा।
//         --------------------------------------------- */

//       await loadPageData(false);
//     } catch (error) {
//       console.error("Add Payment Error:", error);

//       setMessage({
//         type: "error",
//         text: error?.response?.data?.message || "Payment save नहीं हो सका।",
//       });
//     } finally {
//       setPaymentLoading(false);
//     }
//   };

//   /* =======================================================
//      CANCEL PAYMENT
//   ======================================================= */

//   const handleCancelPayment = async (paymentId) => {
//     if (!paymentId) {
//       return;
//     }

//     const confirmed = window.confirm(
//       "क्या आप इस payment को cancel करना चाहते हैं?",
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setDeleteLoading(paymentId);

//       await api.delete(`/customer-payments/payment/${paymentId}`);

//       setMessage({
//         type: "success",
//         text: "Payment cancel हो गया।",
//       });

//       await loadPageData(false);
//     } catch (error) {
//       console.error("Cancel Payment Error:", error);

//       setMessage({
//         type: "error",
//         text: error?.response?.data?.message || "Payment cancel नहीं हो सका।",
//       });
//     } finally {
//       setDeleteLoading(null);
//     }
//   };

//   /* =======================================================
//      BACK
//   ======================================================= */

//   const handleBack = () => {
//     navigate("/customers");
//   };

//   /* =======================================================
//      ADD MILK

//      CustomerMilkModal existing component
//      को use किया जा सकता है।

//      फिलहाल customer page पर वापस भेजने के बजाय
//      existing modal route/event architecture
//      के लिए event नहीं बनाया गया।
//   ======================================================= */

//   const handleAddMilk = () => {
//     navigate(`/customers/${customerId}?addMilk=true`);
//   };

//   /* =======================================================
//      DELETE MILK

//      Direct delete नहीं करेंगे बिना confirmation।
//   ======================================================= */

//   const handleDeleteMilk = async (milkId) => {
//     if (!milkId) {
//       return;
//     }

//     const confirmed = window.confirm(
//       "क्या आप यह milk record delete करना चाहते हैं?",
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setRefreshing(true);

//       await api.delete(`/customer-milk/log/${milkId}`);

//       setMessage({
//         type: "success",
//         text: "Milk record delete हो गया।",
//       });

//       await loadPageData(false);
//     } catch (error) {
//       console.error("Delete Milk Error:", error);

//       setMessage({
//         type: "error",
//         text:
//           error?.response?.data?.message || "Milk record delete नहीं हो पाया।",
//       });
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   /* =======================================================
//      LOADING
//   ======================================================= */

//   if (loading) {
//     return (
//       <div className="customer-details-page">
//         <div className="customer-details-loading">
//           <div className="customer-loading-spinner" />

//           <h3>Customer details load हो रही हैं...</h3>

//           <p>कृपया थोड़ा इंतजार करें</p>
//         </div>
//       </div>
//     );
//   }

//   /* =======================================================
//      CUSTOMER NOT FOUND
//   ======================================================= */

//   if (!customer) {
//     return (
//       <div className="customer-details-page">
//         <div className="customer-empty-state">
//           <div className="customer-empty-icon">👤</div>

//           <h2>Customer नहीं मिला</h2>

//           <p>Customer record उपलब्ध नहीं है।</p>

//           <button
//             type="button"
//             className="customer-primary-btn"
//             onClick={handleBack}
//           >
//             ← Customers पर वापस जाएँ
//           </button>
//         </div>
//       </div>
//     );
//   }

//   /* =======================================================
//      RENDER
//   ======================================================= */

//   return (
//     <div className="customer-details-page">
//       {/* ===================================================
//           TOP BAR
//       =================================================== */}

//       <div className="customer-details-topbar">
//         <button
//           type="button"
//           className="customer-back-btn"
//           onClick={handleBack}
//         >
//           <span>←</span>

//           <span>Customers</span>
//         </button>

//         <div className="customer-topbar-actions">
//           <button
//             type="button"
//             className="customer-refresh-btn"
//             onClick={() => loadPageData(false)}
//             disabled={refreshing}
//           >
//             <span className={refreshing ? "refresh-spin" : ""}>↻</span>
//             Refresh
//           </button>

//           <button
//             type="button"
//             className="customer-payment-top-btn"
//             onClick={openPaymentModal}
//           >
//             + Payment
//           </button>
//         </div>
//       </div>

//       {/* ===================================================
//           ALERT MESSAGE
//       =================================================== */}

//       {message.text && (
//         <div className={`customer-page-message ${message.type}`}>
//           <span>{message.type === "success" ? "✓" : "!"}</span>

//           <p>{message.text}</p>

//           <button
//             type="button"
//             onClick={() =>
//               setMessage({
//                 type: "",
//                 text: "",
//               })
//             }
//           >
//             ×
//           </button>
//         </div>
//       )}

//       {/* ===================================================
//           CUSTOMER HERO
//       =================================================== */}

//       <section className="customer-profile-hero">
//         <div className="customer-profile-main">
//           <div className="customer-profile-avatar">
//             {customerName.charAt(0).toUpperCase()}
//           </div>

//           <div className="customer-profile-info">
//             <div className="customer-profile-title-row">
//               <h1>{customerName}</h1>

//               <span
//                 className={
//                   customer.status === "active"
//                     ? "customer-active-badge"
//                     : "customer-inactive-badge"
//                 }
//               >
//                 {customer.status === "active" ? "● Active" : "● Inactive"}
//               </span>
//             </div>

//             <div className="customer-profile-meta">
//               <span>
//                 ID: <strong>{customerCode}</strong>
//               </span>

//               <span>📞 {customerPhone}</span>

//               <span>
//                 {milkTypeInfo.icon} {milkTypeInfo.name}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="customer-profile-actions">
//           <button
//             type="button"
//             className="customer-outline-btn"
//             onClick={handleAddMilk}
//           >
//             🥛 Add Milk
//           </button>

//           <button
//             type="button"
//             className="customer-primary-btn"
//             onClick={openPaymentModal}
//           >
//             💳 Add Payment
//           </button>
//         </div>
//       </section>

//       {/* ===================================================
//           MONTH SELECTOR
//       =================================================== */}

//       <section className="customer-month-toolbar">
//         <div>
//           <span className="customer-section-kicker">ACCOUNT LEDGER</span>

//           <h2>{monthName}</h2>
//         </div>

//         <div className="customer-month-selector">
//           <button
//             type="button"
//             onClick={() => {
//               const date = new Date(`${selectedMonth}-01T00:00:00`);

//               date.setMonth(date.getMonth() - 1);

//               const year = date.getFullYear();

//               const month = String(date.getMonth() + 1).padStart(2, "0");

//               setSelectedMonth(`${year}-${month}`);
//             }}
//           >
//             ‹
//           </button>

//           <input
//             type="month"
//             value={selectedMonth}
//             onChange={(event) => setSelectedMonth(event.target.value)}
//           />

//           <button
//             type="button"
//             onClick={() => {
//               const date = new Date(`${selectedMonth}-01T00:00:00`);

//               date.setMonth(date.getMonth() + 1);

//               const year = date.getFullYear();

//               const month = String(date.getMonth() + 1).padStart(2, "0");

//               setSelectedMonth(`${year}-${month}`);
//             }}
//           >
//             ›
//           </button>
//         </div>
//       </section>

//       {/* ===================================================
//           TODAY MILK
//       =================================================== */}

//       <section className="customer-today-card">
//         <div className="customer-today-card-head">
//           <div>
//             <span className="customer-section-kicker">TODAY</span>

//             <h2>🥛 आज का दूध</h2>
//           </div>

//           {todayMilk && (
//             <div className="customer-today-amount">
//               ₹{formatMoney(todayAmount)}
//             </div>
//           )}
//         </div>

//         {todayMilk ? (
//           <div className="customer-today-grid">
//             <div className="customer-today-item morning">
//               <span>🌅</span>

//               <div>
//                 <strong>{formatNumber(todayMorning)} L</strong>

//                 <small>Morning</small>
//               </div>
//             </div>

//             <div className="customer-today-item evening">
//               <span>🌙</span>

//               <div>
//                 <strong>{formatNumber(todayEvening)} L</strong>

//                 <small>Evening</small>
//               </div>
//             </div>

//             <div className="customer-today-item total">
//               <span>🥛</span>

//               <div>
//                 <strong>{formatNumber(todayTotal)} L</strong>

//                 <small>Total Milk</small>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="customer-no-today-milk">
//             <span>🥛</span>

//             <div>
//               <strong>आज की milk entry नहीं है</strong>

//               <small>आज का दूध दर्ज करने के लिए "Add Milk" दबाएँ।</small>
//             </div>

//             <button type="button" onClick={handleAddMilk}>
//               + Add Milk
//             </button>
//           </div>
//         )}
//       </section>

//       {/* ===================================================
//           SUMMARY CARDS
//       =================================================== */}

//       <section className="customer-summary-grid">
//         <div className="customer-summary-card milk-card">
//           <div className="customer-summary-icon">🥛</div>

//           <div>
//             <span>Total Milk</span>

//             <strong>{formatNumber(totalMilk)} L</strong>

//             <small>
//               {formatNumber(morningMilk)} L Morning •{" "}
//               {formatNumber(eveningMilk)} L Evening
//             </small>
//           </div>
//         </div>

//         <div className="customer-summary-card bill-card">
//           <div className="customer-summary-icon">₹</div>

//           <div>
//             <span>Total Bill</span>

//             <strong>₹{formatMoney(totalAmount)}</strong>

//             <small>Avg ₹{formatMoney(averageRate)}/ L</small>
//           </div>
//         </div>

//         <div className="customer-summary-card paid-card">
//           <div className="customer-summary-icon">✓</div>

//           <div>
//             <span>Total Paid</span>

//             <strong>₹{formatMoney(totalPaid)}</strong>

//             <small>
//               {payments.length} payment
//               {payments.length === 1 ? "" : "s"}
//             </small>
//           </div>
//         </div>

//         <div className="customer-summary-card pending-card">
//           <div className="customer-summary-icon">!</div>

//           <div>
//             <span>Pending</span>

//             <strong>₹{formatMoney(pendingAmount)}</strong>

//             <small className={paymentStatusInfo.className}>
//               {paymentStatusInfo.icon} {paymentStatusInfo.label}
//             </small>
//           </div>
//         </div>
//       </section>

//       {/* ===================================================
//           ADVANCE
//       =================================================== */}

//       {advanceAmount > 0 && (
//         <div className="customer-advance-banner">
//           <div className="customer-advance-icon">💰</div>

//           <div>
//             <strong>Advance / Credit</strong>

//             <span>
//               Customer ने bill से ₹{formatMoney(advanceAmount)} ज्यादा payment
//               किया है।
//             </span>
//           </div>

//           <strong>₹{formatMoney(advanceAmount)}</strong>
//         </div>
//       )}

//       {/* ===================================================
//           MILK HISTORY
//       =================================================== */}

//       <section className="customer-data-section">
//         <div className="customer-data-section-head">
//           <div>
//             <span className="customer-section-kicker">MILK RECORDS</span>

//             <h2>दूध का हिसाब</h2>
//           </div>

//           <button
//             type="button"
//             className="customer-collapse-btn"
//             onClick={() => setShowMilkDetails((value) => !value)}
//           >
//             {showMilkDetails ? "Hide" : "Show"}
//           </button>
//         </div>

//         {showMilkDetails && (
//           <>
//             {milkLogs.length === 0 ? (
//               <div className="customer-empty-table">
//                 <span>🥛</span>

//                 <strong>इस महीने कोई milk record नहीं है।</strong>

//                 <button type="button" onClick={handleAddMilk}>
//                   + Add Milk
//                 </button>
//               </div>
//             ) : (
//               <div className="customer-table-wrap">
//                 <table className="customer-data-table">
//                   <thead>
//                     <tr>
//                       <th>Date</th>

//                       <th>Morning</th>

//                       <th>Evening</th>

//                       <th>Total</th>

//                       <th>Rate</th>

//                       <th>Amount</th>

//                       <th>Action</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {milkLogs.map((log) => (
//                       <tr key={log._id}>
//                         <td>
//                           <strong>{formatDate(log.date)}</strong>
//                         </td>

//                         <td>
//                           <span className="milk-value morning-value">
//                             {formatNumber(log.morningMilk)} L
//                           </span>
//                         </td>

//                         <td>
//                           <span className="milk-value evening-value">
//                             {formatNumber(log.eveningMilk)} L
//                           </span>
//                         </td>

//                         <td>
//                           <strong>{formatNumber(log.totalMilk)} L</strong>
//                         </td>

//                         <td>₹{formatMoney(log.rate)}</td>

//                         <td>
//                           <strong>₹{formatMoney(log.amount)}</strong>
//                         </td>

//                         <td>
//                           <button
//                             type="button"
//                             className="table-delete-btn"
//                             onClick={() => handleDeleteMilk(log._id)}
//                             disabled={refreshing}
//                           >
//                             {refreshing ? "..." : "Delete"}
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* ===================================================
//           PAYMENT HISTORY
//       =================================================== */}

//       <section className="customer-data-section">
//         <div className="customer-data-section-head">
//           <div>
//             <span className="customer-section-kicker">PAYMENT LEDGER</span>

//             <h2>Payment History</h2>
//           </div>

//           <button
//             type="button"
//             className="customer-primary-btn small"
//             onClick={openPaymentModal}
//           >
//             + Payment
//           </button>
//         </div>

//         {payments.length === 0 ? (
//           <div className="customer-empty-table">
//             <span>💳</span>

//             <strong>इस महीने कोई payment नहीं है।</strong>

//             <button type="button" onClick={openPaymentModal}>
//               + Add Payment
//             </button>
//           </div>
//         ) : (
//           <div className="customer-payment-list">
//             {payments.map((payment) => (
//               <div className="customer-payment-row" key={payment._id}>
//                 <div className="customer-payment-method-icon">
//                   {getPaymentIcon(payment.paymentMethod)}
//                 </div>

//                 <div className="customer-payment-info">
//                   <strong>{getPaymentMethodName(payment.paymentMethod)}</strong>

//                   <span>{formatDate(payment.paymentDate)}</span>

//                   {payment.note && <small>{payment.note}</small>}
//                 </div>

//                 <div className="customer-payment-amount">
//                   <strong>₹{formatMoney(payment.amount)}</strong>

//                   <span>Completed</span>
//                 </div>

//                 <button
//                   type="button"
//                   className="customer-payment-cancel"
//                   onClick={() => handleCancelPayment(payment._id)}
//                   disabled={deleteLoading === payment._id}
//                 >
//                   {deleteLoading === payment._id ? "..." : "Cancel"}
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* ===================================================
//           PAYMENT MODAL
//       =================================================== */}

//       {showPaymentModal && (
//         <div
//           className="customer-modal-overlay"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget) {
//               closePaymentModal();
//             }
//           }}
//         >
//           <div className="customer-payment-modal">
//             {/* HEADER */}

//             <div className="customer-modal-head">
//               <div>
//                 <span className="customer-modal-icon">💳</span>

//                 <div>
//                   <h2>Payment Add करें</h2>

//                   <p>{customerName}</p>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={closePaymentModal}
//                 disabled={paymentLoading}
//               >
//                 ×
//               </button>
//             </div>

//             {/* CURRENT BALANCE */}

//             <div className="customer-payment-balance">
//               <div>
//                 <span>Monthly Bill</span>

//                 <strong>₹{formatMoney(totalAmount)}</strong>
//               </div>

//               <div>
//                 <span>Paid</span>

//                 <strong>₹{formatMoney(totalPaid)}</strong>
//               </div>

//               <div>
//                 <span>Pending</span>

//                 <strong className="pending-text">
//                   ₹{formatMoney(pendingAmount)}
//                 </strong>
//               </div>
//             </div>

//             {/* FORM */}

//             <form
//               onSubmit={handleSubmitPayment}
//               className="customer-payment-form"
//             >
//               {/* AMOUNT */}

//               <div className="customer-form-group">
//                 <label>
//                   Payment Amount
//                   <span>भुगतान राशि</span>
//                 </label>

//                 <div className="customer-money-input">
//                   <span>₹</span>

//                   <input
//                     type="number"
//                     name="amount"
//                     min="0.01"
//                     step="0.01"
//                     value={paymentForm.amount}
//                     onChange={handlePaymentChange}
//                     placeholder="0.00"
//                     autoFocus
//                     required
//                   />
//                 </div>

//                 {pendingAmount > 0 && (
//                   <button
//                     type="button"
//                     className="customer-fill-pending"
//                     onClick={() =>
//                       setPaymentForm((previous) => ({
//                         ...previous,
//                         amount: String(pendingAmount),
//                       }))
//                     }
//                   >
//                     Pending ₹{formatMoney(pendingAmount)} भरें
//                   </button>
//                 )}
//               </div>

//               {/* DATE */}

//               <div className="customer-form-row">
//                 <div className="customer-form-group">
//                   <label>
//                     Payment Date
//                     <span>भुगतान तारीख</span>
//                   </label>

//                   <input
//                     type="date"
//                     name="paymentDate"
//                     value={paymentForm.paymentDate}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 {/* METHOD */}

//                 <div className="customer-form-group">
//                   <label>
//                     Payment Method
//                     <span>भुगतान तरीका</span>
//                   </label>

//                   <select
//                     name="paymentMethod"
//                     value={paymentForm.paymentMethod}
//                     onChange={handlePaymentChange}
//                   >
//                     <option value="cash">💵 Cash</option>

//                     <option value="upi">📱 UPI</option>

//                     <option value="bank">🏦 Bank</option>

//                     <option value="cheque">🧾 Cheque</option>
//                   </select>
//                 </div>
//               </div>

//               {/* NOTE */}

//               <div className="customer-form-group">
//                 <label>
//                   Note
//                   <span>टिप्पणी</span>
//                 </label>

//                 <textarea
//                   name="note"
//                   rows="3"
//                   value={paymentForm.note}
//                   onChange={handlePaymentChange}
//                   placeholder="Payment से संबंधित कोई जानकारी..."
//                 />
//               </div>

//               {/* ERROR */}

//               {message.type === "error" && (
//                 <div className="customer-form-error">
//                   !<span>{message.text}</span>
//                 </div>
//               )}

//               {/* ACTIONS */}

//               <div className="customer-modal-actions">
//                 <button
//                   type="button"
//                   className="customer-cancel-btn"
//                   onClick={closePaymentModal}
//                   disabled={paymentLoading}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="customer-primary-btn"
//                   disabled={paymentLoading}
//                 >
//                   {paymentLoading ? (
//                     <>
//                       <span className="button-spinner" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>✓ Payment Save करें</>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomerDetails;

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

    /*
      अगर previous page से customer आया है
      तो पहले उसे use करेंगे।
    */

    if (
      location.state?.customer &&
      String(location.state.customer?._id) === String(currentCustomerId)
    ) {
      setCustomer(location.state.customer);

      return location.state.customer;
    }

    /*
      Customer list से current customer खोजें।
    */

    const response = await api.get("/customers", {
      params: {
        status: "active",
      },
    });

    const responseData = response?.data || {};

    let customers = [];

    if (Array.isArray(responseData?.data)) {
      customers = responseData.data;
    } else if (Array.isArray(responseData?.customers)) {
      customers = responseData.customers;
    } else if (Array.isArray(responseData?.data?.customers)) {
      customers = responseData.data.customers;
    }

    const foundCustomer = customers.find(
      (item) => String(item?._id) === String(currentCustomerId),
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

        setPayments(Array.isArray(loadedPayments) ? loadedPayments : []);
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

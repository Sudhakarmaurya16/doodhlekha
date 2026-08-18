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
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./CustomerDetails.css";

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v) =>
  n(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const qty = (v) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dateText = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const unwrapList = (payload, keys = []) => {
  for (const key of keys)
    if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const CustomerDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const customerId =
    params.customerId || params.id || params.customerID || params.customer_id;

  const [customer, setCustomer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [todayMilk, setTodayMilk] = useState(null);
  const [milkLogs, setMilkLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMilkDetails, setShowMilkDetails] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadCustomer = useCallback(async () => {
    let found = null;
    try {
      const r = await api.get(`/customers/${customerId}`);
      const p = r?.data;
      found =
        p?.data || p?.customer || p?.result || (p?._id || p?.id ? p : null);
    } catch (_) {}
    if (!found) {
      const r = await api.get("/customers");
      const list = unwrapList(r?.data, ["customers", "result"]);
      found = list.find((x) => String(x?._id || x?.id) === String(customerId));
    }
    if (!found) throw new Error("Customer record नहीं मिला।");
    setCustomer(found);
    return found;
  }, [customerId]);

  const loadLedger = useCallback(async () => {
    const [summaryResult, paymentResult, milkResult] = await Promise.allSettled(
      [
        api.get(`/customer-milk/${customerId}/monthly-summary`, {
          params: { month: selectedMonth },
        }),
        api.get(`/customer-payments/${customerId}`, {
          params: { month: selectedMonth },
        }),
        api.get(`/customer-milk/${customerId}`, {
          params: { month: selectedMonth },
        }),
      ],
    );

    if (summaryResult.status === "fulfilled") {
      const p = summaryResult.value?.data || {};
      const s = p?.data?.summary || p?.summary || p?.data || p || {};
      setSummary(s);
      if (!milkResult || milkResult.status !== "fulfilled") {
        setMilkLogs(s?.logs || s?.milkLogs || s?.records || []);
      }
    }

    if (milkResult.status === "fulfilled") {
      const p = milkResult.value?.data || {};
      setMilkLogs(unwrapList(p, ["logs", "milkLogs", "records"]));
    }

    if (paymentResult.status === "fulfilled") {
      const p = paymentResult.value?.data || {};
      setPayments(unwrapList(p, ["payments"]));
    } else {
      setPayments([]);
    }
  }, [customerId, selectedMonth]);

  const loadToday = useCallback(async () => {
    try {
      const r = await api.get(`/customer-milk/${customerId}/today`);
      const p = r?.data || {};
      setTodayMilk(p?.data || p?.todayMilk || p?.result || p || null);
    } catch (_) {
      setTodayMilk(null);
    }
  }, [customerId]);

  const loadPageData = useCallback(
    async (full = true) => {
      if (!customerId) return;
      try {
        if (full) setLoading(true);
        else setRefreshing(true);
        await Promise.all([loadCustomer(), loadLedger(), loadToday()]);
      } catch (e) {
        setMessage({
          type: "error",
          text:
            e?.response?.data?.message ||
            e?.message ||
            "Data load नहीं हो पाया।",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId, loadCustomer, loadLedger, loadToday],
  );

  useEffect(() => {
    loadPageData(true);
  }, [loadPageData]);

  const totalMilk =
    n(summary?.totalMilk) ||
    milkLogs.reduce(
      (s, x) => s + n(x?.totalMilk ?? n(x?.morningMilk) + n(x?.eveningMilk)),
      0,
    );
  const morningMilk =
    n(summary?.totalMorningMilk) ||
    milkLogs.reduce((s, x) => s + n(x?.morningMilk), 0);
  const eveningMilk =
    n(summary?.totalEveningMilk) ||
    milkLogs.reduce((s, x) => s + n(x?.eveningMilk), 0);
  const totalAmount = n(summary?.totalAmount ?? summary?.summary?.totalAmount);
  const totalPaid = payments.reduce(
    (s, p) =>
      String(p?.status || "completed") === "completed" ? s + n(p?.amount) : s,
    0,
  );
  const balance = Number((totalAmount - totalPaid).toFixed(2));
  const pendingAmount = Math.max(balance, 0);
  const advanceAmount = Math.max(-balance, 0);
  const paymentStatus =
    pendingAmount > 0
      ? "pending"
      : advanceAmount > 0
        ? "advance"
        : totalAmount > 0
          ? "paid"
          : "no_bill";

  const monthName = useMemo(
    () =>
      new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    [selectedMonth],
  );
  const milkType =
    customer?.milkType === "buffalo"
      ? "🐃 भैंस का दूध"
      : customer?.milkType === "mixed"
        ? "🥛 मिक्स दूध"
        : "🐄 गाय का दूध";

  const handleDeleteMilk = async (id) => {
    if (!id || !window.confirm("क्या आप यह milk record delete करना चाहते हैं?"))
      return;
    try {
      setRefreshing(true);
      await api.delete(`/customer-milk/log/${id}`);
      setMessage({ type: "success", text: "Milk record delete हो गया।" });
      await loadPageData(false);
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.response?.data?.message || "Milk record delete नहीं हो पाया।",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading)
    return (
      <div className="customer-details-page">
        <div className="customer-details-loading">
          <div className="customer-loading-spinner" />
          <h3>Customer details load हो रही हैं...</h3>
          <p>कृपया थोड़ा इंतजार करें</p>
        </div>
      </div>
    );
  if (!customer)
    return (
      <div className="customer-details-page">
        <div className="customer-empty-state">
          <div className="customer-empty-icon">👤</div>
          <h2>Customer नहीं मिला</h2>
          <p>Customer record उपलब्ध नहीं है।</p>
          <button
            className="customer-primary-btn"
            onClick={() => navigate("/customers")}
          >
            ← Customers
          </button>
        </div>
      </div>
    );

  return (
    <div className="customer-details-page">
      <div className="customer-topbar">
        <button
          className="customer-back-btn"
          onClick={() => navigate("/customers")}
        >
          ← <span>Customers</span>
        </button>
        <div className="customer-topbar-actions">
          <button
            className="customer-refresh-btn"
            onClick={() => loadPageData(false)}
            disabled={refreshing}
          >
            {refreshing ? "⟳ Loading..." : "↻ Refresh"}
          </button>
          <button
            className="customer-payment-top-btn"
            onClick={() =>
              navigate(`/customers/${customerId}/payment`, {
                state: { customer },
              })
            }
          >
            💳 Payment
          </button>
          <button
            className="customer-primary-btn"
            onClick={() =>
              navigate(`/customers/${customerId}/bill`, {
                state: { customer, month: selectedMonth },
              })
            }
          >
            🧾 Monthly Bill
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`customer-page-message ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "!"}</span>
          <p>{message.text}</p>
          <button onClick={() => setMessage({ type: "", text: "" })}>×</button>
        </div>
      )}

      <section className="customer-profile-hero">
        <div className="customer-profile-main">
          <div className="customer-profile-avatar">
            {customer.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="customer-profile-info">
            <div className="customer-profile-title-row">
              <h1>{customer.name}</h1>
              <span
                className={
                  customer.status === "active"
                    ? "customer-active-badge"
                    : "customer-inactive-badge"
                }
              >
                {customer.status === "active" ? "● Active" : "● Inactive"}
              </span>
            </div>
            <div className="customer-profile-meta">
              <span>
                ID: <strong>{customer.customerCode || "-"}</strong>
              </span>
              <span>📞 {customer.phone || "-"}</span>
              <span>{milkType}</span>
            </div>
          </div>
        </div>
        <div className="customer-profile-actions">
          <button
            className="customer-outline-btn"
            onClick={() => navigate(`/customers/${customerId}?addMilk=true`)}
          >
            🥛 Add Milk
          </button>
          <button
            className="customer-primary-btn"
            onClick={() =>
              navigate(`/customers/${customerId}/payment`, {
                state: { customer, month: selectedMonth },
              })
            }
          >
            💳 Add Payment
          </button>
        </div>
      </section>

      <section className="customer-month-toolbar">
        <div>
          <span className="customer-section-kicker">ACCOUNT LEDGER</span>
          <h2>{monthName}</h2>
        </div>
        <div className="customer-month-selector">
          <button
            onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00`);
              d.setMonth(d.getMonth() - 1);
              setSelectedMonth(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
              );
            }}
          >
            ‹
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00`);
              d.setMonth(d.getMonth() + 1);
              setSelectedMonth(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
              );
            }}
          >
            ›
          </button>
        </div>
      </section>

      <section className="customer-today-card">
        <div className="customer-today-card-head">
          <div>
            <span className="customer-section-kicker">TODAY</span>
            <h2>🥛 आज का दूध</h2>
          </div>
          {todayMilk && (
            <div className="customer-today-amount">
              ₹{money(todayMilk?.amount)}
            </div>
          )}
        </div>
        {todayMilk ? (
          <div className="customer-today-grid">
            <div className="customer-today-item morning">
              <span>🌅</span>
              <div>
                <strong>{qty(todayMilk?.morningMilk)} L</strong>
                <small>Morning</small>
              </div>
            </div>
            <div className="customer-today-item evening">
              <span>🌙</span>
              <div>
                <strong>{qty(todayMilk?.eveningMilk)} L</strong>
                <small>Evening</small>
              </div>
            </div>
            <div className="customer-today-item total">
              <span>🥛</span>
              <div>
                <strong>
                  {qty(
                    todayMilk?.totalMilk ??
                      n(todayMilk?.morningMilk) + n(todayMilk?.eveningMilk),
                  )}{" "}
                  L
                </strong>
                <small>Total Milk</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="customer-no-today-milk">
            <span>🥛</span>
            <div>
              <strong>आज की milk entry नहीं है</strong>
              <small>आज का दूध दर्ज करने के लिए Add Milk दबाएँ।</small>
            </div>
            <button
              onClick={() => navigate(`/customers/${customerId}?addMilk=true`)}
            >
              + Add Milk
            </button>
          </div>
        )}
      </section>

      <section className="customer-summary-grid">
        <div className="customer-summary-card milk-card">
          <div className="customer-summary-icon">🥛</div>
          <div>
            <span>Total Milk</span>
            <strong>{qty(totalMilk)} L</strong>
            <small>
              {qty(morningMilk)} L Morning • {qty(eveningMilk)} L Evening
            </small>
          </div>
        </div>
        <div className="customer-summary-card bill-card">
          <div className="customer-summary-icon">₹</div>
          <div>
            <span>Total Bill</span>
            <strong>₹{money(totalAmount)}</strong>
            <small>Monthly Bill</small>
          </div>
        </div>
        <div className="customer-summary-card paid-card">
          <div className="customer-summary-icon">✓</div>
          <div>
            <span>Total Paid</span>
            <strong>₹{money(totalPaid)}</strong>
            <small>
              {payments.length} payment{payments.length === 1 ? "" : "s"}
            </small>
          </div>
        </div>
        <div className="customer-summary-card pending-card">
          <div className="customer-summary-icon">!</div>
          <div>
            <span>{advanceAmount > 0 ? "Advance" : "Pending"}</span>
            <strong>₹{money(advanceAmount || pendingAmount)}</strong>
            <small>
              {paymentStatus === "paid"
                ? "Paid"
                : paymentStatus === "advance"
                  ? "Advance / Credit"
                  : paymentStatus === "no_bill"
                    ? "No Bill"
                    : "Pending"}
            </small>
          </div>
        </div>
      </section>

      {advanceAmount > 0 && (
        <div className="customer-advance-banner">
          <div className="customer-advance-icon">💰</div>
          <div>
            <strong>Advance / Credit</strong>
            <span>
              Customer ने bill से ₹{money(advanceAmount)} ज्यादा payment किया
              है।
            </span>
          </div>
          <strong>₹{money(advanceAmount)}</strong>
        </div>
      )}

      <section className="customer-data-section">
        <div className="customer-data-section-head">
          <div>
            <span className="customer-section-kicker">MILK RECORDS</span>
            <h2>दूध का हिसाब</h2>
          </div>
          <button
            className="customer-collapse-btn"
            onClick={() => setShowMilkDetails((v) => !v)}
          >
            {showMilkDetails ? "Hide" : "Show"}
          </button>
        </div>
        {showMilkDetails &&
          (milkLogs.length === 0 ? (
            <div className="customer-empty-table">
              <span>🥛</span>
              <strong>इस महीने कोई milk record नहीं है।</strong>
              <button
                onClick={() =>
                  navigate(`/customers/${customerId}?addMilk=true`)
                }
              >
                + Add Milk
              </button>
            </div>
          ) : (
            <div className="customer-table-wrap">
              <table className="customer-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {milkLogs.map((log, i) => (
                    <tr key={log?._id || `${log?.date}-${i}`}>
                      <td>
                        <strong>{dateText(log?.date)}</strong>
                      </td>
                      <td>{qty(log?.morningMilk)} L</td>
                      <td>{qty(log?.eveningMilk)} L</td>
                      <td>
                        <strong>
                          {qty(
                            log?.totalMilk ??
                              n(log?.morningMilk) + n(log?.eveningMilk),
                          )}{" "}
                          L
                        </strong>
                      </td>
                      <td>₹{money(log?.rate)}</td>
                      <td>
                        <strong>₹{money(log?.amount)}</strong>
                      </td>
                      <td>
                        <button
                          className="table-delete-btn"
                          onClick={() => handleDeleteMilk(log?._id)}
                          disabled={refreshing}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <section className="customer-data-section">
        <div className="customer-data-section-head">
          <div>
            <span className="customer-section-kicker">PAYMENT LEDGER</span>
            <h2>Payment</h2>
          </div>
          <button
            className="customer-primary-btn small"
            onClick={() =>
              navigate(`/customers/${customerId}/payment`, {
                state: { customer, month: selectedMonth },
              })
            }
          >
            Open Payment
          </button>
        </div>
        <div className="customer-payment-list">
          {payments.length === 0 ? (
            <div className="customer-empty-table">
              <span>💳</span>
              <strong>इस महीने कोई payment नहीं है।</strong>
              <button
                onClick={() =>
                  navigate(`/customers/${customerId}/payment`, {
                    state: { customer, month: selectedMonth },
                  })
                }
              >
                + Add Payment
              </button>
            </div>
          ) : (
            payments.slice(0, 5).map((p) => (
              <div className="customer-payment-row" key={p._id}>
                <div className="customer-payment-method-icon">
                  {p.paymentMethod === "upi"
                    ? "📱"
                    : p.paymentMethod === "bank"
                      ? "🏦"
                      : p.paymentMethod === "cheque"
                        ? "🧾"
                        : "💵"}
                </div>
                <div className="customer-payment-info">
                  <strong>{p.paymentMethod?.toUpperCase() || "CASH"}</strong>
                  <span>{dateText(p.paymentDate)}</span>
                  {p.note && <small>{p.note}</small>}
                </div>
                <div className="customer-payment-amount">
                  <strong>₹{money(p.amount)}</strong>
                  <span>Completed</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="customer-page-footer-actions">
        <button
          className="customer-primary-btn"
          onClick={() =>
            navigate(`/customers/${customerId}/payment`, {
              state: { customer, month: selectedMonth },
            })
          }
        >
          💳 Payment Page
        </button>
        <button
          className="customer-primary-btn"
          onClick={() =>
            navigate(`/customers/${customerId}/bill`, {
              state: { customer, month: selectedMonth },
            })
          }
        >
          🧾 Customer Bill
        </button>
      </div>
    </div>
  );
};

export default CustomerDetails;

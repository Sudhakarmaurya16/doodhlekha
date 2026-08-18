import React, { useCallback, useEffect, useMemo, useState } from "react";

import api from "../../services/api";

import "./Reports.css";

// ============================================================
// REPORTS
// ============================================================

const Reports = () => {
  // ==========================================================
  // DATE HELPERS
  // ==========================================================

  const pad = (value) => String(value).padStart(2, "0");

  const formatInputDate = (date) => {
    const year = date.getFullYear();

    const month = pad(date.getMonth() + 1);

    const day = pad(date.getDate());

    return `${year}-${month}-${day}`;
  };

  const getToday = () => {
    return formatInputDate(new Date());
  };

  const getMonthStart = () => {
    const date = new Date();

    date.setDate(1);

    return formatInputDate(date);
  };

  const getLast7Days = () => {
    const date = new Date();

    date.setDate(date.getDate() - 6);

    return formatInputDate(date);
  };

  const getLast30Days = () => {
    const date = new Date();

    date.setDate(date.getDate() - 29);

    return formatInputDate(date);
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const [startDate, setStartDate] = useState(getMonthStart());

  const [endDate, setEndDate] = useState(getToday());

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // NUMBER
  // ==========================================================

  const number = (value) => {
    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
  };

  const formatNumber = (value) => {
    return number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatMoney = (value) => {
    return number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,

      maximumFractionDigits: 2,
    });
  };

  // ==========================================================
  // DATE DISPLAY
  // ==========================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      const raw = String(value);

      const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(`${raw}T00:00:00`)
        : new Date(raw);

      if (Number.isNaN(date.getTime())) {
        return raw;
      }

      return date.toLocaleDateString("hi-IN", {
        day: "2-digit",

        month: "short",

        year: "numeric",
      });
    } catch {
      return String(value);
    }
  };

  // ==========================================================
  // LOAD REPORT
  // ==========================================================

  const loadReport = useCallback(
    async (showRefresh = false) => {
      if (!startDate || !endDate) {
        setError("कृपया दोनों तारीख चुनें।");

        return;
      }

      if (startDate > endDate) {
        setError("शुरू की तारीख, आखिरी तारीख से बड़ी नहीं हो सकती।");

        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        console.log("📊 REPORT REQUEST:", {
          startDate,
          endDate,
        });

        const response = await api.get("/reports/summary", {
          params: {
            startDate,
            endDate,
          },
        });

        console.log("📊 REPORT RESPONSE:", response.data);

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Report load नहीं हो पाई");
        }

        // ====================================================
        // IMPORTANT
        // Backend:
        //
        // {
        //   success: true,
        //   data: {
        //      production,
        //      customerMilk,
        //      stock,
        //      finance,
        //      dailyData
        //   }
        // }
        // ====================================================

        const data = response.data?.data || {};

        console.log("✅ FINAL REPORT DATA:", data);

        setReport(data);
      } catch (err) {
        console.error("❌ REPORT ERROR:", err);

        console.error("BACKEND RESPONSE:", err?.response?.data);

        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "रिपोर्ट लोड नहीं हो पाई।",
        );

        setReport(null);
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [startDate, endDate],
  );

  // ==========================================================
  // FIRST LOAD
  // ==========================================================

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ==========================================================
  // QUICK FILTERS
  // ==========================================================

  const handleToday = () => {
    const today = getToday();

    setStartDate(today);

    setEndDate(today);
  };

  const handleLast7Days = () => {
    setStartDate(getLast7Days());

    setEndDate(getToday());
  };

  const handleThisMonth = () => {
    setStartDate(getMonthStart());

    setEndDate(getToday());
  };

  const handleLast30Days = () => {
    setStartDate(getLast30Days());

    setEndDate(getToday());
  };

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = () => {
    if (!report) {
      alert("पहले रिपोर्ट लोड होने दें।");

      return;
    }

    document.body.classList.add("doodhlekha-print-mode");

    setTimeout(() => {
      window.print();
    }, 150);

    setTimeout(() => {
      document.body.classList.remove("doodhlekha-print-mode");
    }, 1500);
  };

  // ==========================================================
  // SAFE DATA
  // ==========================================================

  const production = report?.production || {};

  const customerMilk = report?.customerMilk || {};

  const stock = report?.stock || {};

  const finance = report?.finance || {};

  const dailyData = Array.isArray(report?.dailyData) ? report.dailyData : [];

  const customerWise = Array.isArray(report?.customerWise)
    ? report.customerWise
    : [];

  const customerPayments = Array.isArray(report?.customerPayments)
    ? report.customerPayments
    : [];

  const expenseByCategory = Array.isArray(report?.expenseByCategory)
    ? report.expenseByCategory
    : [];

  // ==========================================================
  // VALUES
  // ==========================================================

  const totalProduction = number(production.totalMilk);

  const morningProduction = number(production.morningMilk);

  const eveningProduction = number(production.eveningMilk);

  const totalCustomerMilk = number(customerMilk.totalMilk);

  const customerMilkAmount = number(customerMilk.totalAmount);

  const customerPayment = number(finance.customerPayment);

  const totalExpense = number(finance.totalExpense);

  const netAmount = number(finance.netAmount);

  const remainingMilk = number(stock.remainingMilk);

  const customerCount = number(customerMilk.customers);

  const distributedPercentage = Math.min(
    Math.max(number(stock.distributedPercentage), 0),
    100,
  );

  // ==========================================================
  // AVERAGE
  // ==========================================================

  const averageMilkPerDay = useMemo(() => {
    if (!production.days) return 0;

    return totalProduction / number(production.days);
  }, [production.days, totalProduction]);

  const averageCustomerMilkPerDay = useMemo(() => {
    if (!production.days) return 0;

    return totalCustomerMilk / number(production.days);
  }, [production.days, totalCustomerMilk]);

  // ==========================================================
  // HAS DATA
  // ==========================================================

  const hasData =
    totalProduction > 0 ||
    totalCustomerMilk > 0 ||
    customerPayment > 0 ||
    totalExpense > 0 ||
    dailyData.length > 0;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="reports-spinner"></div>

          <h2>रिपोर्ट तैयार हो रही है...</h2>

          <p>आपकी डेयरी का हिसाब निकाला जा रहा है।</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="reports-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="reports-header screen-only">
        <div className="reports-brand">
          <div className="reports-brand-icon">🥛</div>

          <div>
            <span>DOODHLEKHA</span>

            <h1>डेयरी का पूरा हिसाब</h1>

            <p>दूध, ग्राहक, भुगतान और खर्च — सब एक जगह</p>
          </div>
        </div>

        <div className="reports-actions">
          <button
            type="button"
            className="btn btn-refresh"
            onClick={() => loadReport(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "spin" : ""}>↻</span>

            {refreshing ? "लोड हो रहा..." : "Refresh"}
          </button>

          <button type="button" className="btn btn-print" onClick={handlePrint}>
            🖨️ Print
          </button>
        </div>
      </header>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <section className="report-filter screen-only">
        <div className="filter-title">
          <span>📅</span>

          <div>
            <h3>रिपोर्ट की तारीख</h3>

            <p>जिस समय का हिसाब देखना है, वह चुनें</p>
          </div>
        </div>

        <div className="filter-row">
          <div className="date-box">
            <label>शुरू की तारीख</label>

            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="date-arrow">→</div>

          <div className="date-box">
            <label>आखिरी तारीख</label>

            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="apply-btn"
            onClick={() => loadReport(true)}
          >
            🔎 हिसाब देखें
          </button>
        </div>

        <div className="quick-buttons">
          <button type="button" onClick={handleToday}>
            आज
          </button>

          <button type="button" onClick={handleLast7Days}>
            पिछले 7 दिन
          </button>

          <button type="button" onClick={handleThisMonth}>
            इस महीना
          </button>

          <button type="button" onClick={handleLast30Days}>
            पिछले 30 दिन
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="report-error">
          <span>⚠️</span>

          <div>
            <strong>रिपोर्ट में समस्या</strong>

            <p>{error}</p>
          </div>

          <button type="button" onClick={() => loadReport(true)}>
            दोबारा कोशिश
          </button>
        </div>
      )}

      {/* =====================================================
          PRINT HEADER
      ===================================================== */}

      <section className="print-header print-only">
        <div>
          <strong>🥛 DOODHLEKHA</strong>

          <span>Smart Dairy Management</span>
        </div>

        <div>
          <h1>डेयरी रिपोर्ट</h1>

          <p>
            {formatDate(startDate)} — {formatDate(endDate)}
          </p>
        </div>
      </section>

      {/* =====================================================
          PERIOD
      ===================================================== */}

      <div className="report-period">
        <span>रिपोर्ट अवधि</span>

        <strong>
          {formatDate(startDate)} — {formatDate(endDate)}
        </strong>
      </div>

      {/* =====================================================
          MAIN CARDS
      ===================================================== */}

      <section className="summary-grid">
        <div className="summary-card milk">
          <div className="summary-icon">🥛</div>

          <div>
            <span>कुल दूध</span>

            <strong>{formatNumber(totalProduction)} लीटर</strong>

            <small>
              सुबह {formatNumber(morningProduction)} L • शाम{" "}
              {formatNumber(eveningProduction)} L
            </small>
          </div>
        </div>

        <div className="summary-card customer">
          <div className="summary-icon">👥</div>

          <div>
            <span>ग्राहक को दिया दूध</span>

            <strong>{formatNumber(totalCustomerMilk)} लीटर</strong>

            <small>
              {customerCount} ग्राहक • ₹{formatMoney(customerMilkAmount)}
            </small>
          </div>
        </div>

        <div className="summary-card payment">
          <div className="summary-icon">💰</div>

          <div>
            <span>ग्राहक से मिला पैसा</span>

            <strong>₹{formatMoney(customerPayment)}</strong>

            <small>इस अवधि में प्राप्त भुगतान</small>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="summary-icon">💸</div>

          <div>
            <span>कुल खर्च</span>

            <strong>₹{formatMoney(totalExpense)}</strong>

            <small>डेयरी के सभी खर्च</small>
          </div>
        </div>
      </section>

      {/* =====================================================
          SIMPLE FINANCE
      ===================================================== */}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">पैसे का हिसाब</span>

            <h2>💰 पैसा आया और कितना खर्च हुआ?</h2>

            <p>ग्राहक से मिले पैसे में से खर्च निकालने के बाद</p>
          </div>
        </div>

        <div className="finance-grid">
          <div className="finance-item received">
            <span>💵</span>

            <div>
              <small>ग्राहक से मिला</small>

              <strong>₹{formatMoney(customerPayment)}</strong>
            </div>
          </div>

          <div className="finance-item spent">
            <span>💸</span>

            <div>
              <small>कुल खर्च</small>

              <strong>₹{formatMoney(totalExpense)}</strong>
            </div>
          </div>

          <div
            className={`finance-item net ${
              netAmount >= 0 ? "positive" : "negative"
            }`}
          >
            <span>{netAmount >= 0 ? "📈" : "📉"}</span>

            <div>
              <small>बचा पैसा</small>

              <strong>₹{formatMoney(netAmount)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MILK
      ===================================================== */}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">दूध का हिसाब</span>

            <h2>🥛 दूध कहाँ गया?</h2>

            <p>उत्पादन, ग्राहक को दिया और बचा हुआ दूध</p>
          </div>
        </div>

        <div className="milk-grid">
          <div className="milk-box">
            <span>🌅 सुबह का दूध</span>

            <strong>{formatNumber(morningProduction)} L</strong>
          </div>

          <div className="milk-box">
            <span>🌆 शाम का दूध</span>

            <strong>{formatNumber(eveningProduction)} L</strong>
          </div>

          <div className="milk-box sold">
            <span>👥 ग्राहक को दिया</span>

            <strong>{formatNumber(totalCustomerMilk)} L</strong>
          </div>

          <div className="milk-box remaining">
            <span>📦 बचा हुआ दूध</span>

            <strong>{formatNumber(remainingMilk)} L</strong>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-top">
            <span>दूध बिक्री</span>

            <strong>{formatNumber(distributedPercentage)}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${distributedPercentage}%`,
              }}
            />
          </div>

          <div className="progress-bottom">
            <span>{formatNumber(totalCustomerMilk)} L ग्राहक को दिया</span>

            <span>{formatNumber(remainingMilk)} L बचा</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          PERFORMANCE
      ===================================================== */}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">आपकी डेयरी</span>

            <h2>📈 काम का छोटा हिसाब</h2>
          </div>
        </div>

        <div className="performance-grid">
          <div className="performance-box">
            <span>📅</span>

            <div>
              <small>दूध दर्ज किए दिन</small>

              <strong>{formatNumber(production.days || 0)}</strong>
            </div>
          </div>

          <div className="performance-box">
            <span>🥛</span>

            <div>
              <small>रोज औसत उत्पादन</small>

              <strong>{formatNumber(averageMilkPerDay)} L</strong>
            </div>
          </div>

          <div className="performance-box">
            <span>👥</span>

            <div>
              <small>रोज औसत ग्राहक दूध</small>

              <strong>{formatNumber(averageCustomerMilkPerDay)} L</strong>
            </div>
          </div>

          <div className="performance-box">
            <span>🧑‍🌾</span>

            <div>
              <small>ग्राहक</small>

              <strong>{customerCount}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CUSTOMER WISE
      ===================================================== */}

      {customerWise.length > 0 && (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ग्राहक का हिसाब</span>

              <h2>👥 किस ग्राहक ने कितना दूध लिया?</h2>

              <p>चुनी हुई अवधि के अनुसार</p>
            </div>

            <span className="count-badge">{customerWise.length} ग्राहक</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ग्राहक</th>

                  <th>कोड</th>

                  <th>दूध</th>

                  <th>कुल बिल</th>
                </tr>
              </thead>

              <tbody>
                {customerWise.map((customer) => (
                  <tr key={customer.customerId}>
                    <td>
                      <strong>{customer.name || "ग्राहक"}</strong>

                      <small>{customer.phone || ""}</small>
                    </td>

                    <td>{customer.customerCode || "-"}</td>

                    <td>
                      <strong>{formatNumber(customer.totalMilk)} L</strong>
                    </td>

                    <td>₹{formatMoney(customer.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================
          DAILY REPORT
      ===================================================== */}

      <section className="section-card daily-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">रोज का हिसाब</span>

            <h2>📋 हर दिन का दूध और पैसा</h2>

            <p>दिन के हिसाब से पूरा रिकॉर्ड</p>
          </div>

          <span className="count-badge">{dailyData.length} दिन</span>
        </div>

        {dailyData.length === 0 ? (
          <div className="empty-state">
            <div>📭</div>

            <h3>इस तारीख में कोई रिकॉर्ड नहीं</h3>

            <p>दूसरी तारीख चुनें या पहले दूध की entry करें।</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>तारीख</th>

                  <th>सुबह</th>

                  <th>शाम</th>

                  <th>कुल दूध</th>

                  <th>ग्राहक को दिया</th>

                  <th>बचा हुआ</th>

                  <th>बिल</th>

                  <th>मिला पैसा</th>

                  <th>खर्च</th>

                  <th>बचा पैसा</th>
                </tr>
              </thead>

              <tbody>
                {dailyData.map((day, index) => (
                  <tr key={`${day.date}-${index}`}>
                    <td>
                      <strong>{formatDate(day.date)}</strong>
                    </td>

                    <td>{formatNumber(day.morningMilk)} L</td>

                    <td>{formatNumber(day.eveningMilk)} L</td>

                    <td>
                      <strong>{formatNumber(day.production)} L</strong>
                    </td>

                    <td className="green-text">
                      {formatNumber(day.customerMilk)} L
                    </td>

                    <td className="orange-text">
                      {formatNumber(day.remainingMilk)} L
                    </td>

                    <td>₹{formatMoney(day.milkAmount)}</td>

                    <td className="green-text">₹{formatMoney(day.payment)}</td>

                    <td className="red-text">₹{formatMoney(day.expense)}</td>

                    <td
                      className={
                        number(day.netAmount) >= 0 ? "green-text" : "red-text"
                      }
                    >
                      ₹{formatMoney(day.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          EXPENSE CATEGORY
      ===================================================== */}

      {expenseByCategory.length > 0 && (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">खर्च</span>

              <h2>💸 खर्च कहाँ हुआ?</h2>
            </div>
          </div>

          <div className="expense-list">
            {expenseByCategory.map((item) => (
              <div className="expense-row" key={item.category}>
                <div>
                  <span>{item.category}</span>

                  <small>इस category में कुल खर्च</small>
                </div>

                <strong>₹{formatMoney(item.total)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          CUSTOMER PAYMENTS
      ===================================================== */}

      {customerPayments.length > 0 && (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">भुगतान</span>

              <h2>💵 किस ग्राहक से कितना पैसा मिला?</h2>
            </div>
          </div>

          <div className="payment-list">
            {customerPayments.map((item) => (
              <div className="payment-row" key={item.customerId}>
                <div>
                  <strong>{item.name || "ग्राहक"}</strong>

                  <small>{item.customerCode || ""}</small>
                </div>

                <strong>₹{formatMoney(item.totalPayment)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          NO DATA
      ===================================================== */}

      {!hasData && !error && (
        <div className="empty-state large">
          <div>📊</div>

          <h2>इस अवधि में कोई हिसाब नहीं मिला</h2>

          <p>दूसरी तारीख चुनें या पहले दूध, ग्राहक और खर्च की entry करें।</p>

          <button type="button" onClick={handleThisMonth}>
            इस महीने का हिसाब देखें
          </button>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="reports-footer">
        <strong>🥛 DOODHLEKHA</strong>

        <span>Smart Dairy Management</span>

        <small>
          रिपोर्ट: {formatDate(startDate)} — {formatDate(endDate)}
        </small>
      </footer>

      {/* =====================================================
          PRINT FOOTER
      ===================================================== */}

      <footer className="print-footer print-only">
        <strong>DOODHLEKHA</strong>

        <span>यह रिपोर्ट सिस्टम द्वारा तैयार की गई है।</span>

        <span>धन्यवाद 🙏</span>
      </footer>
    </div>
  );
};

export default Reports;

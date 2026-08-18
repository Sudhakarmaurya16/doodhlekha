import React, { useCallback, useEffect, useMemo, useState } from "react";

import api from "../../services/api";

import "./SaleMilk.css";

// ============================================================
// DATE HELPERS
// ============================================================

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

// ============================================================
// NUMBER
// ============================================================

const number = (value) => {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
};

const milk = (value) => {
  return number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const money = (value) => {
  return number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ============================================================
// DATE FORMAT
// ============================================================

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// COMPONENT
// ============================================================

const SaleMilk = () => {
  const [todayData, setTodayData] = useState(null);

  const [sales, setSales] = useState([]);

  const [dailyData, setDailyData] = useState([]);

  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  const [todayLoading, setTodayLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("today");

  const [startDate, setStartDate] = useState(getToday());

  const [endDate, setEndDate] = useState(getToday());

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // TODAY
  // ==========================================================

  const fetchTodayData = useCallback(async () => {
    try {
      setTodayLoading(true);
      setErrorMessage("");

      const response = await api.get("/sale-milk/today", {
        params: {
          _t: Date.now(),
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Today's sale data load failed",
        );
      }

      setTodayData(response.data?.data || null);
    } catch (error) {
      console.error("Today Sale Details Error:", error);

      setTodayData(null);

      setErrorMessage(
        error.response?.data?.message || "आज का दूध हिसाब load नहीं हो पाया।",
      );
    } finally {
      setTodayLoading(false);
    }
  }, []);

  // ==========================================================
  // HISTORY
  // ==========================================================

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {};

      if (filter === "today") {
        params.startDate = getToday();
        params.endDate = getToday();
      }

      if (filter === "month") {
        params.startDate = getMonthStart();
        params.endDate = getToday();
      }

      if (filter === "custom") {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      params._t = Date.now();

      const response = await api.get("/sale-milk", {
        params,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Sale data load failed");
      }

      setSales(Array.isArray(response.data?.data) ? response.data.data : []);

      setDailyData(
        Array.isArray(response.data?.dailyData) ? response.data.dailyData : [],
      );

      setSummary(response.data?.summary || null);
    } catch (error) {
      console.error("Sale History Error:", error);

      setSales([]);
      setDailyData([]);
      setSummary(null);

      setErrorMessage(
        error.response?.data?.message || "Sale details load नहीं हो पाई।",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  // ==========================================================
  // INITIAL
  // ==========================================================

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  // ==========================================================
  // HISTORY
  // ==========================================================

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([fetchTodayData(), fetchSales()]);
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // TODAY VALUES
  // ==========================================================

  const todayProduction = number(
    todayData?.totalProduction ?? todayData?.totalMilk,
  );

  const todayCustomerMilk = number(
    todayData?.customerMilk ?? todayData?.totalSale,
  );

  const todayCustomerAmount = number(todayData?.customerAmount);

  const todayRemaining = Math.max(todayProduction - todayCustomerMilk, 0);

  const todayCustomerCount = number(todayData?.customerCount);

  const todayMorningProduction = number(todayData?.morningProduction);

  const todayEveningProduction = number(todayData?.eveningProduction);

  const todayMorningCustomer = number(todayData?.morningCustomerMilk);

  const todayEveningCustomer = number(todayData?.eveningCustomerMilk);

  // ==========================================================
  // FILTER SUMMARY
  // ==========================================================

  const currentSummary = useMemo(() => {
    if (summary) {
      return summary;
    }

    return {
      totalProduction: 0,
      customerMilk: 0,
      customerAmount: 0,
      remainingMilk: 0,
      morningProduction: 0,
      eveningProduction: 0,
      customerCount: 0,
      distributionPercentage: 0,
    };
  }, [summary]);

  // ==========================================================
  // DATE RANGE TEXT
  // ==========================================================

  const reportPeriod = useMemo(() => {
    if (filter === "today") {
      return `${formatDate(getToday())}`;
    }

    if (filter === "month") {
      return `${formatDate(getMonthStart())} — ${formatDate(getToday())}`;
    }

    return `${formatDate(startDate)} — ${formatDate(endDate)}`;
  }, [filter, startDate, endDate]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="sale-milk-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sale-page-header">
        <div className="sale-page-heading">
          <div className="sale-page-icon">🥛</div>

          <div>
            <div className="sale-eyebrow">MILK SALES</div>

            <h1>
              दूध बिक्री
              <span>Milk Sale</span>
            </h1>

            <p>ग्राहक को दिए गए दूध का पूरा हिसाब</p>
          </div>
        </div>

        <button
          type="button"
          className="sale-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "⟳ Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="sale-error">
          <div>⚠️</div>

          <div>
            <strong>Data load करने में समस्या</strong>

            <span>{errorMessage}</span>
          </div>

          <button type="button" onClick={handleRefresh}>
            फिर से कोशिश करें
          </button>
        </div>
      )}

      {/* ======================================================
          TODAY HERO
      ====================================================== */}

      <section className="sale-today-card">
        <div className="sale-today-header">
          <div>
            <span className="sale-section-label">TODAY</span>

            <h2>🥛 आज का दूध हिसाब</h2>

            <p>Today's Milk & Customer Sale</p>
          </div>

          <div className="sale-date-chip">
            📅 {formatDate(todayData?.date || getToday())}
          </div>
        </div>

        {todayLoading ? (
          <div className="sale-loading-box">
            <div className="sale-spinner" />
            <p>आज का दूध हिसाब load हो रहा है...</p>
          </div>
        ) : (
          <>
            <div className="sale-today-grid">
              {/* PRODUCTION */}

              <div className="sale-today-stat green">
                <div className="sale-stat-icon">🥛</div>

                <div>
                  <small>कुल दूध</small>

                  <strong>{milk(todayProduction)} L</strong>

                  <span>Total Production</span>
                </div>
              </div>

              {/* CUSTOMER */}

              <div className="sale-today-stat blue">
                <div className="sale-stat-icon">👥</div>

                <div>
                  <small>ग्राहक को दिया</small>

                  <strong>{milk(todayCustomerMilk)} L</strong>

                  <span>Customer Milk</span>
                </div>
              </div>

              {/* AMOUNT */}

              <div className="sale-today-stat yellow">
                <div className="sale-stat-icon">💰</div>

                <div>
                  <small>ग्राहक बिल</small>

                  <strong>₹{money(todayCustomerAmount)}</strong>

                  <span>Customer Bill</span>
                </div>
              </div>

              {/* REMAINING */}

              <div className="sale-today-stat orange">
                <div className="sale-stat-icon">📦</div>

                <div>
                  <small>बचा हुआ दूध</small>

                  <strong>{milk(todayRemaining)} L</strong>

                  <span>Remaining Milk</span>
                </div>
              </div>
            </div>

            {/* MORNING / EVENING */}

            <div className="sale-session-row">
              <div className="sale-session-box">
                <span>🌅 सुबह Production</span>

                <strong>{milk(todayMorningProduction)} L</strong>

                <small>Customer: {milk(todayMorningCustomer)} L</small>
              </div>

              <div className="sale-session-box">
                <span>🌙 शाम Production</span>

                <strong>{milk(todayEveningProduction)} L</strong>

                <small>Customer: {milk(todayEveningCustomer)} L</small>
              </div>

              <div className="sale-session-box">
                <span>👥 ग्राहक</span>

                <strong>{todayCustomerCount}</strong>

                <small>Customers</small>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ======================================================
          EASY FORMULA
      ====================================================== */}

      <section className="sale-formula-card">
        <div className="formula-heading">
          <div className="formula-icon">🧮</div>

          <div>
            <h3>आज का आसान हिसाब</h3>

            <p>कुल दूध − ग्राहक को दिया = बचा हुआ दूध</p>
          </div>
        </div>

        <div className="formula-row">
          <div className="formula-item production">
            <span>कुल दूध</span>

            <strong>{milk(todayProduction)} L</strong>

            <small>Total Milk</small>
          </div>

          <div className="formula-symbol">−</div>

          <div className="formula-item customer">
            <span>ग्राहक</span>

            <strong>{milk(todayCustomerMilk)} L</strong>

            <small>Customer Milk</small>
          </div>

          <div className="formula-symbol">=</div>

          <div className="formula-item remaining">
            <span>बचा हुआ</span>

            <strong>{milk(todayRemaining)} L</strong>

            <small>Remaining</small>
          </div>
        </div>
      </section>

      {/* ======================================================
          REPORT SUMMARY
      ====================================================== */}

      <section className="sale-summary-section">
        <div className="sale-section-title-row">
          <div>
            <span>REPORT SUMMARY</span>

            <h2>बिक्री का सारांश</h2>
          </div>

          <div className="sale-period">{reportPeriod}</div>
        </div>

        <div className="sale-summary-grid">
          <div className="summary-card green">
            <div>🥛</div>

            <span>कुल दूध</span>

            <strong>{milk(currentSummary.totalProduction)} L</strong>

            <small>Total Production</small>
          </div>

          <div className="summary-card blue">
            <div>👥</div>

            <span>ग्राहक को दिया</span>

            <strong>{milk(currentSummary.customerMilk)} L</strong>

            <small>Customer Milk</small>
          </div>

          <div className="summary-card yellow">
            <div>💰</div>

            <span>ग्राहक बिल</span>

            <strong>₹{money(currentSummary.customerAmount)}</strong>

            <small>Customer Bill</small>
          </div>

          <div className="summary-card orange">
            <div>📦</div>

            <span>बचा हुआ दूध</span>

            <strong>{milk(currentSummary.remainingMilk)} L</strong>

            <small>Remaining Milk</small>
          </div>
        </div>
      </section>

      {/* ======================================================
          FILTER
      ====================================================== */}

      <section className="sale-history-card">
        <div className="sale-history-header">
          <div>
            <span className="sale-section-label">SALES HISTORY</span>

            <h2>📋 दूध बिक्री का इतिहास</h2>

            <p>Customer Milk Distribution</p>
          </div>

          <div className="sale-filter-buttons">
            <button
              type="button"
              className={filter === "today" ? "active" : ""}
              onClick={() => setFilter("today")}
            >
              आज
            </button>

            <button
              type="button"
              className={filter === "month" ? "active" : ""}
              onClick={() => setFilter("month")}
            >
              इस महीने
            </button>

            <button
              type="button"
              className={filter === "custom" ? "active" : ""}
              onClick={() => setFilter("custom")}
            >
              तारीख
            </button>
          </div>
        </div>

        {/* CUSTOM DATE */}

        {filter === "custom" && (
          <div className="sale-custom-date">
            <div>
              <label>From Date</label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <span>→</span>

            <div>
              <label>To Date</label>

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ====================================================
            TABLE
        ==================================================== */}

        {loading ? (
          <div className="sale-loading-box">
            <div className="sale-spinner" />

            <p>Sale records load हो रहे हैं...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="sale-empty">
            <div className="sale-empty-icon">🥛</div>

            <h3>इस अवधि में कोई sale नहीं है</h3>

            <p>Customer को दूध देने के बाद उसका हिसाब यहाँ दिखाई देगा।</p>
          </div>
        ) : (
          <div className="sale-table-wrap">
            <table className="sale-table">
              <thead>
                <tr>
                  <th>
                    तारीख
                    <small>Date</small>
                  </th>

                  <th>
                    ग्राहक
                    <small>Customer</small>
                  </th>

                  <th>
                    सुबह
                    <small>Morning</small>
                  </th>

                  <th>
                    शाम
                    <small>Evening</small>
                  </th>

                  <th>
                    कुल दूध
                    <small>Total Milk</small>
                  </th>

                  <th>
                    Rate
                    <small>₹ / L</small>
                  </th>

                  <th>
                    Bill
                    <small>Amount</small>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale, index) => {
                  const customer = sale.customer;

                  return (
                    <tr key={sale._id || index}>
                      <td>
                        <strong>{formatDate(sale.date)}</strong>
                      </td>

                      <td>
                        <div className="sale-customer">
                          <div className="sale-avatar">
                            {customer?.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>

                          <div>
                            <strong>{customer?.name || "Customer"}</strong>

                            <small>{customer?.customerCode || ""}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="milk-pill morning">
                          🌅 {milk(sale.morningMilk)} L
                        </span>
                      </td>

                      <td>
                        <span className="milk-pill evening">
                          🌙 {milk(sale.eveningMilk)} L
                        </span>
                      </td>

                      <td>
                        <strong className="total-milk-text">
                          {milk(sale.totalMilk)} L
                        </strong>
                      </td>

                      <td>₹{money(sale.rate)}</td>

                      <td>
                        <strong className="sale-amount">
                          ₹{money(sale.amount)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ======================================================
          DAILY REPORT
      ====================================================== */}

      <section className="daily-sale-card">
        <div className="sale-history-header">
          <div>
            <span className="sale-section-label">DAILY REPORT</span>

            <h2>📊 दिन के हिसाब से दूध</h2>

            <p>Daily Milk Distribution</p>
          </div>

          <div className="daily-count">{dailyData.length} Days</div>
        </div>

        {dailyData.length === 0 ? (
          <div className="daily-empty">
            📭
            <p>इस अवधि में daily data नहीं है।</p>
          </div>
        ) : (
          <div className="sale-table-wrap">
            <table className="sale-table daily">
              <thead>
                <tr>
                  <th>तारीख</th>

                  <th>कुल दूध</th>

                  <th>ग्राहक को दिया</th>

                  <th>Bill</th>

                  <th>बचा हुआ</th>

                  <th>Distribution</th>
                </tr>
              </thead>

              <tbody>
                {dailyData.map((day, index) => (
                  <tr key={day.date || index}>
                    <td>
                      <strong>{formatDate(day.date)}</strong>
                    </td>

                    <td>{milk(day.totalProduction)} L</td>

                    <td>
                      <span className="customer-milk-text">
                        {milk(day.customerMilk)} L
                      </span>
                    </td>

                    <td>
                      <strong>₹{money(day.customerAmount)}</strong>
                    </td>

                    <td>
                      <span className="remaining-milk-text">
                        {milk(day.remainingMilk)} L
                      </span>
                    </td>

                    <td>
                      <div className="distribution-cell">
                        <div className="distribution-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                number(day.distributionPercentage),
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <small>
                          {number(day.distributionPercentage).toFixed(0)}%
                        </small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SaleMilk;

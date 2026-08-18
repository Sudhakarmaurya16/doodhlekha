import React, { useEffect, useMemo, useState } from "react";

import api from "../../services/api";
import MilkLogForm from "./MilkLogForm";

import "./MilkLogs.css";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getMonthStart = () => {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
};

const MilkLogs = () => {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingLog, setEditingLog] = useState(null);

  const [search, setSearch] = useState("");

  const [filterType, setFilterType] = useState("today");

  const [startDate, setStartDate] = useState(getToday());

  const [endDate, setEndDate] = useState(getToday());

  const [selectedCow, setSelectedCow] = useState("");

  const [cows, setCows] = useState([]);

  // --------------------------------
  // Fetch Cows
  // --------------------------------

  const fetchCows = async () => {
    try {
      const response = await api.get("/cows");

      setCows(response.data.data || []);
    } catch (error) {
      console.error("Fetch cows error:", error);
    }
  };

  // --------------------------------
  // Fetch Logs
  // --------------------------------

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let params = {};

      if (filterType === "today") {
        params.startDate = getToday();
        params.endDate = getToday();
      }

      if (filterType === "month") {
        params.startDate = getMonthStart();

        params.endDate = getToday();
      }

      if (filterType === "custom") {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (selectedCow) {
        params.cowId = selectedCow;
      }

      const response = await api.get("/milk-logs", {
        params,
      });

      setLogs(response.data.data || []);
    } catch (error) {
      console.error("Fetch milk logs error:", error);

      alert("Milk records load नहीं हो पाए");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCows();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterType, startDate, endDate, selectedCow]);

  // --------------------------------
  // Search
  // --------------------------------

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return logs;
    }

    return logs.filter((log) => {
      const cowName = log.cow?.name?.toLowerCase() || "";

      const cowCode = log.cowId?.toLowerCase() || "";

      return cowName.includes(keyword) || cowCode.includes(keyword);
    });
  }, [logs, search]);

  // --------------------------------
  // Summary
  // --------------------------------

  const summary = useMemo(() => {
    return filteredLogs.reduce(
      (acc, log) => {
        acc.morning += Number(log.morningMilk || 0);

        acc.evening += Number(log.eveningMilk || 0);

        acc.total += Number(log.totalMilk || 0);

        return acc;
      },
      {
        morning: 0,
        evening: 0,
        total: 0,
      },
    );
  }, [filteredLogs]);

  // --------------------------------
  // Date Format
  // --------------------------------

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------
  // Edit
  // --------------------------------

  const handleEdit = (log) => {
    setEditingLog(log);
    setShowForm(true);
  };

  // --------------------------------
  // Delete
  // --------------------------------

  const handleDelete = async (log) => {
    const confirmed = window.confirm(
      `क्या आप ${log.cow?.name || "इस गाय"} की ${formatDate(
        log.date,
      )} की Milk Entry delete करना चाहते हैं?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/milk-logs/${log._id}`);

      alert("🗑️ Milk entry delete हो गई");

      fetchLogs();
    } catch (error) {
      console.error("Delete milk error:", error);

      alert(error.response?.data?.message || "Milk entry delete नहीं हो पाई");
    }
  };

  // --------------------------------
  // Form Close
  // --------------------------------

  const closeForm = () => {
    setShowForm(false);
    setEditingLog(null);
  };

  return (
    <div className="milk-page">
      {/* ================= HEADER ================= */}

      <div className="milk-page-header">
        <div>
          <h2>🥛 Milk Logs</h2>

          <p>
            रोज का दूध रिकॉर्ड रखें
            <br />
            <span>Daily Milk Production Record</span>
          </p>
        </div>

        <button
          className="add-milk-btn"
          onClick={() => {
            setEditingLog(null);
            setShowForm(true);
          }}
        >
          ＋ आज का दूध जोड़ें
          <small>Add Milk Entry</small>
        </button>
      </div>

      {/* ================= FILTER ================= */}

      <div className="milk-filter-box">
        <div className="filter-title">
          🔍 रिकॉर्ड खोजें
          <small>Search & Filter</small>
        </div>

        <div className="milk-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="गाय का नाम या Cow ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filterType === "today" ? "active" : ""}
            onClick={() => setFilterType("today")}
          >
            आज
            <small>Today</small>
          </button>

          <button
            className={filterType === "month" ? "active" : ""}
            onClick={() => setFilterType("month")}
          >
            इस महीने
            <small>This Month</small>
          </button>

          <button
            className={filterType === "custom" ? "active" : ""}
            onClick={() => setFilterType("custom")}
          >
            तारीख चुनें
            <small>Custom Date</small>
          </button>
        </div>

        {filterType === "custom" && (
          <div className="custom-date-filter">
            <div>
              <label>From / से</label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label>To / तक</label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="cow-filter">
          <label>🐄 गाय</label>

          <select
            value={selectedCow}
            onChange={(e) => setSelectedCow(e.target.value)}
          >
            <option value="">सभी गाय / All Cows</option>

            {cows.map((cow) => (
              <option key={cow._id} value={cow.cowId}>
                {cow.name} — {cow.cowId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}

      <div className="milk-summary">
        <div className="milk-summary-card">
          <span className="milk-summary-icon">🥛</span>

          <div>
            <p>Total Milk</p>

            <h3>{summary.total.toFixed(1)} L</h3>

            <small>कुल दूध</small>
          </div>
        </div>

        <div className="milk-summary-card morning-card">
          <span className="milk-summary-icon">🌅</span>

          <div>
            <p>Morning Milk</p>

            <h3>{summary.morning.toFixed(1)} L</h3>

            <small>सुबह का दूध</small>
          </div>
        </div>

        <div className="milk-summary-card evening-card">
          <span className="milk-summary-icon">🌙</span>

          <div>
            <p>Evening Milk</p>

            <h3>{summary.evening.toFixed(1)} L</h3>

            <small>शाम का दूध</small>
          </div>
        </div>

        <div className="milk-summary-card">
          <span className="milk-summary-icon">🐄</span>

          <div>
            <p>Records</p>

            <h3>{filteredLogs.length}</h3>

            <small>दूध रिकॉर्ड</small>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="milk-list-section">
        <div className="milk-list-header">
          <div>
            <h3>दूध का रिकॉर्ड</h3>

            <p>Daily Milk Records</p>
          </div>

          <button onClick={fetchLogs} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="milk-loading">
            <div className="loader"></div>

            <p>दूध की जानकारी लोड हो रही है...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="milk-empty">
            <div>🥛</div>

            <h3>कोई रिकॉर्ड नहीं मिला</h3>

            <p>इस तारीख या search के लिए कोई milk entry नहीं है।</p>

            <button
              onClick={() => {
                setEditingLog(null);
                setShowForm(true);
              }}
            >
              ＋ दूध जोड़ें
            </button>
          </div>
        ) : (
          <div className="milk-table-wrapper">
            <table className="milk-table">
              <thead>
                <tr>
                  <th>
                    Date
                    <br />
                    <small>तारीख</small>
                  </th>

                  <th>
                    Cow
                    <br />
                    <small>गाय</small>
                  </th>

                  <th>
                    Morning
                    <br />
                    <small>सुबह</small>
                  </th>

                  <th>
                    Evening
                    <br />
                    <small>शाम</small>
                  </th>

                  <th>
                    Total
                    <br />
                    <small>कुल</small>
                  </th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDate(log.date)}</td>

                    <td>
                      <div className="cow-cell">
                        <div>🐄</div>

                        <span>
                          <strong>{log.cow?.name || "Unknown"}</strong>

                          <small>{log.cowId}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="morning-value">
                        🌅 {Number(log.morningMilk).toFixed(1)} L
                      </span>
                    </td>

                    <td>
                      <span className="evening-value">
                        🌙 {Number(log.eveningMilk).toFixed(1)} L
                      </span>
                    </td>

                    <td>
                      <strong className="total-value">
                        {Number(log.totalMilk).toFixed(1)} L
                      </strong>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          title="Edit / बदलें"
                          onClick={() => handleEdit(log)}
                        >
                          ✏️
                        </button>

                        <button
                          title="Delete / हटाएं"
                          onClick={() => handleDelete(log)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= FORM ================= */}

      {showForm && (
        <MilkLogForm
          editingLog={editingLog}
          onClose={closeForm}
          onSuccess={() => {
            closeForm();
            fetchLogs();
          }}
        />
      )}
    </div>
  );
};

export default MilkLogs;

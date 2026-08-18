import React, { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

import "./DailyExpense.css";

const categories = [
  {
    value: "feed",
    label: "चारा",
    english: "Feed",
    icon: "🌾",
  },
  {
    value: "medicine",
    label: "दवाई",
    english: "Medicine",
    icon: "💊",
  },
  {
    value: "labour",
    label: "मजदूरी",
    english: "Labour",
    icon: "👨‍🌾",
  },
  {
    value: "transport",
    label: "यातायात",
    english: "Transport",
    icon: "🚚",
  },
  {
    value: "electricity",
    label: "बिजली",
    english: "Electricity",
    icon: "💡",
  },
  {
    value: "water",
    label: "पानी",
    english: "Water",
    icon: "💧",
  },
  {
    value: "animal",
    label: "पशु खर्च",
    english: "Animal",
    icon: "🐄",
  },
  {
    value: "maintenance",
    label: "मरम्मत",
    english: "Maintenance",
    icon: "🔧",
  },
  {
    value: "other",
    label: "अन्य",
    english: "Other",
    icon: "📦",
  },
];

const paymentMethods = [
  {
    value: "cash",
    label: "नकद",
    english: "Cash",
    icon: "💵",
  },
  {
    value: "upi",
    label: "UPI",
    english: "UPI",
    icon: "📱",
  },
  {
    value: "bank",
    label: "बैंक",
    english: "Bank",
    icon: "🏦",
  },
  {
    value: "credit",
    label: "उधार",
    english: "Credit",
    icon: "📝",
  },
];

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getMonthStart = () => {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getCategory = (value) => {
  return (
    categories.find((item) => item.value === value) ||
    categories[categories.length - 1]
  );
};

const getPaymentMethod = (value) => {
  return (
    paymentMethods.find((item) => item.value === value) || paymentMethods[0]
  );
};

const DailyExpense = () => {
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [filter, setFilter] = useState("today");

  const [startDate, setStartDate] = useState(getToday());

  const [endDate, setEndDate] = useState(getToday());

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [form, setForm] = useState({
    date: getToday(),
    category: "feed",
    amount: "",
    description: "",
    paymentMethod: "cash",
    notes: "",
  });

  // =========================================
  // FETCH EXPENSES
  // =========================================

  const fetchExpenses = async () => {
    try {
      setLoading(true);

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

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      const response = await api.get("/expenses", {
        params,
      });

      setExpenses(response.data?.data || []);
    } catch (error) {
      console.error("Fetch expenses error:", error);

      alert(
        error.response?.data?.message || "खर्च का रिकॉर्ड load नहीं हो पाया",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filter, startDate, endDate, categoryFilter]);

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // TOTAL
  // =========================================

  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0,
    );
  }, [expenses]);

  // =========================================
  // CATEGORY TOTALS
  // =========================================

  const categoryTotals = useMemo(() => {
    const totals = {};

    categories.forEach((category) => {
      totals[category.value] = 0;
    });

    expenses.forEach((expense) => {
      if (totals[expense.category] !== undefined) {
        totals[expense.category] += Number(expense.amount || 0);
      }
    });

    return totals;
  }, [expenses]);

  // =========================================
  // SAVE / UPDATE
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!form.date) {
      alert("कृपया तारीख चुनें");
      return;
    }

    if (!form.category) {
      alert("कृपया खर्च की category चुनें");
      return;
    }

    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      alert("कृपया सही खर्च राशि डालें");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingId) {
        response = await api.put(`/expenses/${editingId}`, {
          ...form,
          amount,
        });
      } else {
        response = await api.post("/expenses", {
          ...form,
          amount,
        });
      }

      if (response.data?.success) {
        alert(
          editingId
            ? "✏️ खर्च सफलतापूर्वक बदल दिया गया"
            : "✅ खर्च सफलतापूर्वक सेव हो गया",
        );

        resetForm();

        fetchExpenses();
      }
    } catch (error) {
      console.error("Save expense error:", error);

      alert(error.response?.data?.message || "खर्च save नहीं हो पाया");
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // RESET
  // =========================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      date: getToday(),
      category: "feed",
      amount: "",
      description: "",
      paymentMethod: "cash",
      notes: "",
    });
  };

  // =========================================
  // EDIT
  // =========================================

  const handleEdit = (expense) => {
    setEditingId(expense._id);

    setForm({
      date: new Date(expense.date).toISOString().split("T")[0],

      category: expense.category || "other",

      amount: expense.amount || "",

      description: expense.description || "",

      paymentMethod: expense.paymentMethod || "cash",

      notes: expense.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async (expense) => {
    const category = getCategory(expense.category);

    const confirmed = window.confirm(
      `क्या आप ${category.label} का ₹${Number(expense.amount).toLocaleString(
        "en-IN",
      )} खर्च delete करना चाहते हैं?`,
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/expenses/${expense._id}`);

      if (response.data?.success) {
        alert("🗑️ खर्च सफलतापूर्वक delete हो गया");

        fetchExpenses();
      }
    } catch (error) {
      console.error("Delete expense error:", error);

      alert(error.response?.data?.message || "खर्च delete नहीं हो पाया");
    }
  };

  return (
    <div className="daily-expense-page">
      {/* ======================================
          HEADER
      ======================================= */}

      <div className="expense-page-header">
        <div>
          <div className="expense-title-row">
            <div className="expense-main-icon">💰</div>

            <div>
              <h1>Daily Expense</h1>

              <p>
                दैनिक खर्च का पूरा हिसाब
                <span>Track your daily dairy expenses</span>
              </p>
            </div>
          </div>
        </div>

        <div className="expense-date-badge">📅 {formatDate(new Date())}</div>
      </div>

      {/* ======================================
          TOTAL EXPENSE
      ======================================= */}

      <div className="expense-total-card">
        <div className="expense-total-left">
          <div className="expense-total-icon">💰</div>

          <div>
            <span>कुल खर्च</span>

            <small>Total Expense</small>
          </div>
        </div>

        <div className="expense-total-amount">
          ₹{totalExpense.toLocaleString("en-IN")}
        </div>
      </div>

      {/* ======================================
          CATEGORY CARDS
      ======================================= */}

      <div className="expense-category-grid">
        {categories.map((category) => (
          <div className="expense-category-card" key={category.value}>
            <div className="category-card-icon">{category.icon}</div>

            <div>
              <strong>
                ₹{(categoryTotals[category.value] || 0).toLocaleString("en-IN")}
              </strong>

              <p>{category.label}</p>

              <small>{category.english}</small>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================
          ADD EXPENSE
      ======================================= */}

      <div className="expense-form-card">
        <div className="expense-section-header">
          <div>
            <h2>{editingId ? "✏️ खर्च बदलें" : "➕ नया खर्च जोड़ें"}</h2>

            <p>{editingId ? "Edit Expense" : "Add New Expense"}</p>
          </div>

          {editingId && (
            <button
              type="button"
              className="expense-cancel-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {/* DATE */}

          <div className="expense-field">
            <label>
              तारीख
              <span>Date</span>
            </label>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          {/* CATEGORY */}

          <div className="expense-field expense-category-field">
            <label>
              खर्च किस चीज़ का है?
              <span>Expense Category</span>
            </label>

            <div className="category-select-grid">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.value}
                  className={`category-select-card ${
                    form.category === category.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      category: category.value,
                    }))
                  }
                >
                  <span>{category.icon}</span>

                  <strong>{category.label}</strong>

                  <small>{category.english}</small>
                </button>
              ))}
            </div>
          </div>

          {/* AMOUNT */}

          <div className="expense-field">
            <label>
              खर्च की राशि
              <span>Amount</span>
            </label>

            <div className="amount-input">
              <span>₹</span>

              <input
                type="number"
                name="amount"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="जैसे 500"
              />
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="expense-field">
            <label>
              किस चीज़ पर खर्च हुआ?
              <span>Description</span>
            </label>

            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="जैसे आज गायों के लिए चारा खरीदा"
            />
          </div>

          {/* PAYMENT METHOD */}

          <div className="expense-field">
            <label>
              भुगतान का तरीका
              <span>Payment Method</span>
            </label>

            <div className="payment-method-grid">
              {paymentMethods.map((method) => (
                <button
                  type="button"
                  key={method.value}
                  className={`payment-method-card ${
                    form.paymentMethod === method.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: method.value,
                    }))
                  }
                >
                  <span>{method.icon}</span>

                  <div>
                    <strong>{method.label}</strong>

                    <small>{method.english}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* NOTES */}

          <div className="expense-field">
            <label>
              टिप्पणी
              <span>Notes</span>
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="कोई अतिरिक्त जानकारी..."
            />
          </div>

          {/* BUTTON */}

          <button type="submit" className="save-expense-btn" disabled={saving}>
            {saving
              ? "⏳ Saving..."
              : editingId
                ? "✏️ खर्च Update करें"
                : "💾 खर्च Save करें"}
          </button>
        </form>
      </div>

      {/* ======================================
          HISTORY
      ======================================= */}

      <div className="expense-history-card">
        <div className="expense-history-header">
          <div>
            <h2>📋 खर्च का इतिहास</h2>

            <p>Expense History</p>
          </div>

          <div className="expense-filter-buttons">
            <button
              className={filter === "today" ? "active" : ""}
              onClick={() => setFilter("today")}
            >
              आज
            </button>

            <button
              className={filter === "month" ? "active" : ""}
              onClick={() => setFilter("month")}
            >
              इस महीने
            </button>

            <button
              className={filter === "custom" ? "active" : ""}
              onClick={() => setFilter("custom")}
            >
              तारीख
            </button>
          </div>
        </div>

        {/* CUSTOM DATE */}

        {filter === "custom" && (
          <div className="expense-custom-filter">
            <div>
              <label>शुरू</label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <span>से</span>

            <div>
              <label>अंत</label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* CATEGORY FILTER */}

        <div className="expense-history-filter">
          <label>Category:</label>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">सभी खर्च / All Categories</option>

            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label} - {category.english}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="expense-loading">
            <div className="loading-icon">💰</div>

            <p>खर्च का रिकॉर्ड load हो रहा है...</p>

            <small>Loading expense records...</small>
          </div>
        ) : expenses.length === 0 ? (
          /* EMPTY */

          <div className="expense-empty">
            <div>💰</div>

            <h3>अभी कोई खर्च नहीं है</h3>

            <p>जब आप खर्च जोड़ेंगे, वह यहाँ दिखाई देगा।</p>

            <small>No expense records found.</small>
          </div>
        ) : (
          /* TABLE */

          <div className="expense-table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>
                    तारीख
                    <small>Date</small>
                  </th>

                  <th>
                    खर्च
                    <small>Category</small>
                  </th>

                  <th>
                    विवरण
                    <small>Description</small>
                  </th>

                  <th>
                    भुगतान
                    <small>Payment</small>
                  </th>

                  <th>
                    राशि
                    <small>Amount</small>
                  </th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => {
                  const category = getCategory(expense.category);

                  const payment = getPaymentMethod(expense.paymentMethod);

                  return (
                    <tr key={expense._id}>
                      <td>
                        <strong>{formatDate(expense.date)}</strong>
                      </td>

                      <td>
                        <div className="table-category">
                          <span>{category.icon}</span>

                          <div>
                            <strong>{category.label}</strong>

                            <small>{category.english}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="table-description">
                          <strong>{expense.description || "-"}</strong>

                          {expense.notes && <small>📝 {expense.notes}</small>}
                        </div>
                      </td>

                      <td>
                        <div className="table-payment">
                          <span>{payment.icon}</span>

                          <div>
                            <strong>{payment.label}</strong>

                            <small>{payment.english}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="table-amount">
                          ₹{Number(expense.amount).toLocaleString("en-IN")}
                        </strong>
                      </td>

                      <td>
                        <div className="expense-actions">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => handleEdit(expense)}
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(expense)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyExpense;

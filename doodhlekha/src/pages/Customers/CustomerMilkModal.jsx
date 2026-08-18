import React, { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

import "./CustomerMilkModal.css";

/* =========================================================
   HELPERS
========================================================= */

const getTodayDate = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

/* =========================================================
   COMPONENT
========================================================= */

const CustomerMilkModal = ({ customer, onClose, onSaved }) => {
  /* =======================================================
     SAFETY
  ======================================================= */

  if (!customer) {
    return null;
  }

  /* =======================================================
     STATE
  ======================================================= */

  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const [todayRecord, setTodayRecord] = useState(null);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: getTodayDate(),

    morningMilk: "",

    eveningMilk: "",

    rate: customer.defaultRate || "",

    notes: "",
  });

  /* =======================================================
     LOAD TODAY RECORD

     अगर आज की entry पहले से है,
     तो modal उसे EDIT mode में दिखाएगा।
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadToday = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await api.get(`/customer-milk/${customer._id}/today`);

        if (!mounted) {
          return;
        }

        const record = response.data?.data || null;

        setTodayRecord(record);

        /* -----------------------------------------------
             EXISTING RECORD
          ------------------------------------------------ */

        if (record) {
          setForm({
            date: record.date
              ? new Date(record.date).toISOString().split("T")[0]
              : getTodayDate(),

            morningMilk: record.morningMilk ?? "",

            eveningMilk: record.eveningMilk ?? "",

            rate: record.rate ?? customer.defaultRate ?? "",

            notes: record.notes || "",
          });

          return;
        }

        /* -----------------------------------------------
             NEW RECORD
          ------------------------------------------------ */

        setForm({
          date: getTodayDate(),

          morningMilk: "",

          eveningMilk: "",

          rate: customer.defaultRate || "",

          notes: "",
        });
      } catch (requestError) {
        console.error("Customer Milk Load Error:", requestError);

        if (!mounted) {
          return;
        }

        setError(
          requestError?.response?.data?.message ||
            "आज की milk entry load नहीं हो पाई।",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadToday();

    return () => {
      mounted = false;
    };
  }, [customer._id, customer.defaultRate]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setError("");

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     CALCULATIONS

     केवल milk related calculation।
     
     Payment calculation यहाँ नहीं होगी।
  ======================================================= */

  const calculation = useMemo(() => {
    const morning = Number(form.morningMilk) || 0;

    const evening = Number(form.eveningMilk) || 0;

    const rate = Number(form.rate) || 0;

    const totalMilk = morning + evening;

    const amount = totalMilk * rate;

    return {
      morning,
      evening,
      rate,
      totalMilk,
      amount,
    };
  }, [form.morningMilk, form.eveningMilk, form.rate]);

  /* =======================================================
     SUBMIT

     POST /customer-milk/:customerId

     IMPORTANT:
     यहाँ paidAmount नहीं भेजा जाएगा।
     
     यहाँ केवल:
     date
     morningMilk
     eveningMilk
     rate
     notes
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    /* -----------------------------------------------
         DATE
      ------------------------------------------------ */

    if (!form.date) {
      setError("कृपया तारीख चुनें।");

      return;
    }

    /* -----------------------------------------------
         MILK
      ------------------------------------------------ */

    if (calculation.morning < 0 || calculation.evening < 0) {
      setError("Milk quantity negative नहीं हो सकती।");

      return;
    }

    if (calculation.totalMilk <= 0) {
      setError("कम से कम Morning या Evening milk डालें।");

      return;
    }

    /* -----------------------------------------------
         RATE
      ------------------------------------------------ */

    if (!calculation.rate || calculation.rate <= 0) {
      setError("कृपया milk rate डालें।");

      return;
    }

    try {
      setSaving(true);

      const response = await api.post(`/customer-milk/${customer._id}`, {
        date: form.date,

        morningMilk: calculation.morning,

        eveningMilk: calculation.evening,

        rate: calculation.rate,

        notes: form.notes.trim(),
      });

      /* -----------------------------------------------
           SUCCESS
        ------------------------------------------------ */

      if (response.data?.success) {
        if (onSaved) {
          await onSaved(response.data);
        }

        return;
      }

      setError(response.data?.message || "Milk save नहीं हो पाया।");
    } catch (requestError) {
      console.error("Save Customer Milk Error:", requestError);

      setError(
        requestError?.response?.data?.message || "Milk save नहीं हो पाया।",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     MODAL CLOSE
  ======================================================= */

  const handleClose = () => {
    if (saving) {
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="customer-milk-modal-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="customer-milk-modal loading-modal">
          <div className="milk-loading-spinner" />

          <h3>Milk entry load हो रही है...</h3>

          <p>कृपया थोड़ा इंतजार करें</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="customer-milk-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="customer-milk-modal">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-milk-modal-header">
          <div className="customer-milk-modal-title">
            <div className="milk-modal-icon">🥛</div>

            <div>
              <span>{todayRecord ? "UPDATE MILK" : "NEW MILK ENTRY"}</span>

              <h2>आज का दूध</h2>

              <p>{customer.name || "Customer"}</p>
            </div>
          </div>

          <button
            type="button"
            className="milk-modal-close"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* =================================================
            CUSTOMER INFO
        ================================================= */}

        <div className="milk-customer-info">
          <div className="milk-customer-avatar">
            {(customer.name || "C").charAt(0).toUpperCase()}
          </div>

          <div className="milk-customer-text">
            <strong>{customer.name || "Customer"}</strong>

            <span>{customer.customerCode || "No Code"}</span>
          </div>

          <div className="milk-customer-type">
            <span>
              {customer.milkType === "buffalo"
                ? "🐃"
                : customer.milkType === "mixed"
                  ? "🥛"
                  : "🐄"}
            </span>

            <small>
              {customer.milkType === "buffalo"
                ? "भैंस"
                : customer.milkType === "mixed"
                  ? "मिक्स"
                  : "गाय"}
            </small>
          </div>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit} className="customer-milk-form">
          {/* ===============================================
              DATE
          ================================================ */}

          <div className="milk-form-group">
            <label>
              Date
              <span>तारीख</span>
            </label>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          {/* ===============================================
              MORNING / EVENING
          ================================================ */}

          <div className="milk-entry-grid">
            {/* MORNING */}

            <div className="milk-entry-box morning-box">
              <div className="milk-entry-label">
                <span>🌅</span>

                <div>
                  <strong>Morning</strong>

                  <small>सुबह</small>
                </div>
              </div>

              <div className="milk-number-input">
                <input
                  type="number"
                  name="morningMilk"
                  min="0"
                  step="0.01"
                  value={form.morningMilk}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="0"
                />

                <span>L</span>
              </div>
            </div>

            {/* EVENING */}

            <div className="milk-entry-box evening-box">
              <div className="milk-entry-label">
                <span>🌙</span>

                <div>
                  <strong>Evening</strong>

                  <small>शाम</small>
                </div>
              </div>

              <div className="milk-number-input">
                <input
                  type="number"
                  name="eveningMilk"
                  min="0"
                  step="0.01"
                  value={form.eveningMilk}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="0"
                />

                <span>L</span>
              </div>
            </div>
          </div>

          {/* ===============================================
              RATE
          ================================================ */}

          <div className="milk-form-group">
            <label>
              Milk Rate
              <span>दूध का रेट / Liter</span>
            </label>

            <div className="milk-money-input">
              <span>₹</span>

              <input
                type="number"
                name="rate"
                min="0.01"
                step="0.01"
                value={form.rate}
                onChange={handleChange}
                disabled={saving}
                placeholder="Milk rate"
                required
              />

              <span>/ L</span>
            </div>
          </div>

          {/* ===============================================
              LIVE CALCULATION
          ================================================ */}

          <div className="milk-calculation-card">
            <div className="milk-calculation-item">
              <span>Morning</span>

              <strong>{formatNumber(calculation.morning)} L</strong>
            </div>

            <div className="milk-calculation-plus">+</div>

            <div className="milk-calculation-item">
              <span>Evening</span>

              <strong>{formatNumber(calculation.evening)} L</strong>
            </div>

            <div className="milk-calculation-equal">=</div>

            <div className="milk-calculation-item total">
              <span>Total</span>

              <strong>{formatNumber(calculation.totalMilk)} L</strong>
            </div>

            <div className="milk-calculation-divider" />

            <div className="milk-calculation-amount">
              <span>Total Amount</span>

              <strong>₹{formatNumber(calculation.amount)}</strong>
            </div>
          </div>

          {/* ===============================================
              NOTE
          ================================================ */}

          <div className="milk-form-group">
            <label>
              Notes
              <span>टिप्पणी</span>
            </label>

            <textarea
              name="notes"
              rows="3"
              value={form.notes}
              onChange={handleChange}
              disabled={saving}
              placeholder="कोई जानकारी लिखें..."
            />
          </div>

          {/* ===============================================
              ERROR
          ================================================ */}

          {error && (
            <div className="milk-form-error">
              <div>!</div>

              <span>{error}</span>
            </div>
          )}

          {/* ===============================================
              PAYMENT NOTE

              सिर्फ जानकारी।
              यहाँ payment input नहीं है।
          ================================================ */}

          <div className="milk-payment-info">
            <div className="milk-payment-info-icon">💳</div>

            <div>
              <strong>Payment अलग से दर्ज होगा</strong>

              <p>
                Milk save करने के बाद Customer Details में
                <b> Add Payment </b>
                से payment दर्ज करें।
              </p>
            </div>
          </div>

          {/* ===============================================
              ACTIONS
          ================================================ */}

          <div className="customer-milk-modal-actions">
            <button
              type="button"
              className="milk-modal-cancel-btn"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="milk-modal-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="milk-button-spinner" />
                  Saving...
                </>
              ) : (
                <>✓ {todayRecord ? "Milk Update करें" : "Milk Save करें"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerMilkModal;

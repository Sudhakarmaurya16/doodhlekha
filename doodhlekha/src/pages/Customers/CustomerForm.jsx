import React, { useState } from "react";
import api from "../../services/api";
import "./CustomerForm.css";
const CustomerForm = ({ onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    address: "",
    village: "",
    customerType: "home",
    milkType: "cow",
    defaultRate: "",
    joiningDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // ==========================================
  // CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("कृपया customer का नाम डालें");
      return;
    }

    if (!form.phone.trim()) {
      alert("कृपया mobile number डालें");
      return;
    }

    if (form.phone.length !== 10) {
      alert("Mobile number 10 digit का होना चाहिए");
      return;
    }

    if (form.defaultRate && Number(form.defaultRate) < 0) {
      alert("Rate सही डालें");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/customers", {
        ...form,
        defaultRate: Number(form.defaultRate) || 0,
      });

      if (response.data?.success) {
        alert("✅ Customer successfully add हो गया");

        onSaved();
      }
    } catch (error) {
      console.error("Create Customer Error:", error);

      alert(error.response?.data?.message || "Customer add नहीं हो पाया");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="customer-modal-overlay">
      <div className="customer-modal">
        {/* HEADER */}

        <div className="customer-modal-header">
          <div>
            <h2>➕ नया ग्राहक</h2>

            <p>Add New Customer</p>
          </div>

          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        {/* FORM */}

        <form className="customer-form" onSubmit={handleSubmit}>
          {/* NAME */}

          <div className="customer-form-field">
            <label>
              ग्राहक का नाम
              <span>Customer Name *</span>
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="जैसे रामेश यादव"
            />
          </div>

          {/* PHONE */}

          <div className="customer-form-field">
            <label>
              मोबाइल नंबर
              <span>Mobile Number *</span>
            </label>

            <input
              type="tel"
              name="phone"
              maxLength="10"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
            />
          </div>

          {/* ALTERNATE */}

          <div className="customer-form-field">
            <label>
              दूसरा मोबाइल
              <span>Alternate Mobile</span>
            </label>

            <input
              type="tel"
              name="alternatePhone"
              maxLength="10"
              value={form.alternatePhone}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          {/* VILLAGE */}

          <div className="customer-form-field">
            <label>
              गांव
              <span>Village</span>
            </label>

            <input
              name="village"
              value={form.village}
              onChange={handleChange}
              placeholder="गांव का नाम"
            />
          </div>

          {/* ADDRESS */}

          <div className="customer-form-field full">
            <label>
              पता
              <span>Address</span>
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="2"
              placeholder="पूरा पता"
            />
          </div>

          {/* CUSTOMER TYPE */}

          <div className="customer-form-field">
            <label>
              ग्राहक किस प्रकार का है?
              <span>Customer Type</span>
            </label>

            <select
              name="customerType"
              value={form.customerType}
              onChange={handleChange}
            >
              <option value="home">🏠 घर / Home</option>

              <option value="shop">🏪 दुकान / Shop</option>

              <option value="hotel">🏨 होटल / Hotel</option>

              <option value="restaurant">🍽️ Restaurant</option>

              <option value="other">📦 अन्य / Other</option>
            </select>
          </div>

          {/* MILK TYPE */}

          <div className="customer-form-field">
            <label>
              दूध का प्रकार
              <span>Milk Type</span>
            </label>

            <select
              name="milkType"
              value={form.milkType}
              onChange={handleChange}
            >
              <option value="cow">🐄 गाय / Cow</option>

              <option value="buffalo">🐃 भैंस / Buffalo</option>

              <option value="mixed">🥛 मिक्स / Mixed</option>
            </select>
          </div>

          {/* RATE */}

          <div className="customer-form-field">
            <label>
              दूध का Rate
              <span>Default Rate / Liter</span>
            </label>

            <div className="form-rate-input">
              <span>₹</span>

              <input
                type="number"
                name="defaultRate"
                min="0"
                step="0.01"
                value={form.defaultRate}
                onChange={handleChange}
                placeholder="55"
              />

              <small>/ L</small>
            </div>
          </div>

          {/* JOINING DATE */}

          <div className="customer-form-field">
            <label>
              ग्राहक बनने की तारीख
              <span>Joining Date</span>
            </label>

            <input
              type="date"
              name="joiningDate"
              value={form.joiningDate}
              onChange={handleChange}
            />
          </div>

          {/* NOTES */}

          <div className="customer-form-field full">
            <label>
              टिप्पणी
              <span>Notes</span>
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="2"
              placeholder="कोई अतिरिक्त जानकारी..."
            />
          </div>

          {/* BUTTONS */}

          <div className="customer-form-actions">
            <button
              type="button"
              className="customer-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="customer-save-btn"
              disabled={saving}
            >
              {saving ? "⏳ Saving..." : "💾 ग्राहक Save करें"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;

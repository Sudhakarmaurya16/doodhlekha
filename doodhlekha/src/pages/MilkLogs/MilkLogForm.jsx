import React, { useEffect, useState } from "react";

import api from "../../services/api";

import "./MilkLogForm.css";

const formatDateForInput = (date) => {
  if (!date) return "";

  return new Date(date).toISOString().split("T")[0];
};

const MilkLogForm = ({ onClose, onSuccess, editingLog }) => {
  const [cows, setCows] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    cow: "",
    date: new Date().toISOString().split("T")[0],
    morningMilk: "",
    eveningMilk: "",
    notes: "",
  });

  useEffect(() => {
    fetchCows();
  }, []);

  useEffect(() => {
    if (editingLog) {
      setFormData({
        cow: editingLog.cow?._id || editingLog.cow || "",

        date: formatDateForInput(editingLog.date),

        morningMilk: editingLog.morningMilk ?? "",

        eveningMilk: editingLog.eveningMilk ?? "",

        notes: editingLog.notes || "",
      });
    }
  }, [editingLog]);

  const fetchCows = async () => {
    try {
      const response = await api.get("/cows");

      setCows(response.data.data || []);
    } catch (error) {
      console.error("Fetch cows error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const totalMilk =
    (Number(formData.morningMilk) || 0) + (Number(formData.eveningMilk) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cow) {
      alert("कृपया गाय चुनें / Please select cow");
      return;
    }

    if (!formData.morningMilk && !formData.eveningMilk) {
      alert("कृपया Morning या Evening दूध की मात्रा डालें");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingLog) {
        response = await api.put(`/milk-logs/${editingLog._id}`, {
          morningMilk: formData.morningMilk,

          eveningMilk: formData.eveningMilk,

          notes: formData.notes,
        });
      } else {
        response = await api.post("/milk-logs", formData);
      }

      if (response.data.success) {
        alert(
          editingLog
            ? "✏️ Milk entry update हो गई"
            : "🥛 दूध की जानकारी सेव हो गई",
        );

        onSuccess();
      }
    } catch (error) {
      console.error("Milk save error:", error);

      alert(error.response?.data?.message || "Milk entry save नहीं हो पाई");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="milk-modal-overlay">
      <div className="milk-modal">
        <div className="milk-modal-header">
          <div>
            <h2>
              {editingLog ? "✏️ दूध रिकॉर्ड बदलें" : "🥛 आज का दूध दर्ज करें"}
            </h2>

            <p>{editingLog ? "Edit Milk Entry" : "Add Today's Milk Entry"}</p>
          </div>

          <button className="milk-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="milk-form-section">
            <div className="milk-field">
              <label>
                गाय चुनें
                <span> / Select Cow *</span>
              </label>

              <select
                name="cow"
                value={formData.cow}
                onChange={handleChange}
                disabled={loading || !!editingLog}
              >
                <option value="">गाय चुनें / Select Cow</option>

                {cows.map((cow) => (
                  <option key={cow._id} value={cow._id}>
                    {cow.name} — {cow.cowId}
                  </option>
                ))}
              </select>
            </div>

            <div className="milk-field">
              <label>
                तारीख
                <span> / Date *</span>
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={!!editingLog}
              />
            </div>
          </div>

          <div className="milk-session-box">
            <div className="session-heading">🌅 Morning / सुबह</div>

            <div className="milk-input-wrapper">
              <input
                type="number"
                min="0"
                step="0.1"
                name="morningMilk"
                value={formData.morningMilk}
                onChange={handleChange}
                placeholder="0"
              />

              <span>Liter / लीटर</span>
            </div>

            <small>सुबह गाय ने कितना दूध दिया?</small>
          </div>

          <div className="milk-session-box evening">
            <div className="session-heading">🌙 Evening / शाम</div>

            <div className="milk-input-wrapper">
              <input
                type="number"
                min="0"
                step="0.1"
                name="eveningMilk"
                value={formData.eveningMilk}
                onChange={handleChange}
                placeholder="0"
              />

              <span>Liter / लीटर</span>
            </div>

            <small>शाम गाय ने कितना दूध दिया?</small>
          </div>

          <div className="milk-total-box">
            <div>
              <span>आज का कुल दूध</span>

              <small>Total Milk</small>
            </div>

            <strong>
              {totalMilk.toFixed(1)}
              <small> L</small>
            </strong>
          </div>

          <div className="milk-field notes-field">
            <label>
              टिप्पणी
              <span> / Notes</span>
            </label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="जैसे: आज दूध कम था..."
            />
          </div>

          <div className="milk-form-actions">
            <button type="button" className="milk-cancel-btn" onClick={onClose}>
              Cancel / रद्द करें
            </button>

            <button type="submit" className="milk-save-btn" disabled={saving}>
              {saving
                ? "Saving..."
                : editingLog
                  ? "✏️ Update / बदलें"
                  : "🥛 Save Milk / दूध सेव करें"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilkLogForm;

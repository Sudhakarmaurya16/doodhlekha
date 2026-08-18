import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CowForm from "./CowForm";
import "./CowEntry.css";

const CowEntry = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cows, setCows] = useState([]);

  // =========================================================
  // FETCH COWS
  // =========================================================

  const fetchCows = async () => {
    try {
      setLoading(true);

      const response = await api.get("/cows");

      if (response.data?.success) {
        setCows(response.data.data || []);
      } else {
        setCows([]);
      }
    } catch (error) {
      console.error("Fetch cows error:", error);

      const message =
        error?.response?.data?.message ||
        "गायों की जानकारी लाने में समस्या हुई";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD ON PAGE
  // =========================================================

  useEffect(() => {
    fetchCows();
  }, []);

  // =========================================================
  // ADD COW
  // =========================================================

  const handleAddCow = async (cowData) => {
    try {
      setSaving(true);

      console.log("ADD COW PAYLOAD:", cowData);

      const response = await api.post("/cows", cowData);

      console.log("ADD COW RESPONSE:", response.data);

      if (response.data?.success) {
        setCows((prev) => [response.data.data, ...prev]);

        setShowForm(false);

        alert("गाय सफलतापूर्वक जोड़ दी गई 🐄\nCow added successfully");

        return;
      }

      alert(response.data?.message || "गाय जोड़ने में समस्या हुई");
    } catch (error) {
      console.error("Add cow error:", error);

      console.error("Backend response:", error?.response?.data);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "गाय जोड़ने में समस्या हुई";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalCows = cows.length;

  const milkingCows = cows.filter((cow) => cow.status === "milking").length;

  const nonMilkingCows = cows.filter(
    (cow) => cow.status === "non-milking",
  ).length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="cow-page">
        <div className="empty-cow">
          <div className="empty-cow-icon">🐄</div>

          <h3>गायों की जानकारी लोड हो रही है...</h3>

          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="cow-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="cow-page-header">
        <div>
          <h2>🐄 Cow Entry / गाय की जानकारी</h2>

          <p>
            अपनी सभी गायों की जानकारी यहां आसानी से रखें
            <br />
            <span>Manage your cows and dairy information easily</span>
          </p>
        </div>

        <button
          type="button"
          className="add-cow-btn"
          onClick={() => setShowForm(true)}
          disabled={saving}
        >
          <span>＋</span>
          नई गाय जोड़ें
          <small>Add New Cow</small>
        </button>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="cow-summary">
        <div className="cow-summary-card">
          <div className="summary-icon">🐄</div>

          <div>
            <span>Total Cows</span>

            <h3>{totalCows}</h3>

            <small>कुल गाय</small>
          </div>
        </div>

        <div className="cow-summary-card">
          <div className="summary-icon">🥛</div>

          <div>
            <span>Milking Cows</span>

            <h3>{milkingCows}</h3>

            <small>दूध देने वाली गाय</small>
          </div>
        </div>

        <div className="cow-summary-card">
          <div className="summary-icon">🌱</div>

          <div>
            <span>Non-Milking</span>

            <h3>{nonMilkingCows}</h3>

            <small>दूध नहीं देने वाली</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          COW LIST
      ===================================================== */}

      <div className="cow-list-section">
        <div className="section-heading">
          <div>
            <h3>मेरी गायें / My Cows</h3>

            <p>आपकी सभी गायों की जानकारी</p>
          </div>

          {cows.length > 0 && (
            <span className="cow-count">{cows.length} Cows</span>
          )}
        </div>

        {/* ===================================================
            EMPTY
        =================================================== */}

        {cows.length === 0 ? (
          <div className="empty-cow">
            <div className="empty-cow-icon">🐄</div>

            <h3>अभी कोई गाय नहीं जोड़ी गई</h3>

            <p>
              अपनी पहली गाय की जानकारी जोड़ें
              <br />
              Add your first cow to get started
            </p>

            <button
              type="button"
              className="empty-add-btn"
              onClick={() => setShowForm(true)}
            >
              ＋ नई गाय जोड़ें
            </button>
          </div>
        ) : (
          /* =================================================
             LIST
          ================================================= */

          <div className="cow-grid">
            {cows.map((cow) => (
              <div className="cow-card" key={cow._id}>
                <div className="cow-card-top">
                  <div className="cow-image">🐄</div>

                  <span className={`cow-status ${cow.status}`}>
                    {cow.status === "milking"
                      ? "दूध दे रही है"
                      : "दूध नहीं दे रही"}
                  </span>
                </div>

                <div className="cow-card-body">
                  <h3>{cow.name || "बिना नाम की गाय"}</h3>

                  <span className="cow-number">{cow.cowId}</span>

                  <div className="cow-details">
                    <div>
                      <span>नस्ल / Breed</span>

                      <strong>{cow.breed || "-"}</strong>
                    </div>

                    <div>
                      <span>औसत दूध / Milk</span>

                      <strong>{cow.milkCapacity || 0} L/day</strong>
                    </div>

                    <div>
                      <span>खरीद मूल्य / Price</span>

                      <strong>₹{cow.purchasePrice || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="cow-card-footer">
                  <button type="button">✏️ Edit / बदलें</button>

                  <button type="button">👁️ View / देखें</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          FORM MODAL
      ===================================================== */}

      {showForm && (
        <CowForm
          onClose={() => setShowForm(false)}
          onSubmit={handleAddCow}
          loading={saving}
        />
      )}
    </div>
  );
};

export default CowEntry;

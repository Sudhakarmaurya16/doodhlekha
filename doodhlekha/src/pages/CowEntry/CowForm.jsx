import React, { useState } from "react";
import "./CowForm.css";

const CowForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    gender: "female",
    dob: "",
    purchaseDate: "",
    purchasePrice: "",
    milkCapacity: "",
    status: "milking",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("कृपया गाय का नाम डालें / Please enter cow name");
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="cow-modal-overlay">
      <div className="cow-modal">
        {/* Header */}

        <div className="cow-modal-header">
          <div>
            <h2>🐄 नई गाय जोड़ें</h2>

            <p>Add New Cow / गाय की जानकारी भरें</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}

          <div className="form-section">
            <div className="form-section-title">
              <span>1</span>

              <div>
                <h3>मूल जानकारी</h3>
                <p>Basic Information</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  गाय का नाम
                  <span> / Cow Name *</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="जैसे - गंगा"
                />

                <small>गाय को पहचानने के लिए नाम डालें</small>
              </div>

              <div className="form-group">
                <label>
                  नस्ल
                  <span> / Breed</span>
                </label>

                <select
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                >
                  <option value="">नस्ल चुनें / Select Breed</option>

                  <option value="Gir">गिर / Gir</option>

                  <option value="Sahiwal">साहीवाल / Sahiwal</option>

                  <option value="Red Sindhi">रेड सिंधी / Red Sindhi</option>

                  <option value="Jersey">जर्सी / Jersey</option>

                  <option value="HF">होल्सटीन फ्रिजियन / HF</option>

                  <option value="Tharparkar">थारपारकर / Tharparkar</option>

                  <option value="Other">अन्य / Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  लिंग
                  <span> / Gender</span>
                </label>

                <div className="gender-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleChange}
                    />

                    <span>🐄 Female / मादा</span>
                  </label>

                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleChange}
                    />

                    <span>🐂 Male / नर</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>
                  जन्म तारीख
                  <span> / Date of Birth</span>
                </label>

                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Purchase Information */}

          <div className="form-section">
            <div className="form-section-title">
              <span>2</span>

              <div>
                <h3>खरीद की जानकारी</h3>
                <p>Purchase Information</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  खरीदने की तारीख
                  <span> / Purchase Date</span>
                </label>

                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  खरीद मूल्य
                  <span> / Purchase Price</span>
                </label>

                <div className="input-with-prefix">
                  <span>₹</span>

                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    placeholder="जैसे - 75000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Milk Information */}

          <div className="form-section">
            <div className="form-section-title">
              <span>3</span>

              <div>
                <h3>दूध की जानकारी</h3>
                <p>Milk Information</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  औसत दूध
                  <span> / Average Milk Per Day</span>
                </label>

                <div className="input-with-suffix">
                  <input
                    type="number"
                    step="0.1"
                    name="milkCapacity"
                    value={formData.milkCapacity}
                    onChange={handleChange}
                    placeholder="जैसे - 8.5"
                  />

                  <span>Liter</span>
                </div>

                <small>एक दिन में लगभग कितना दूध देती है?</small>
              </div>

              <div className="form-group">
                <label>
                  वर्तमान स्थिति
                  <span> / Current Status</span>
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="milking">🥛 दूध दे रही है / Milking</option>

                  <option value="non-milking">
                    🌱 दूध नहीं दे रही / Non-Milking
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}

          <div className="form-section">
            <div className="form-section-title">
              <span>4</span>

              <div>
                <h3>अन्य जानकारी</h3>
                <p>Additional Information</p>
              </div>
            </div>

            <div className="form-group">
              <label>
                अतिरिक्त जानकारी
                <span> / Notes</span>
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="कोई अतिरिक्त जानकारी लिखें..."
              />
            </div>
          </div>

          {/* Footer */}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel / रद्द करें
            </button>

            <button type="submit" className="save-cow-btn">
              💾 Save Cow / गाय सेव करें
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CowForm;

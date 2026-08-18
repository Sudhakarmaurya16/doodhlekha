import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name) {
      setError("कृपया अपना नाम दर्ज करें।");
      return;
    }

    if (!phone) {
      setError("कृपया मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("मोबाइल नंबर 10 अंकों का होना चाहिए।");
      return;
    }

    if (!email) {
      setError("कृपया ईमेल दर्ज करें।");
      return;
    }

    if (!password) {
      setError("कृपया पासवर्ड दर्ज करें।");
      return;
    }

    if (password.length < 6) {
      setError("पासवर्ड कम से कम 6 characters का होना चाहिए।");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password और Confirm Password समान नहीं हैं।");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register({
        name,
        phone,
        email,
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Registration Error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed. कृपया फिर कोशिश करें।",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      {/* Background Decoration */}
      <div className="auth-bg-circle circle-one"></div>
      <div className="auth-bg-circle circle-two"></div>

      <div className="auth-container">
        {/* LEFT BRAND PANEL */}
        <div className="auth-brand-panel">
          <div className="brand-logo">
            <div className="brand-logo-icon">🥛</div>

            <div>
              <h1>DOODHLEKHA</h1>
              <span>Dairy Management</span>
            </div>
          </div>

          <div className="brand-content">
            <div className="brand-emoji">👨‍🌾</div>

            <h2>
              अपनी डेयरी का
              <br />
              <span>पूरा हिसाब</span> रखें
            </h2>

            <p>
              दूध, गाय, ग्राहक, बिक्री, खर्च और पेमेंट —
              <br />
              सब कुछ एक ही जगह।
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span>✓</span>
                <div>
                  <strong>अपना अलग Data</strong>
                  <small>हर Farmer का data सुरक्षित</small>
                </div>
              </div>

              <div className="feature-item">
                <span>✓</span>
                <div>
                  <strong>दूध का पूरा हिसाब</strong>
                  <small>Morning और Evening records</small>
                </div>
              </div>

              <div className="feature-item">
                <span>✓</span>
                <div>
                  <strong>Customer Management</strong>
                  <small>ग्राहक और payment का हिसाब</small>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            © {new Date().getFullYear()} DOODHLEKHA
          </div>
        </div>

        {/* REGISTER FORM */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="mobile-brand">
              <div className="mobile-brand-icon">🥛</div>
              <div>
                <strong>DOODHLEKHA</strong>
                <small>Dairy Management</small>
              </div>
            </div>

            <div className="auth-heading">
              <span className="heading-icon">🌱</span>

              <div>
                <h2>Account बनाएं</h2>
                <p>अपनी डेयरी शुरू करने के लिए Registration करें</p>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* NAME */}
              <div className="form-group">
                <label htmlFor="name">
                  Farmer Name <span>*</span>
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">👨‍🌾</span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="अपना नाम लिखें"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div className="form-group">
                <label htmlFor="phone">
                  Mobile Number <span>*</span>
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">📱</span>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="10 अंकों का मोबाइल नंबर"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="email">
                  Email <span>*</span>
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label htmlFor="password">
                  Password <span>*</span>
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">🔐</span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="कम से कम 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span>*</span>
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Password दोबारा लिखें"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* TERMS */}
              <label className="terms-row">
                <input type="checkbox" required />

                <span>
                  मैं <b>DOODHLEKHA</b> की Terms & Privacy Policy से सहमत हूँ।
                </span>
              </label>

              {/* SUBMIT */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Account बनाया जा रहा है...
                  </>
                ) : (
                  <>
                    🚀
                    <span>Register करें / खाता बनाएं</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="login-link">
              Login करें
              <span>→</span>
            </Link>

            <p className="secure-note">
              🔒 आपका account और dairy data सुरक्षित रहेगा।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

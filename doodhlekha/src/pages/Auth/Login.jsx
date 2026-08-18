import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./Login.css";

// ============================================================
// LOGIN COMPONENT
// ============================================================

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });

  // ==========================================================
  // UI STATES
  // ==========================================================

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [loginType, setLoginType] = useState("email");

  const [error, setError] = useState("");

  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

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

  // ==========================================================
  // SWITCH LOGIN TYPE
  // ==========================================================

  const handleLoginTypeChange = (type) => {
    setLoginType(type);

    setError("");

    setFormData((prev) => ({
      ...prev,

      email: "",
      phone: "",
    }));
  };

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ========================================================
    // EMAIL LOGIN
    // ========================================================

    if (loginType === "email") {
      const email = formData.email.trim().toLowerCase();

      const password = formData.password;

      // ------------------------------------------------------
      // EMAIL VALIDATION
      // ------------------------------------------------------

      if (!email) {
        setError("कृपया email दर्ज करें।");

        return;
      }

      // ------------------------------------------------------
      // EMAIL FORMAT
      // ------------------------------------------------------

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        setError("कृपया valid email address दर्ज करें।");

        return;
      }

      // ------------------------------------------------------
      // PASSWORD
      // ------------------------------------------------------

      if (!password) {
        setError("कृपया password दर्ज करें।");

        return;
      }

      // ------------------------------------------------------
      // LOGIN
      // ------------------------------------------------------

      try {
        setLoading(true);

        await login({
          email,
          password,
        });

        // ----------------------------------------------------
        // DASHBOARD
        // ----------------------------------------------------

        navigate("/dashboard", {
          replace: true,
        });
      } catch (err) {
        console.error("Login Error:", err?.response?.data || err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Login failed. Email या password check करें।",
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // ========================================================
    // PHONE LOGIN
    // ========================================================

    const phone = String(formData.phone || "").trim();

    const password = formData.password;

    // --------------------------------------------------------
    // PHONE VALIDATION
    // --------------------------------------------------------

    if (!phone) {
      setError("कृपया mobile number दर्ज करें।");

      return;
    }

    // --------------------------------------------------------
    // PHONE FORMAT
    // --------------------------------------------------------

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setError("कृपया valid 10 digit mobile number दर्ज करें।");

      return;
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    if (!password) {
      setError("कृपया password दर्ज करें।");

      return;
    }

    // --------------------------------------------------------
    // LOGIN
    // --------------------------------------------------------

    try {
      setLoading(true);

      await login({
        phone,
        password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Login Error:", err?.response?.data || err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed. Mobile number या password check करें।",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="login-page">
      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="login-bg-circle login-circle-one"></div>

      <div className="login-bg-circle login-circle-two"></div>

      {/* ======================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="login-container">
        {/* ====================================================
            LEFT BRAND PANEL
        ==================================================== */}

        <div className="login-brand-panel">
          <div className="login-brand-logo">
            <div className="login-brand-icon">🥛</div>

            <div>
              <h1>DOODHLEKHA</h1>

              <span>Dairy Management</span>
            </div>
          </div>

          {/* --------------------------------------------------
              BRAND CONTENT
          -------------------------------------------------- */}

          <div className="login-brand-content">
            <div className="login-farmer-icon">👨‍🌾</div>

            <h2>
              नमस्ते Farmer
              <br />
              <span>आपका स्वागत है!</span>
            </h2>

            <p>
              अपनी डेयरी का पूरा हिसाब
              <br />
              एक ही जगह आसानी से manage करें।
            </p>

            {/* ------------------------------------------------
                FEATURES
            ------------------------------------------------ */}

            <div className="login-stat-list">
              <div>
                <span>🥛</span>

                <strong>Milk Records</strong>

                <small>दूध का रिकॉर्ड</small>
              </div>

              <div>
                <span>👥</span>

                <strong>Customers</strong>

                <small>ग्राहक प्रबंधन</small>
              </div>

              <div>
                <span>📊</span>

                <strong>Smart Reports</strong>

                <small>पूरा डेयरी हिसाब</small>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------
              FOOTER
          -------------------------------------------------- */}

          <div className="login-brand-footer">
            Secure • Simple • Smart Dairy Management
          </div>
        </div>

        {/* ====================================================
            RIGHT FORM PANEL
        ==================================================== */}

        <div className="login-form-panel">
          <div className="login-form-wrapper">
            {/* ==================================================
                MOBILE BRAND
            ================================================== */}

            <div className="login-mobile-brand">
              <div>🥛</div>

              <section>
                <strong>DOODHLEKHA</strong>

                <small>Dairy Management</small>
              </section>
            </div>

            {/* ==================================================
                HEADING
            ================================================== */}

            <div className="login-heading">
              <div className="login-heading-icon">👋</div>

              <div>
                <h2>Welcome Back!</h2>

                <p>अपने Dairy Account में Login करें</p>
              </div>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="login-error">
                <span>⚠️</span>

                <p>{error}</p>
              </div>
            )}

            {/* ==================================================
                LOGIN TYPE
            ================================================== */}

            <div className="login-type-switch">
              <button
                type="button"
                className={loginType === "email" ? "active" : ""}
                onClick={() => handleLoginTypeChange("email")}
              >
                ✉️ Email
              </button>

              <button
                type="button"
                className={loginType === "phone" ? "active" : ""}
                onClick={() => handleLoginTypeChange("phone")}
              >
                📱 Mobile
              </button>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form onSubmit={handleSubmit} className="login-form">
              {/* =================================================
                  EMAIL
              ================================================= */}

              {loginType === "email" && (
                <div className="login-form-group">
                  <label htmlFor="login-email">
                    Email <span>*</span>
                  </label>

                  <div className="login-input">
                    <span>✉️</span>

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                </div>
              )}

              {/* =================================================
                  PHONE
              ================================================= */}

              {loginType === "phone" && (
                <div className="login-form-group">
                  <label htmlFor="login-phone">
                    Mobile Number <span>*</span>
                  </label>

                  <div className="login-input">
                    <span>📱</span>

                    <input
                      id="login-phone"
                      type="tel"
                      name="phone"
                      placeholder="10 digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              )}

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="login-form-group">
                <div className="password-label-row">
                  <label htmlFor="login-password">
                    Password <span>*</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-btn"
                    onClick={() =>
                      alert("Password reset feature next step में जोड़ेंगे।")
                    }
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="login-input">
                  <span>🔐</span>

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="अपना password दर्ज करें"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* =================================================
                  REMEMBER
              ================================================= */}

              <label className="remember-row">
                <input type="checkbox" />

                <span>मुझे याद रखें</span>
              </label>

              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Login हो रहा है...
                  </>
                ) : (
                  <>
                    🔐
                    <span>Login करें / प्रवेश करें</span>
                  </>
                )}
              </button>
            </form>

            {/* ==================================================
                REGISTER
            ================================================== */}

            <div className="login-divider">
              <span>नया account है?</span>
            </div>

            <Link to="/register" className="register-link">
              🌱 नया Farmer Account बनाएं
              <span>→</span>
            </Link>

            {/* ==================================================
                SECURITY
            ================================================== */}

            <div className="login-security">
              <span>🔒</span>

              <div>
                <strong>आपका Data सुरक्षित है</strong>

                <small>हर Farmer का data अलग और private रखा जाएगा।</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

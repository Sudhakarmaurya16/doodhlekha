import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Topbar.css";

const pageTitles = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome back, Farmer 👨‍🌾",
  },

  "/cow-entry": {
    title: "Cow Entry",
    subtitle: "Manage your cows and cattle records 🐄",
  },

  "/milk-logs": {
    title: "Milk Logs",
    subtitle: "Track daily milk production 🥛",
  },

  "/sale-milk": {
    title: "Sale Milk",
    subtitle: "View your milk distribution details 💧",
  },

  "/daily-expense": {
    title: "Daily Expense",
    subtitle: "Manage your daily dairy expenses 💰",
  },

  "/customers": {
    title: "Customers",
    subtitle: "Manage your customers and milk records 👥",
  },
};

const getPageInfo = (pathname) => {
  /*
   * Exact route first
   */
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  /*
   * Nested customer routes
   *
   * /customers/123
   * /customers/123/ledger
   * /customers/123/bill
   */
  if (pathname.startsWith("/customers/")) {
    if (pathname.includes("/ledger")) {
      return {
        title: "Customer Ledger",
        subtitle: "Customer का पूरा हिसाब 📒",
      };
    }

    if (pathname.includes("/bill")) {
      return {
        title: "Customer Bill",
        subtitle: "Customer का बिल 🧾",
      };
    }

    return {
      title: "Customer Details",
      subtitle: "Customer की पूरी जानकारी 👤",
    };
  }

  return {
    title: "DOODHLEKHA",
    subtitle: "Welcome back, Farmer 👨‍🌾",
  };
};

const Topbar = ({ setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef(null);

  const pageInfo = getPageInfo(location.pathname);

  // =====================================================
  // MENU TOGGLE
  // =====================================================

  const handleMenuToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // =====================================================
  // PROFILE DROPDOWN
  // =====================================================

  const handleProfileToggle = () => {
    setProfileOpen((prev) => !prev);
  };

  // =====================================================
  // CLOSE DROPDOWN OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // CLOSE DROPDOWN ON ROUTE CHANGE
  // =====================================================

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      setProfileOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout Error:", error);

      setLoggingOut(false);
    }
  };

  // =====================================================
  // USER DATA
  // =====================================================

  const userName = user?.name || "Farmer";

  const dairyName = user?.dairyName || "My Dairy";

  const profileImage = user?.profileImage || "";

  return (
    <header className="topbar">
      {/* =====================================================
          LEFT
      ===================================================== */}

      <div className="topbar-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={handleMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="topbar-heading">
          <h1>{pageInfo.title}</h1>

          <p>{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* =====================================================
          RIGHT
      ===================================================== */}

      <div className="topbar-right">
        {/* ===================================================
            NOTIFICATION
        =================================================== */}

        <button
          type="button"
          className="notification-btn"
          aria-label="Notifications"
        >
          <span className="notification-icon">🔔</span>

          <span className="notification-dot"></span>
        </button>

        {/* ===================================================
            PROFILE
        =================================================== */}

        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className={`profile ${profileOpen ? "profile-active" : ""}`}
            onClick={handleProfileToggle}
            aria-label="Farmer profile"
            aria-expanded={profileOpen}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="profile-avatar profile-image"
              />
            ) : (
              <div className="profile-avatar">👨‍🌾</div>
            )}

            <div className="profile-info">
              <strong>{userName}</strong>

              <span>{dairyName}</span>
            </div>

            <span
              className={`profile-arrow ${
                profileOpen ? "profile-arrow-open" : ""
              }`}
            >
              ⌄
            </span>
          </button>

          {/* =================================================
              PROFILE DROPDOWN
          ================================================= */}

          {profileOpen && (
            <div className="profile-dropdown">
              {/* USER INFO */}

              <div className="profile-dropdown-header">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={userName}
                    className="dropdown-avatar profile-image"
                  />
                ) : (
                  <div className="dropdown-avatar">👨‍🌾</div>
                )}

                <div className="dropdown-user-info">
                  <strong>{userName}</strong>

                  <span>{user?.email || "Dairy Farmer"}</span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              {/* PROFILE */}

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
              >
                <span className="dropdown-item-icon">👤</span>

                <span>My Profile</span>
              </button>

              {/* SETTINGS */}

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
              >
                <span className="dropdown-item-icon">⚙️</span>

                <span>Settings</span>
              </button>

              <div className="dropdown-divider"></div>

              {/* LOGOUT */}

              <button
                type="button"
                className="profile-dropdown-item logout-item"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <span className="dropdown-item-icon">
                  {loggingOut ? "⏳" : "🚪"}
                </span>

                <span>{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

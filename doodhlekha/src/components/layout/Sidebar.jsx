import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../assets/logo.png";
const menuItems = [
  {
    title: "Dashboard",
    hindi: "डैशबोर्ड",
    path: "/dashboard",
    icon: "📊",
  },
  {
    title: "Cow Entry",
    hindi: "गाय की एंट्री",
    path: "/cow-entry",
    icon: "🐄",
  },
  {
    title: "Milk Logs",
    hindi: "दूध का रिकॉर्ड",
    path: "/milk-logs",
    icon: "🥛",
  },
  {
    title: "Sale Milk",
    hindi: "दूध बिक्री",
    path: "/sale-milk",
    icon: "💧",
  },
  {
    title: "Daily Expense",
    hindi: "दैनिक खर्च",
    path: "/daily-expense",
    icon: "💰",
  },
  {
    title: "Customers",
    hindi: "ग्राहक",
    path: "/customers",
    icon: "👥",
  },
  {
    title: "Reports",
    hindi: "रिपोर्ट / पूरा हिसाब",
    path: "/reports",
    icon: "📋",
  },
];

const Sidebar = ({ isOpen = false, setIsOpen = () => {} }) => {
  const handleMenuClick = () => {
    if (window.innerWidth <= 900) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* =========================================
          MOBILE OVERLAY
      ========================================= */}

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* =========================================
            LOGO
        ========================================= */}

        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src={logo} alt="Doodhlekha Logo" />
          </div>

          <div className="logo-content">
            <h2>DOODHLEKHA</h2>

            <span>Dairy Management</span>
          </div>
        </div>

        {/* =========================================
            MENU
        ========================================= */}

        <nav className="sidebar-menu">
          <p className="menu-title">MAIN MENU / मुख्य मेनू</p>

          <div className="menu-list">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `menu-item ${isActive ? "active" : ""}`
                }
              >
                {/* ICON */}

                <span className="menu-icon">{item.icon}</span>

                {/* TEXT */}

                <span className="menu-text">
                  <strong>{item.title}</strong>

                  <small>{item.hindi}</small>
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* =========================================
            FARMER ACCOUNT
        ========================================= */}

        <div className="sidebar-bottom">
          <div className="farmer-card">
            <div className="farmer-avatar">👨‍🌾</div>

            <div className="farmer-info">
              <strong>My Dairy</strong>

              <small>मेरी डेयरी</small>
            </div>

            <span className="farmer-arrow">›</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

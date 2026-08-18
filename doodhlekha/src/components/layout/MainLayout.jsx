import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "./MainLayout.css";

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const location = useLocation();

  /*
   * Route change होने पर mobile sidebar automatically close.
   */
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /*
   * Mobile sidebar open होने पर body scroll रोकें.
   */
  useEffect(() => {
    if (isOpen && window.innerWidth <= 900) {
      document.body.classList.add("sidebar-is-open");
    } else {
      document.body.classList.remove("sidebar-is-open");
    }

    return () => {
      document.body.classList.remove("sidebar-is-open");
    };
  }, [isOpen]);

  return (
    <div className="app-layout">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =====================================================
          MAIN WRAPPER
      ===================================================== */}

      <div className="main-wrapper">
        <Topbar setIsOpen={setIsOpen} />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

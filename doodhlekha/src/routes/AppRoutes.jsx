import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// =====================================================
// LAYOUT
// =====================================================

import MainLayout from "../components/layout/MainLayout";

// =====================================================
// AUTH
// =====================================================

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";

import ProtectedRoute from "../components/ProtectedRoute";

// =====================================================
// MAIN PAGES
// =====================================================

import Dashboard from "../pages/Dashboard/Dashboard";
import CowEntry from "../pages/CowEntry/CowEntry";
import MilkLogs from "../pages/MilkLogs/MilkLogs";
import SaleMilk from "../pages/SaleMilk/SaleMilk";
import DailyExpense from "../pages/DailyExpense/DailyExpense";

// =====================================================
// CUSTOMER
// =====================================================

import Customers from "../pages/Customers/Customers";
import CustomerDetails from "../pages/Customers/CustomerDetails";
import CustomerPayment from "../pages/Customers/CustomerPayment";
import CustomerLedger from "../pages/Customers/CustomerLedger";
import CustomerBill from "../pages/Customers/CustomerBill";

// =====================================================
// REPORTS
// =====================================================

import Reports from "../pages/Reports/Reports";

// =====================================================
// APP ROUTES
// =====================================================

const AppRoutes = () => {
  return (
    <Routes>
      {/* =================================================
          PUBLIC ROUTES
          बिना Login के खुलेंगे
      ================================================= */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* =================================================
          PROTECTED APPLICATION
          Login के बिना अंदर नहीं जा सकते
      ================================================= */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* =================================================
            DEFAULT
        ================================================= */}

        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route path="dashboard" element={<Dashboard />} />

        {/* =================================================
            COW ENTRY
        ================================================= */}

        <Route path="cow-entry" element={<CowEntry />} />

        {/* =================================================
            MILK LOGS
        ================================================= */}

        <Route path="milk-logs" element={<MilkLogs />} />

        {/* =================================================
            SALE MILK
        ================================================= */}

        <Route path="sale-milk" element={<SaleMilk />} />

        {/* =================================================
            DAILY EXPENSE
        ================================================= */}

        <Route path="daily-expense" element={<DailyExpense />} />

        {/* =================================================
            CUSTOMERS
        ================================================= */}

        <Route path="customers" element={<Customers />} />

        {/* =================================================
            CUSTOMER DETAILS
        ================================================= */}

        <Route path="customers/:id" element={<CustomerDetails />} />

        {/* =================================================
            CUSTOMER PAYMENT
        ================================================= */}

        <Route path="customers/:id/payment" element={<CustomerPayment />} />

        {/* =================================================
            CUSTOMER LEDGER
        ================================================= */}

        <Route
          path="customers/:customerId/ledger"
          element={<CustomerLedger />}
        />

        {/* =================================================
            CUSTOMER BILL
        ================================================= */}

        <Route path="customers/:customerId/bill" element={<CustomerBill />} />

        {/* =================================================
            REPORTS
        ================================================= */}

        <Route path="reports" element={<Reports />} />
      </Route>

      {/* =================================================
          UNKNOWN URL
      ================================================= */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

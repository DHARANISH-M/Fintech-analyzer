import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Alerts from "./app/Alerts";
import Analytics from "./app/Analytics";
import Dashboard from "./app/Dashboard";
import Documents from "./app/Documents";
import Settings from "./app/Settings";
import Transactions from "./app/Transactions";
import Landing from "./public/Landing";
import Login from "./public/Login";
import Onboarding from "./public/Onboarding";
import Signup from "./public/Signup";

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="onboarding" element={<Onboarding />} />

      <Route path="dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="transactions" element={<MainLayout><Transactions /></MainLayout>} />
      <Route path="analytics" element={<MainLayout><Analytics /></MainLayout>} />
      <Route path="documents" element={<MainLayout><Documents /></MainLayout>} />
      <Route path="alerts" element={<MainLayout><Alerts /></MainLayout>} />
      <Route path="settings" element={<MainLayout><Settings /></MainLayout>} />

      <Route path="*" element={<Navigate to="/enhanced/dashboard" replace />} />
    </Routes>
  );
}

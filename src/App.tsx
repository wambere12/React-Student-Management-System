import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Reports from "./pages/Reports";
import Schools from "./pages/Schools";
import Admins from "./pages/Admins";
import DatabaseSQL from "./pages/DatabaseSQL";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/schools" element={<Schools />} />
          <Route
            path="/admins"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <Admins />
              </ProtectedRoute>
            }
          />
          <Route path="/database" element={<DatabaseSQL />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

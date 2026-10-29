import { createBrowserRouter, Navigate } from "react-router-dom";
import AppWrapper from "./AppWrapper.jsx";
import PrivateRoutes from "./Components/hoc/PrivateRoutes.jsx";
import Login from "./Components/Pages/Login/Login.jsx";
import Layouts from "./Components/Pages/Layouts/Layouts.jsx";
import AdminSettings from "./Components/Pages/AdminSettings/AdminSettings.jsx";
import UserManagement from "./Components/Pages/UserManagement/UserManagement.jsx";
import RoleManagement from "./Components/Pages/RoleManagement/RoleManagement.jsx";
import RolePermissions from "./Components/Pages/RolePermissions/RolePermissions.jsx";
import AuditLog from "./Components/Pages/AuditLog/AuditLog.jsx";
import Dashboard from "./Components/Pages/Dashboard/Dashboard.jsx";
import Leakage from "./Components/Pages/Leakage/Leakage.jsx";
import HcpFatigue from "./Components/Pages/HcpFatigue/HcpFatigue.jsx";
import ManualUpload from "./Components/Pages/DataUpload/ManualUpload.jsx";
import Automation from "./Components/Pages/DataUpload/Automation.jsx";
import ProcessingHistory from "./Components/Pages/DataUpload/ProcessingHistory.jsx";
import Thresholds from "./Components/Pages/Configurations/Thresholds.jsx";
import RiskRules from "./Components/Pages/Configurations/RiskRules.jsx";
import Notifications from "./Components/Pages/Configurations/Notifications.jsx";
import Integrations from "./Components/Pages/Configurations/Integrations.jsx";
import Salesforce from "./Components/Pages/Salesforce/Salesforce.jsx";
import Assistant from "./Components/Pages/Assistant/Assistant.jsx";
import ComingSoon from "./Components/Pages/ComingSoon/ComingSoon.jsx";
import ErrorPage from "./Components/Pages/ErrorPage/ErrorPage.jsx";
import { flatNavItems } from "./Components/Pages/Sidebar/SidebarData.js";

const modulePages = {
  "/dashboard": <Dashboard />,
  "/leakage": <Leakage />,
  "/fatigue": <HcpFatigue />,
  "/upload/manual": <ManualUpload />,
  "/upload/automation": <Automation />,
  "/upload/history": <ProcessingHistory />,
  "/config/thresholds": <Thresholds />,
  "/config/rules": <RiskRules />,
  "/config/notifications": <Notifications />,
  "/config/integrations": <Integrations />,
  "/salesforce": <Salesforce />,
  "/assistant": <Assistant />,
  "/audit": <AuditLog />,
};

const moduleRoutes = flatNavItems
  .filter((item) => !item.link.startsWith("/admin"))
  .map((item) => ({
    path: item.link,
    handle: { crumbs: item.parent ? [item.parent, item.label] : [item.label] },
    element: modulePages[item.link] || <ComingSoon />,
  }));

const AdminRouter = [
  {
    path: "/admin",
    element: <AdminSettings />,
    children: [
      { index: true, element: <Navigate to="/admin/users" replace /> },
      {
        path: "users",
        handle: { crumbs: ["Admin settings", "User management"] },
        element: <UserManagement />,
      },
      {
        path: "roles",
        handle: { crumbs: ["Admin settings", "Role management"] },
        element: <RoleManagement />,
      },
      {
        path: "permissions",
        handle: { crumbs: ["Admin settings", "Role permissions"] },
        element: <RolePermissions />,
      },
    ],
  },
];

export const router = createBrowserRouter([
  {
    element: <AppWrapper />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Login /> },
      {
        element: <PrivateRoutes />,
        children: [
          {
            element: <Layouts />,
            children: [...moduleRoutes, ...AdminRouter],
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;

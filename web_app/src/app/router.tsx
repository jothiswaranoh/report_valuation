// app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";

import DashboardPage from "../pages/DashboardPage";
import UploadPage from "../pages/UploadPage";
import ReportsPage from "../pages/ReportsPage";
import ReportEditorPage from "../pages/ReportEditorPage";
import ReviewApprovalPage from "../pages/ReviewApprovalPage";
import UsersPage from "../pages/UsersPage";
import BankManagementPage from "../pages/BankManagementPage";
import LoginPage from "../pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "upload/:reportId?", element: <UploadPage /> },
      { path: "files", element: <ReportsPage /> },
      { path: "reports/:id/edit", element: <ReportEditorPage /> },
      { path: "reports/:id/review", element: <ReviewApprovalPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "banks", element: <BankManagementPage /> },
      { path: "*", element: <NotFound /> }, // Catch-all 404 route
    ],
  },
  {
    path: "*",
    element: <NotFound />, // Top-level catch-all
  },
]);

export default router;

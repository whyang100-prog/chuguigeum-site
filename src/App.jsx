import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CalculatorPage from "./pages/CalculatorPage";
import AuthPage from "./pages/AuthPage";
import RecordsPage from "./pages/RecordsPage";
import CasesPage from "./pages/CasesPage";
import EtiquettePage from "./pages/EtiquettePage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import { Link } from "react-router-dom";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CalculatorPage />} />
        <Route path="etiquette" element={<EtiquettePage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="records" element={<RecordsPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route element={<ProtectedRoute admin />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="empty-state">
              <h1>페이지를 찾을 수 없어요</h1>
              <Link to="/">계산기로 돌아가기</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

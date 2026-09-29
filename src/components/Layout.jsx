import { t, useLanguage } from "../i18n/index";
import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { Notice } from "./Ui";
export default function Layout() {
  useLanguage();
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header>
        <Link className="brand" to="/">
          <span className="brand-symbol">₩</span>
          {t("축의금 얼마하지?")}
        </Link>
        <div className="header-actions">
          <LanguageSwitcher />
          <div id="account-nav">
            {user ? (
              <>
                <Link to="/account">
                  {user.username}
                  {t(" · 내 계정")}
                </Link>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={handleLogout}
                >
                  {t("로그아웃")}
                </button>
              </>
            ) : pathname === "/" ? (
              <span className="hint">{t("로그인 없이 계산할 수 있어요")}</span>
            ) : (
              !loading && <Link to="/login">{t("로그인 / 회원가입")}</Link>
            )}
          </div>
        </div>
      </header>
      <main>
        <nav className="hub-nav" aria-label={t("주요 메뉴")}>
          <NavLink end to="/">
            {t("축의금 계산")}
          </NavLink>
          <NavLink to="/records">{t("내 경조사 기록")}</NavLink>
          <NavLink to="/cases">{t("사용자 사례")}</NavLink>
          <NavLink to="/etiquette">{t("예절 가이드")}</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin">{t("관리자")}</NavLink>
          )}
        </nav>
        <Notice>{error}</Notice>
        <Outlet />
      </main>
      <footer>
        <span className="brand">{t("축의금 얼마하지?")}</span>
        <span>{t("기록은 나에게, 경험은 함께.")}</span>
        <span className="hint">
          {t("예식장 이름·지역 상세·사용자 작성 내용은 원문으로 표시합니다.")}
        </span>
      </footer>
    </>
  );
}

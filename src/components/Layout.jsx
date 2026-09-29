import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Notice } from "./Ui";
export default function Layout() {
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
          <span className="brand-symbol">₩</span>축의금 얼마하지?
        </Link>
        <div id="account-nav">
          {user ? (
            <>
              <Link to="/account">{user.username} · 내 계정</Link>
              <button
                className="secondary"
                disabled={busy}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : pathname === "/" ? (
            <span className="hint">로그인 없이 계산할 수 있어요</span>
          ) : (
            !loading && <Link to="/login">로그인 / 회원가입</Link>
          )}
        </div>
      </header>
      <main>
        <nav className="hub-nav" aria-label="주요 메뉴">
          <NavLink end to="/">
            축의금 계산
          </NavLink>
          <NavLink to="/records">내 경조사 기록</NavLink>
          <NavLink to="/cases">사용자 사례</NavLink>
          <NavLink to="/etiquette">예절 가이드</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">관리자</NavLink>}
        </nav>
        <Notice>{error}</Notice>
        <Outlet />
      </main>
      <footer>
        <span className="brand">축의금 얼마하지?</span>
        <span>기록은 나에게, 경험은 함께.</span>
      </footer>
    </>
  );
}

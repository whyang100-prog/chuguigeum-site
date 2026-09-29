import { t, useLanguage } from "../i18n/index";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Heading, RemoteStatus } from "./Ui";
export default function ProtectedRoute({ admin = false }) {
  useLanguage();
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading || auth.error)
    return (
      <RemoteStatus
        loading={auth.loading}
        error={auth.error}
        reload={auth.retry}
      />
    );
  if (!auth.user)
    return (
      <>
        <Heading title={t("로그인하고 시작해 주세요")}>
          {t("내 경조사 기록과 사용자 사례는 로그인 후 이용할 수 있어요.")}
        </Heading>
        <div className="empty-state">
          <p>{t("개인 기록은 공개 사례로 자동 공유되지 않아요.")}</p>
          <Link
            className="primary"
            to={"/login?next=" + encodeURIComponent(location.pathname)}
          >
            {t("로그인 / 회원가입")}
          </Link>
          <p>
            <Link to="/">{t("로그인 없이 축의금 계산하기")}</Link>
          </p>
        </div>
      </>
    );
  if (admin && auth.user.role !== "admin")
    return (
      <Heading title={t("관리자 전용")}>
        {t("이 계정에는 접근 권한이 없습니다.")}
      </Heading>
    );
  return <Outlet />;
}

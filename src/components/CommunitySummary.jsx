import { t, useLanguage } from "../i18n/index";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRemote } from "../hooks/useRemote";
import { RemoteStatus } from "./Ui";
import { won } from "../lib/labels";

export default function CommunitySummary({ filters, showCases = false }) {
  useLanguage();
  const { user, loading } = useAuth();
  const query = new URLSearchParams(filters).toString();
  const result = useRemote(user ? "/api/community?" + query : null);
  if (!user)
    return (
      <p className="hint">
        {loading ? (
          t("로그인 상태를 확인하고 있어요.")
        ) : (
          <>
            {t("사용자 사례 통계는 ")}
            <Link to="/login?next=/cases">{t("로그인 후")}</Link>
            {t(" 볼 수 있어요. 축의금 계산은 로그인 없이 이용할 수 있어요.")}
          </>
        )}
      </p>
    );
  return (
    <>
      <RemoteStatus {...result} />
      {result.data && (
        <>
          <p className="callout" aria-live="polite">
            {t("참여자 ")}
            {result.data.count}
            {t("명 ·")}{" "}
            {result.data.median === null
              ? t("5명 이상 모이면 중앙값을 표시해요.")
              : t("낸 금액 중앙값 ") + won(result.data.median)}
          </p>
          {showCases &&
            (result.data.cases.length ? (
              result.data.cases.map((item) => (
                <article className="item" key={item.id}>
                  <h3>
                    {t("익명 회원 · ")}
                    {won(item.amount)}
                  </h3>
                  <p className="hint">
                    {t("행사 ")}
                    {item.event_month}
                  </p>
                  <p>{item.story}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">
                {t("이 조건에 맞는 승인 사례가 아직 없어요.")}
              </div>
            ))}
        </>
      )}
    </>
  );
}

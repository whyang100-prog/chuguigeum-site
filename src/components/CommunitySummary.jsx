import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRemote } from "../hooks/useRemote";
import { RemoteStatus } from "./Ui";
import { won } from "../lib/labels";

export default function CommunitySummary({ filters, showCases = false }) {
  const { user, loading } = useAuth();
  const query = new URLSearchParams(filters).toString();
  const result = useRemote(user ? "/api/community?" + query : null);
  if (!user)
    return (
      <p className="hint">
        {loading ? (
          "로그인 상태를 확인하고 있어요."
        ) : (
          <>
            사용자 사례 통계는 <Link to="/login?next=/cases">로그인 후</Link> 볼
            수 있어요. 축의금 계산은 로그인 없이 이용할 수 있어요.
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
            참여자 {result.data.count}명 ·{" "}
            {result.data.median === null
              ? "5명 이상 모이면 중앙값을 표시해요."
              : "낸 금액 중앙값 " + won(result.data.median)}
          </p>
          {showCases &&
            (result.data.cases.length ? (
              result.data.cases.map((item) => (
                <article className="item" key={item.id}>
                  <h3>익명 회원 · {won(item.amount)}</h3>
                  <p className="hint">행사 {item.event_month}</p>
                  <p>{item.story}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">
                이 조건에 맞는 승인 사례가 아직 없어요.
              </div>
            ))}
        </>
      )}
    </>
  );
}

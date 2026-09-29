import { useState } from "react";
import { api } from "../lib/api";
import { names, won } from "../lib/labels";
import { useRemote } from "../hooks/useRemote";
import { Heading, Notice, RemoteStatus } from "../components/Ui";
export default function AdminPage() {
  const members = useRemote("/api/admin/users");
  const cases = useRemote("/api/admin/cases");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function mutate(path, method, body, message) {
    setBusy(true);
    setNotice("");
    try {
      await api("/api/admin/" + path, { method, body });
      setNotice(message);
      members.reload();
      cases.reload();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  function memberStatus(member) {
    const status = member.status === "active" ? "suspended" : "active";
    if (
      confirm(
        `${member.username} 회원을 ${names[status]} 상태로 변경할까요? 기존 로그인도 해제됩니다.`,
      )
    )
      mutate(
        "users/" + member.id,
        "PATCH",
        { status },
        "회원 상태를 변경했어요.",
      );
  }
  function deleteMember(member) {
    const typed = prompt(
      `${member.username} 회원을 영구 삭제합니다.\n개인 기록·사례·세션도 삭제되며 복구할 수 없습니다.\n확인을 위해 회원 아이디를 입력하세요: ${member.username}`,
    );
    if (typed === null) return;
    if (typed !== member.username) {
      setNotice("아이디가 일치하지 않아 삭제하지 않았어요.");
      return;
    }
    mutate(
      "users/" + member.id,
      "DELETE",
      { confirmUsername: typed },
      "회원과 관련 데이터를 삭제했어요.",
    );
  }
  function caseStatus(item, status) {
    if (
      confirm(
        `${item.username} 회원의 사례를 ${names[status]} 상태로 변경할까요?`,
      )
    )
      mutate(
        "cases/" + item.id,
        "PATCH",
        { status },
        "사례 상태를 변경했어요.",
      );
  }
  function deleteCase(item) {
    if (
      confirm(
        `${item.username} · ${names[item.kind]} · ${won(item.amount)} · ${item.event_month}\n${item.story}\n\n이 사례를 영구 삭제할까요? 공개 목록과 통계에서 제외되며 복구할 수 없습니다.`,
      )
    )
      mutate(
        "cases/" + item.id,
        "DELETE",
        { confirmCaseId: item.id },
        "사례를 삭제했어요.",
      );
  }
  return (
    <>
      <Heading title="회원과 사례 관리">
        회원의 비밀번호와 개인 경조사 기록은 표시하지 않습니다. 사례 승인 전에
        개인정보와 게시 내용을 확인하세요.
      </Heading>
      <Notice>{notice}</Notice>
      <div className="guide-grid">
        <section>
          <h2>회원 {members.data?.users.length ?? "…"}명</h2>
          <RemoteStatus {...members} />
          {members.data?.users.map((member) => (
            <article className="item" key={member.id}>
              <h3>{member.username}</h3>
              <span className="tag">
                {names[member.role]} · {names[member.status]}
              </span>
              <p className="hint">가입 {member.created_at.slice(0, 10)}</p>
              {member.role !== "admin" && (
                <div className="item-actions">
                  <button
                    disabled={busy}
                    className="secondary"
                    onClick={() => memberStatus(member)}
                  >
                    {member.status === "active" ? "계정 정지" : "정지 해제"}
                  </button>
                  <button
                    disabled={busy}
                    className="danger"
                    onClick={() => deleteMember(member)}
                  >
                    회원 삭제
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
        <section>
          <h2>사례 검토 {cases.data?.cases.length ?? "…"}건</h2>
          <RemoteStatus {...cases} />
          {cases.data?.cases.map((item) => (
            <article className="item" key={item.id}>
              <h3>
                {item.username} · {won(item.amount)}
              </h3>
              <span className="tag">{names[item.status]}</span>
              <p className="hint">
                {names[item.kind]} · {names[item.relation]} ·{" "}
                {names[item.attendance]} · {item.people}명 · {item.event_month}
              </p>
              <p>{item.story}</p>
              <div className="item-actions">
                <button
                  disabled={busy}
                  className="primary"
                  onClick={() => caseStatus(item, "approved")}
                >
                  승인
                </button>
                <button
                  disabled={busy}
                  className="secondary"
                  onClick={() => caseStatus(item, "pending")}
                >
                  검토 대기
                </button>
                <button
                  disabled={busy}
                  className="danger"
                  onClick={() => caseStatus(item, "rejected")}
                >
                  반려 / 공개 중단
                </button>
                <button
                  disabled={busy}
                  className="danger"
                  onClick={() => deleteCase(item)}
                >
                  사례 삭제
                </button>
              </div>
            </article>
          ))}
          {cases.data?.cases.length === 0 && (
            <p className="empty-state">검토할 사례가 없어요.</p>
          )}
        </section>
      </div>
    </>
  );
}

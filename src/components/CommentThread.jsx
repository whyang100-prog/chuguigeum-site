import { useId, useState } from "react";
import { api } from "../lib/api";
import { useRemote } from "../hooks/useRemote";
import { t, useLanguage } from "../i18n/index";
import { Notice, RemoteStatus } from "./Ui";

export default function CommentThread({ caseId }) {
  const { language } = useLanguage();
  const sectionId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const path = "/api/cases/" + caseId + "/comments";
  const result = useRemote(open ? path + "?page=" + page : null);

  function refresh() {
    setPage(0);
    result.reload();
  }
  async function submit(event) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await api(path, { method: "POST", body: { body: draft } });
      setDraft("");
      setNotice(t("댓글을 등록했어요."));
      refresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm(t("이 댓글을 삭제할까요? 복구할 수 없습니다."))) return;
    setBusy(true);
    setNotice("");
    try {
      await api(path + "/" + id, { method: "DELETE", body: {} });
      setNotice(t("댓글을 삭제했어요."));
      refresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="comment-thread">
      <button
        className="secondary"
        aria-expanded={open}
        aria-controls={sectionId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t("댓글 닫기") : t("댓글 보기 · 소통하기")}
      </button>
      {open && (
        <section id={sectionId} aria-label={t("사례 댓글")}>
          <div className="comment-heading">
            <h4>
              {t("댓글")}
              {result.data && ` (${result.data.total})`}
            </h4>
            <button
              className="secondary"
              disabled={busy || result.loading}
              onClick={refresh}
            >
              {t("댓글 새로고침")}
            </button>
          </div>
          <Notice>{notice}</Notice>
          <RemoteStatus {...result} />
          {result.data && (
            <>
              {result.data.canPost ? (
                <form onSubmit={submit} className="comment-form">
                  <label htmlFor={inputId}>{t("댓글 작성")}</label>
                  <textarea
                    id={inputId}
                    value={draft}
                    maxLength={500}
                    required
                    disabled={busy}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <p className="hint">
                    {t(
                      "댓글은 바로 공개됩니다. 사례별 익명 별칭을 사용해요. 개인정보·비방은 남기지 마세요.",
                    )}
                  </p>
                  <div className="comment-heading">
                    <small>{draft.length}/500</small>
                    <button
                      className="primary"
                      disabled={busy || !draft.trim()}
                    >
                      {busy ? t("처리 중…") : t("댓글 등록")}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="hint">
                  {t("비공개 사례에는 댓글을 작성할 수 없어요.")}
                </p>
              )}
              {!result.data.comments.length && (
                <p>{t("아직 댓글이 없어요. 첫 의견을 남겨 보세요.")}</p>
              )}
              <ul className="comment-list">
                {result.data.comments.map((comment) => (
                  <li key={comment.id}>
                    <b>{t("익명 회원 {0}", [comment.author])}</b>
                    {comment.isMine && <span className="tag">{t("나")}</span>}
                    {comment.isCaseAuthor && (
                      <span className="tag">{t("사례 작성자")}</span>
                    )}
                    {comment.hidden && (
                      <span className="tag">
                        {t("정지 회원 · 일반 회원에게 숨김")}
                      </span>
                    )}
                    <time dateTime={comment.createdAt} className="hint">
                      {new Date(comment.createdAt).toLocaleString(language)}
                    </time>
                    <p className="text-preserve">{comment.body}</p>
                    {comment.canDelete && (
                      <button
                        className="danger"
                        disabled={busy}
                        onClick={() => remove(comment.id)}
                      >
                        {t("댓글 삭제")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {(page > 0 ||
                (page + 1) * result.data.pageSize < result.data.total) && (
                <div className="comment-heading">
                  <button
                    className="secondary"
                    disabled={busy || page === 0}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    {t("이전 댓글")}
                  </button>
                  <span>{t("{0}페이지", [page + 1])}</span>
                  <button
                    className="secondary"
                    disabled={
                      busy ||
                      (page + 1) * result.data.pageSize >= result.data.total
                    }
                    onClick={() => setPage((value) => value + 1)}
                  >
                    {t("다음 댓글")}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

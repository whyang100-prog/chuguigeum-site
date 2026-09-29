import { t, useLanguage } from "../i18n/index";
import { useState } from "react";
import { api } from "../lib/api";
import { names, relations, won, today } from "../lib/labels";
import { useRemote } from "../hooks/useRemote";
import { Heading, Notice, Field, Select, RemoteStatus } from "../components/Ui";

const blank = () => ({
  kind: "wedding",
  direction: "paid",
  person: "",
  relation: "colleague",
  amount: "",
  event_date: today(),
  memo: "",
});
export default function RecordsPage() {
  useLanguage();
  const result = useRemote("/api/records");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [direction, setDirection] = useState("");
  const field = (name) => ({
    name,
    value: form[name],
    onChange: (e) =>
      setForm((previous) => ({ ...previous, [name]: e.target.value })),
  });
  const rows = (result.data?.records || []).filter(
    (row) =>
      (!kind || row.kind === kind) &&
      (!direction || row.direction === direction) &&
      `${row.person} ${row.memo}`.toLowerCase().includes(query.toLowerCase()),
  );
  const total = (type) =>
    rows
      .filter((row) => row.direction === type)
      .reduce((sum, row) => sum + Number(row.amount), 0);
  function reset() {
    setEditing(null);
    setForm(blank());
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await api("/api/records" + (editing ? "/" + editing : ""), {
        method: editing ? "PUT" : "POST",
        body: { ...form, amount: Number(form.amount) },
      });
      setNotice(editing ? t("기록을 수정했어요.") : t("기록을 저장했어요."));
      reset();
      result.reload();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm(t("이 개인 기록을 삭제할까요? 복구할 수 없습니다."))) return;
    setBusy(true);
    try {
      await api("/api/records/" + id, { method: "DELETE", body: {} });
      if (editing === id) reset();
      setNotice(t("기록을 삭제했어요."));
      result.reload();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading title={t("기억하고 싶은 마음의 기록")}>
        {t(
          "축의금과 조의금, 낸 돈과 받은 돈을 한곳에. 이 기록은 본인에게만 보여요.",
        )}
      </Heading>
      <Notice>{notice}</Notice>
      <div className="hub-grid">
        <section className="panel">
          <h2>{editing ? t("기록 수정") : t("새 기록 남기기")}</h2>
          <form onSubmit={save}>
            <fieldset disabled={busy} className="hub-form">
              <div className="two">
                <Select
                  label={t("종류")}
                  options={["wedding", "funeral"]}
                  {...field("kind")}
                />
                <Select
                  label={t("구분")}
                  options={["paid", "received"]}
                  {...field("direction")}
                />
              </div>
              <Field
                label={t("상대 이름 또는 별칭")}
                required
                maxLength={50}
                {...field("person")}
              />
              <div className="two">
                <Field
                  label={t("금액 (원)")}
                  type="number"
                  required
                  min="0"
                  max="100000000"
                  step="1"
                  {...field("amount")}
                />
                <Field
                  label={t("날짜")}
                  type="date"
                  required
                  {...field("event_date")}
                />
              </div>
              <Select
                label={t("우리 사이")}
                options={relations}
                {...field("relation")}
              />
              <Field label={t("메모")}>
                <textarea maxLength={500} {...field("memo")} />
              </Field>
              <div className="form-actions">
                <button className="primary" type="submit">
                  {busy
                    ? t("처리 중…")
                    : editing
                      ? t("수정 저장")
                      : t("기록 저장")}
                </button>
                {editing && (
                  <button className="secondary" type="button" onClick={reset}>
                    {t("수정 취소")}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>
        <section aria-label={t("기록 목록")}>
          <div className="filters">
            <input
              aria-label={t("기록 검색")}
              placeholder={t("이름 또는 메모 검색")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label={t("기록 종류 필터")}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="">{t("전체 종류")}</option>
              <option value="wedding">{t("축의금")}</option>
              <option value="funeral">{t("조의금")}</option>
            </select>
            <select
              aria-label={t("기록 구분 필터")}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="">{t("낸 돈·받은 돈")}</option>
              <option value="paid">{t("낸 돈")}</option>
              <option value="received">{t("받은 돈")}</option>
            </select>
          </div>
          <RemoteStatus {...result} />
          {result.data && (
            <>
              <div className="stats">
                {[
                  [t("기록"), rows.length + t("건")],
                  [t("낸 돈"), won(total("paid"))],
                  [t("받은 돈"), won(total("received"))],
                ].map(([label, value]) => (
                  <div className="stat" key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              {!rows.length && (
                <div className="empty-state">
                  {t(
                    "아직 기록이 없어요. 첫 기록을 남기거나 검색 조건을 바꿔 보세요.",
                  )}
                </div>
              )}
              {rows.map((row) => (
                <article className="item" key={row.id}>
                  <div className="item-top">
                    <div>
                      <h3>{row.person}</h3>
                      <span className="tag">
                        {names[row.kind]} · {names[row.direction]}
                      </span>
                      <span className="hint">{row.event_date}</span>
                    </div>
                    <b className="amount-small">{won(row.amount)}</b>
                  </div>
                  <p>{row.memo}</p>
                  <span className="hint">{names[row.relation]}</span>
                  <div className="item-actions">
                    <button
                      disabled={busy}
                      className="secondary"
                      onClick={() => {
                        setEditing(row.id);
                        setForm({ ...row, amount: String(row.amount) });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {t("수정")}
                    </button>
                    <button
                      disabled={busy}
                      className="danger"
                      onClick={() => remove(row.id)}
                    >
                      {t("삭제")}
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </>
  );
}

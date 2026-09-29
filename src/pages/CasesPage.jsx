import { t, useLanguage } from "../i18n/index";
import { useState } from "react";
import { api } from "../lib/api";
import { names, relations, attendanceOptions, today, won } from "../lib/labels";
import { useRemote } from "../hooks/useRemote";
import CommunitySummary from "../components/CommunitySummary";
import { Heading, Notice, Select, Field, RemoteStatus } from "../components/Ui";

export default function CasesPage() {
  useLanguage();
  const [filters, setFilters] = useState({
    kind: "wedding",
    relation: "colleague",
    attendance: "meal",
    people: 1,
  });
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const mine = useRemote("/api/cases");
  const filter = (name) => ({
    value: filters[name],
    onChange: (e) =>
      setFilters((previous) => ({ ...previous, [name]: e.target.value })),
  });
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setNotice("");
    try {
      await api("/api/cases", {
        method: "POST",
        body: {
          ...values,
          amount: Number(values.amount),
          people: Number(values.people),
          consent: values.consent === "on",
        },
      });
      form.reset();
      mine.reload();
      setNotice(t("사례를 제출했어요. 관리자 승인 후 공개됩니다."));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function withdraw(id) {
    if (!confirm(t("이 사례를 삭제하고 공개·통계 활용을 철회할까요?"))) return;
    setBusy(true);
    try {
      await api("/api/cases/" + id, { method: "DELETE", body: {} });
      mine.reload();
      setRevision((n) => n + 1);
      setNotice(t("사례를 철회했어요."));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading title={t("이런 사이, 이만큼 전했어요")}>
        {t(
          "회원이 직접 남긴 경험을 살펴보세요. 실제 지급 여부를 증명한 자료는 아닙니다.",
        )}
      </Heading>
      <Notice>{notice}</Notice>
      <div className="filters">
        <Select
          label={t("경조사 종류")}
          options={["wedding", "funeral"]}
          {...filter("kind")}
        />
        <Select
          label={t("친밀도")}
          options={relations}
          {...filter("relation")}
        />
        <Select
          label={t("참석 방식")}
          options={attendanceOptions}
          {...filter("attendance")}
        />
        <Select
          label={t("본인 포함 인원")}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          {...filter("people")}
        />
      </div>
      <div className="hub-grid">
        <section aria-label={t("승인된 사례")}>
          <CommunitySummary key={revision} filters={filters} showCases />
        </section>
        <section className="panel">
          <h2>{t("나의 경험 나누기")}</h2>
          <p className="hint">
            {t(
              "직접 낸 경험만 작성해 주세요. 상대 이름, 회사, 연락처 등 개인을 알아볼 수 있는 내용은 쓰지 마세요.",
            )}
          </p>
          <form onSubmit={submit}>
            <fieldset disabled={busy} className="hub-form">
              <div className="two">
                <Select
                  label={t("종류")}
                  name="kind"
                  options={["wedding", "funeral"]}
                />
                <Select
                  label={t("친밀도")}
                  name="relation"
                  options={relations}
                  defaultValue="colleague"
                />
              </div>
              <Field
                label={t("실제로 낸 총액 (원)")}
                type="number"
                name="amount"
                required
                min="10000"
                max="10000000"
                step="1"
              />
              <div className="two">
                <Select
                  label={t("참석 방식")}
                  name="attendance"
                  options={attendanceOptions}
                />
                <Field
                  label={t("본인 포함 인원")}
                  type="number"
                  name="people"
                  required
                  defaultValue="1"
                  min="1"
                  max="10"
                />
              </div>
              <Field
                label={t("행사 월")}
                type="month"
                name="event_month"
                required
                min="2000-01"
                max={today().slice(0, 7)}
              />
              <Field label={t("어떤 사이였고, 왜 이 금액을 정했나요?")}>
                <textarea
                  name="story"
                  required
                  minLength={10}
                  maxLength={500}
                />
              </Field>
              <label className="check">
                <input name="consent" type="checkbox" required />
                {t(
                  "실제로 낸 경험이며, 금액·관계·참석 방식·인원·행사 월·설명의 익명 공개와 통계 활용에 동의합니다. 관리자는 작성 계정을 확인할 수 있습니다.",
                )}
              </label>
              <button className="primary" type="submit">
                {busy ? t("처리 중…") : t("검토 요청하기")}
              </button>
            </fieldset>
          </form>
          <h3>{t("내가 제출한 사례")}</h3>
          <RemoteStatus {...mine} />
          {mine.data?.cases.map((item) => (
            <article className="item" key={item.id}>
              <span className="tag">{names[item.status]}</span>
              <b>{won(item.amount)}</b>
              <p>{item.story}</p>
              <button
                className="danger"
                disabled={busy}
                onClick={() => withdraw(item.id)}
              >
                {t("사례 철회")}
              </button>
            </article>
          ))}
          {mine.data?.cases.length === 0 && (
            <p className="hint">{t("제출한 사례가 없어요.")}</p>
          )}
        </section>
      </div>
      <p className="hint">
        {t(
          "집계: 최근 24개월 행사, 같은 종류·친밀도·참석 방식·인원에 대해 회원별 가장 최근 승인 사례 1건. 참여자 5명 이상일 때 중앙값을 표시합니다. 자발적 참여 표본이므로 전체 하객의 기준으로 일반화할 수 없어요. 관리자 승인은 게시 기준 검토이며 지급 사실 인증이 아닙니다.",
        )}
      </p>
    </>
  );
}

import { t, useLanguage } from "../i18n/index";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Field, Heading, Notice } from "../components/Ui";
export default function AccountPage() {
  useLanguage();
  const { user, clearUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(event, deleting = false) {
    event.preventDefault();
    if (
      deleting &&
      !confirm(
        t("계정과 모든 개인 기록·사례를 영구 삭제할까요? 복구할 수 없습니다."),
      )
    )
      return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setNotice("");
    try {
      await api(deleting ? "/api/auth/account" : "/api/auth/password", {
        method: deleting ? "DELETE" : "POST",
        body,
      });
      clearUser();
      navigate("/login", { replace: true });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading title={t("계정 설정")}>{user.username}</Heading>
      <Notice>{notice}</Notice>
      <div className="guide-grid">
        <section className="panel">
          <h2>{t("비밀번호 변경")}</h2>
          <form onSubmit={(event) => submit(event)}>
            <fieldset disabled={busy} className="hub-form">
              <Field
                label={t("현재 비밀번호")}
                type="password"
                name="current"
                autoComplete="current-password"
                required
              />
              <Field
                label={t("새 비밀번호")}
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
              <button className="primary" type="submit">
                {t("변경하고 로그아웃")}
              </button>
            </fieldset>
          </form>
        </section>
        {user.role !== "admin" && (
          <section className="panel">
            <h2>{t("회원 탈퇴")}</h2>
            <p>
              {t(
                "계정과 개인 기록, 공개 사례가 삭제됩니다. 복구할 수 없습니다.",
              )}
            </p>
            <form onSubmit={(event) => submit(event, true)}>
              <fieldset disabled={busy} className="hub-form">
                <Field
                  label={t("탈퇴 확인 비밀번호")}
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                />
                <button className="danger" type="submit">
                  {t("탈퇴하기")}
                </button>
              </fieldset>
            </form>
          </section>
        )}
      </div>
    </>
  );
}

import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field, Notice } from "../components/Ui";
export default function AuthPage({ register = false }) {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  // 로그인 후 이동할 주소를 허용한 내부 페이지로 제한합니다.
  const requested = params.get("next");
  const next = ["/records", "/cases", "/account", "/admin", "/"].includes(
    requested,
  )
    ? requested
    : "/records";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={next} replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await signIn(register ? "register" : "login", {
        ...values,
        consent: values.consent === "on",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel auth-panel">
      <h1>{register ? "회원가입" : "다시 만나 반가워요"}</h1>
      <Notice>{error}</Notice>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="hub-form">
          <Field
            label="아이디"
            name="username"
            required
            minLength={4}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            autoComplete="username"
            placeholder="영문·숫자·밑줄 4~24자"
          />
          <Field
            label="비밀번호"
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
          />
          {register && (
            <label className="check">
              <input type="checkbox" name="consent" required />
              아이디·비밀번호 해시와 개인 기록을 계정 유지에 사용하고 탈퇴
              시까지 저장하는 데 동의합니다. 기록과 공개 사례는 언제든 삭제할 수
              있습니다.
            </label>
          )}
          <button className="primary" type="submit">
            {busy ? "처리 중…" : register ? "가입하고 시작" : "로그인"}
          </button>
        </fieldset>
      </form>
      <p className="hint">
        이메일은 수집하지 않으며 이메일 인증·비밀번호 찾기는 제공하지 않습니다.
        아이디와 비밀번호를 안전하게 보관해 주세요.
      </p>
      <Link
        onClick={() => setError("")}
        to={
          (register ? "/login" : "/register") +
          "?next=" +
          encodeURIComponent(next)
        }
      >
        {register ? "이미 계정이 있어요" : "처음이라면 회원가입"}
      </Link>
    </section>
  );
}

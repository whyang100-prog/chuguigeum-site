import { useLanguage } from "../i18n/index";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="language-switcher">
      <span aria-hidden="true">🌐</span>
      <select
        aria-label="Language / 언어 / 言語"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        <option value="ko" lang="ko">
          한국어
        </option>
        <option value="en" lang="en">
          English
        </option>
        <option value="ja" lang="ja">
          日本語
        </option>
      </select>
    </label>
  );
}

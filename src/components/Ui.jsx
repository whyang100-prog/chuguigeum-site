import { t, useLanguage, systemMessage } from "../i18n/index";
import { names } from "../lib/labels";
export function Heading({ title, children }) {
  useLanguage();
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}
export function Notice({ children }) {
  useLanguage();
  return children ? (
    <p className="callout" role="status">
      {systemMessage(children)}
    </p>
  ) : null;
}
export function Field({ label, children, ...props }) {
  useLanguage();
  return (
    <label>
      {label}
      {children || <input {...props} />}
    </label>
  );
}
export function Select({ label, options, ...props }) {
  useLanguage();
  return (
    <label>
      {label}
      <select {...props}>
        {options.map((value) => (
          <option key={value} value={value}>
            {names[value] || value}
          </option>
        ))}
      </select>
    </label>
  );
}
export function RemoteStatus({ loading, error, reload }) {
  useLanguage();
  if (loading) return <p role="status">{t("불러오는 중…")}</p>;
  if (error)
    return (
      <div role="alert" className="callout">
        {systemMessage(error)}{" "}
        <button className="secondary" onClick={reload}>
          {t("다시 시도")}
        </button>
      </div>
    );
  return null;
}

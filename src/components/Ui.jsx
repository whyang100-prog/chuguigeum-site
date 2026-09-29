import { names } from "../lib/labels";
export function Heading({ title, children }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}
export function Notice({ children }) {
  return children ? (
    <p className="callout" role="status">
      {children}
    </p>
  ) : null;
}
export function Field({ label, children, ...props }) {
  return (
    <label>
      {label}
      {children || <input {...props} />}
    </label>
  );
}
export function Select({ label, options, ...props }) {
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
  if (loading) return <p role="status">불러오는 중…</p>;
  if (error)
    return (
      <div role="alert" className="callout">
        {error}{" "}
        <button className="secondary" onClick={reload}>
          다시 시도
        </button>
      </div>
    );
  return null;
}

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/base.css";
import "./styles/hub.css";
import "./styles/react.css";

// 기존 /#/records, /hub#records 주소를 새 주소로 연결합니다.
function moveLegacyAddress() {
  const oldHash = location.hash.slice(1);
  const legacyPath = oldHash.startsWith("/") ? oldHash : "/" + oldHash;
  const allowed = [
    "/",
    "/records",
    "/cases",
    "/etiquette",
    "/account",
    "/admin",
    "/login",
    "/register",
  ];
  if (
    ["/", "/hub"].includes(location.pathname) &&
    oldHash &&
    allowed.includes(legacyPath.split("?")[0])
  ) {
    history.replaceState(null, "", legacyPath);
    return true;
  }
  if (location.pathname === "/hub") {
    history.replaceState(null, "", "/records");
    return true;
  }
  return false;
}
moveLegacyAddress();
window.addEventListener("hashchange", () => {
  if (moveLegacyAddress()) window.dispatchEvent(new PopStateEvent("popstate"));
});
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

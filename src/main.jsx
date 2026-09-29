import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/base.css";
import "./styles/hub.css";
import "./styles/react.css";

// 기존에 공유한 /hub#records 등의 주소도 새 React 화면으로 연결합니다.
const oldHash = window.location.hash.slice(1);
if (oldHash && !oldHash.startsWith("/")) {
  history.replaceState(
    null,
    "",
    location.pathname + location.search + "#/" + oldHash,
  );
} else if (!oldHash && location.pathname === "/hub") {
  history.replaceState(null, "", "/hub#/records");
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);

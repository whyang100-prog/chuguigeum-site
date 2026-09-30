import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// 빌드 시 공개 화면만 HTML로 만듭니다. 회원 정보나 DB 토큰은 읽지 않습니다.
export function render(path) {
  return renderToString(
    <StaticRouter location={path}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StaticRouter>,
  );
}

// 서버 API 호출은 이 함수로 통일합니다. DB 토큰은 브라우저로 보내지 않습니다.
export async function api(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers:
      method === "GET"
        ? {}
        : {
            "Content-Type": "application/json",
            "X-Requested-With": "chuguigeum",
          },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/api/auth/login", "/api/auth/register"].includes(path)
    ) {
      window.dispatchEvent(new Event("session-expired"));
    }
    const error = new Error(data.error || "요청을 처리하지 못했어요.");
    error.status = response.status;
    throw error;
  }
  return data;
}

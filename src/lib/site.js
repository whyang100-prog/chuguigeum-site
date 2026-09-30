// 도메인을 변경한다면 이 주소를 변경하고 다시 빌드합니다.
export const SITE_ORIGIN = "https://chuguigeum-how-much.onrender.com";
export const publicPaths = ["/", "/etiquette"];
export const appPaths = [
  "/",
  "/etiquette",
  "/login",
  "/register",
  "/records",
  "/cases",
  "/account",
  "/admin",
];
export function pageMetadata(path) {
  if (path === "/etiquette")
    return {
      title: "결혼식·장례식 예절 가이드 | 축의금 얼마하지?",
      description:
        "한국 결혼식 하객 복장과 주의사항, 장례식 복장과 종교별 조문 예절을 확인하세요.",
    };
  return {
    title: "축의금 얼마하지? — 마음에 맞는 축의금 계산기",
    description:
      "예식장 식대와 친밀도, 식사 인원을 고려해 나에게 맞는 축의금 참고 금액을 계산해 보세요.",
  };
}

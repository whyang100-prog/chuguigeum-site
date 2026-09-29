export const names = {
  wedding: "축의금",
  funeral: "조의금",
  paid: "낸 돈",
  received: "받은 돈",
  acquaintance: "가끔 보는 사이",
  colleague: "자주 보는 사이",
  close: "가까운 사이",
  best: "아주 특별한 사이",
  meal: "식사 참석",
  "no-meal": "참석 · 식사 안 함",
  absent: "불참",
  pending: "검토 대기",
  approved: "공개 중",
  rejected: "반려",
  active: "활성",
  suspended: "정지",
  member: "회원",
  admin: "관리자",
};
export const relations = ["acquaintance", "colleague", "close", "best"];
export const attendanceOptions = ["meal", "no-meal", "absent"];
export const regions = [
  "전체",
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "대전",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
].filter((x, i, all) => all.indexOf(x) === i);
export const won = (value) => Number(value).toLocaleString("ko-KR") + "원";
export function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

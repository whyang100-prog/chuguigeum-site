import en from "./en.json" with { type: "json" };
import ja from "./ja.json" with { type: "json" };

export const catalogs = { en, ja };
export const languages = ["ko", "en", "ja"];

// 한국어 문장을 키로 사용합니다. {0}, {1}에는 금액·인원 등이 들어갑니다.
export function translate(language, key, values = []) {
  const template = catalogs[language]?.[key] ?? key;
  return template.replace(/\{(\d+)\}/g, (match, index) =>
    values[index] === undefined ? match : String(values[index]),
  );
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const messagePatterns = Object.keys(en).flatMap((key) =>
  [key, en[key], ja[key]].map((template) => {
    const indexes = [];
    const parts = template.split(/(\{\d+\})/g).map((part) => {
      const placeholder = part.match(/^\{(\d+)\}$/);
      if (!placeholder) return escapeRegex(part);
      indexes.push(Number(placeholder[1]));
      return "([\\s\\S]*?)";
    });
    return { key, indexes, pattern: new RegExp("^" + parts.join("") + "$") };
  }),
);

// 서버의 오류와 저장 완료 메시지만 번역합니다. 사용자 글에는 사용하지 않습니다.
// 이미 표시된 알림도 언어를 바꾸면 새 언어로 다시 표시합니다.
export function translateMessage(language, message) {
  if (typeof message !== "string") return message;
  for (const { key, indexes, pattern } of messagePatterns) {
    const match = message.match(pattern);
    if (!match) continue;
    const values = [];
    indexes.forEach((index, position) => {
      values[index] = match[position + 1];
    });
    if (key === "{0}: {1}~{2}자로 입력해 주세요.") {
      values[0] = translateMessage(language, values[0]);
    }
    return translate(language, key, values);
  }
  return message;
}

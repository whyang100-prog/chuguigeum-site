import { useSyncExternalStore } from "react";
import { languages, translate, translateMessage } from "./translations.js";

const storageKey = "gift-language";
const listeners = new Set();
let language = "ko";
try {
  const saved = localStorage.getItem(storageKey);
  if (languages.includes(saved)) language = saved;
} catch {
  // 저장 공간을 사용할 수 없어도 현재 화면에서 언어를 바꿀 수 있습니다.
}

export const getLanguage = () => language;
export const t = (key, values) => translate(language, key, values);
export const systemMessage = (message) => translateMessage(language, message);

function updateDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
}

export function setLanguage(next) {
  if (!languages.includes(next)) return;
  language = next;
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    // 시크릿 모드 등의 저장 제한은 화면 동작을 막지 않습니다.
  }
  updateDocument();
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 이 Hook을 호출한 React 컴포넌트만 언어 변경에 맞춰 다시 렌더링됩니다.
export function useLanguage() {
  const current = useSyncExternalStore(subscribe, getLanguage, () => "ko");
  return { language: current, setLanguage, t };
}

updateDocument();
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    language = languages.includes(event.newValue) ? event.newValue : "ko";
    updateDocument();
    listeners.forEach((listener) => listener());
  });
}

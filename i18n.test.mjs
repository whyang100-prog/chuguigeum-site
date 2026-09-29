import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogs,
  translate,
  translateMessage,
} from "./src/i18n/translations.js";

test("번역 사전의 언어별 누락과 금액·인원 자리표시자 검사", () => {
  assert.deepEqual(
    Object.keys(catalogs.en).sort(),
    Object.keys(catalogs.ja).sort(),
  );
  const placeholders = (text) =>
    [...text.matchAll(/\{\d+\}/g)].map(([value]) => value).sort();
  for (const [language, catalog] of Object.entries(catalogs)) {
    for (const [key, value] of Object.entries(catalog)) {
      assert.equal(typeof value, "string");
      assert.ok(value.length, `${language}: ${key}`);
      assert.deepEqual(
        placeholders(value),
        placeholders(key),
        `${language}: ${key}`,
      );
    }
  }
});

test("서버 오류의 동적 필드 번역과 기존 알림의 언어 변경", () => {
  const korean = "이름: 1~80자로 입력해 주세요.";
  const english = translateMessage("en", korean);
  assert.equal(english, "Name: enter between 1 and 80 characters.");
  assert.equal(
    translateMessage("ja", english),
    translate("ja", "{0}: {1}~{2}자로 입력해 주세요.", [
      translate("ja", "이름"),
      1,
      80,
    ]),
  );
  assert.equal(translateMessage("ko", english), korean);
  assert.equal(
    translateMessage("ja", "Record saved."),
    catalogs.ja["기록을 저장했어요."],
  );
  assert.equal(translate("en", "없는 키"), "없는 키");
  assert.equal(
    translateMessage("en", "unrecognized error 42"),
    "unrecognized error 42",
  );
});

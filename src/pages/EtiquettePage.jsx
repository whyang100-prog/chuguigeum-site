import { t, useLanguage } from "../i18n/index";
import { useState } from "react";
import { Heading } from "../components/Ui";
import { funeral } from "../data/etiquette";
export default function EtiquettePage() {
  useLanguage();
  const [religion, setReligion] = useState("general");
  return (
    <>
      <Heading title={t("처음 가도, 마음을 잘 전할 수 있도록")}>
        {t(
          "한국의 일반적인 방문 상황을 기준으로 정리했어요. 가족의 뜻과 현장 안내가 우선입니다.",
        )}
      </Heading>
      <div className="guide-grid">
        <section className="panel">
          <span className="eyebrow">{t("WEDDING")}</span>
          <h2>{t("결혼식 예절")}</h2>
          <h3>{t("단정하게, 주인공을 배려하며")}</h3>
          <ul>
            <li>
              {t(
                "초대장에 드레스코드가 있으면 먼저 확인하세요. 단정한 셔츠·슬랙스·재킷·원피스 등을 선택할 수 있어요.",
              )}
            </li>
            <li>
              {t(
                "신부 드레스와 비슷한 흰색·아이보리 전체 착장, 과도한 노출이나 화려한 장식은 피하는 편이 좋아요. 흰 셔츠 하나까지 금지라는 뜻은 아닙니다.",
              )}
            </li>
            <li>
              {t(
                "별도 안내가 없다면 슬리퍼·운동복처럼 지나치게 편한 복장은 피하세요.",
              )}
            </li>
          </ul>
          <h3>{t("방문 전·예식 중 주의할 점")}</h3>
          <ul>
            <li>
              {t(
                "참석 여부와 동반 인원은 미리 알려요. 초대받지 않은 동반자를 임의로 데려가지 않아요.",
              )}
            </li>
            <li>
              {t(
                "여유 있게 도착하고 휴대전화는 무음으로 해요. 늦었다면 진행요원의 안내에 따라 조용히 입장해요.",
              )}
            </li>
            <li>
              {t(
                "촬영 동선을 막지 않고, 사진의 공개·SNS 게시 의사를 먼저 확인해요.",
              )}
            </li>
            <li>
              {t(
                "과음이나 큰 소리, 주인공의 사생활·결혼 비용을 캐묻는 질문은 피하세요.",
              )}
            </li>
          </ul>
          <a
            href="https://www.directwedding.co.kr/blog/wedding-guest-manner"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("참고: 다이렉트결혼준비 — 결혼식 하객 복장")}
          </a>
          <p className="hint">
            {t(
              "국내 결혼 준비 업체의 하객 복장 안내를 참고한 편집 안내입니다. 정해진 금액이나 복장을 일률적으로 강요하는 규칙이 아니에요.",
            )}
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">{t("CONDOLENCE")}</span>
          <h2>{t("장례식 예절")}</h2>
          <h3>{t("차분한 복장과 짧은 위로")}</h3>
          <ul>
            <li>
              {t(
                "검정·짙은 남색·회색 등 차분하고 단정한 옷을 준비해요. 화려한 무늬, 큰 장신구, 과도한 노출은 피하세요.",
              )}
            </li>
            <li>
              {t(
                "맨발이 드러나지 않도록 양말과 단정한 신발을 준비하면 좋아요.",
              )}
            </li>
            <li>
              {t(
                "사망 경위나 재산 문제를 캐묻지 않고, 유족의 반응과 슬픔의 크기를 평가하지 않아요.",
              )}
            </li>
            <li>
              {t(
                "사진 촬영과 SNS 게시를 삼가고, 큰 웃음·건배·과음은 피하세요.",
              )}
            </li>
          </ul>
          <h3>{t("종교별 인사 방법")}</h3>
          <div className="religions" role="group" aria-label={t("장례 방식")}>
            {Object.entries(funeral).map(([key, [label]]) => (
              <button
                className="secondary"
                key={key}
                aria-pressed={religion === key}
                onClick={() => setReligion(key)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <div className="religion-body" aria-live="polite">
            {t(funeral[religion][1])}
          </div>
          <p className="callout">
            {t("무슨 말을 해야 할지 모르겠다면")}
            <br />
            <b>{t("“깊은 위로의 말씀을 드립니다.”")}</b>
            <br />
            {t("짧게 마음을 전하고 유족이 쉴 시간을 배려해 주세요.")}
          </p>
          <a
            href="https://www.kuh.ac.kr/funeral/info/knowledge.do"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("참고: 건국대학교병원 — 종교별 조문예절")}
          </a>
          <p className="hint">
            {t(
              "같은 종교도 교단·가정에 따라 다릅니다. 종교명만으로 절·분향 여부를 단정하지 말고 유족과 진행자의 뜻을 확인하세요.",
            )}
          </p>
        </section>
      </div>
      <p className="hint">
        {t(
          "안내 정리: 2026-09-29 · 의식의 세부 절차는 해당 빈소나 예식 진행자에게 확인해 주세요.",
        )}
      </p>
    </>
  );
}

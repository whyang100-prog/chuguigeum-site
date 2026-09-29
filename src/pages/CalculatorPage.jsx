import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { calculate } from "../lib/calculator";
import { relations, names, won } from "../lib/labels";
import VenuePicker from "../components/VenuePicker";
import CommunitySummary from "../components/CommunitySummary";

export default function CalculatorPage() {
  // useState가 입력값을 기억합니다. 값이 바뀌면 React가 결과를 다시 그립니다.
  const [relation, setRelation] = useState("colleague");
  const [attendance, setAttendance] = useState("meal");
  const [people, setPeople] = useState(1);
  const [meal, setMeal] = useState("");
  const [selected, setSelected] = useState(null);
  let result = null;
  let error = "";
  try {
    result = calculate({
      relation,
      attendance,
      people,
      meal: meal === "" ? null : Number(meal),
    });
  } catch (err) {
    error = err.message;
  }

  useEffect(() => {
    // 지원하는 브라우저에서만 계산 도구를 연결하는 선택 기능입니다.
    const context = document.modelContext;
    if (!context?.registerTool) return;
    try {
      Promise.resolve(
        context.registerTool({
          name: "calculate_wedding_gift",
          description:
            "친밀도, 참석 방식, 식대와 인원으로 축의금 참고 금액을 계산합니다.",
          inputSchema: {
            type: "object",
            properties: {
              relation: { type: "string", enum: relations },
              attendance: {
                type: "string",
                enum: ["meal", "no-meal", "absent"],
              },
              people: { type: "integer", minimum: 1, maximum: 10 },
              meal: { type: ["number", "null"], minimum: 0, maximum: 1000000 },
            },
            required: ["relation", "attendance", "people", "meal"],
            additionalProperties: false,
          },
          execute: async (input) => {
            const output = calculate(input);
            setRelation(input.relation);
            setAttendance(input.attendance);
            setPeople(input.people);
            setMeal(input.meal ?? "");
            setSelected(null);
            return {
              content: [{ type: "text", text: JSON.stringify(output) }],
            };
          },
        }),
      ).catch(() => {});
    } catch {
      /* 미지원 브라우저에서도 계산기는 동작합니다. */
    }
    return () => {
      try {
        context.unregisterTool?.("calculate_wedding_gift");
      } catch {
        /* 선택 기능 */
      }
    };
  }, []);

  const descriptions = [
    "안부를 나누는 지인",
    "직장 동료 · 친구",
    "따로 자주 만나는 친구",
    "절친 · 가까운 가족",
  ];
  return (
    <>
      <div className="intro">
        <span className="eyebrow">축하하는 마음, 부담 없는 선택</span>
        <h1>
          마음은 정했는데,
          <br className="mobile" /> 금액이 고민이라면.
        </h1>
        <p>예식장 식대와 우리 사이를 함께 생각해 봐요.</p>
      </div>
      <div className="workspace">
        <div className="inputs">
          <section className="panel">
            <div className="section-title">
              <span className="step">01</span>
              <h2>어디서 결혼하나요?</h2>
              <span className="small muted">예식장 선택은 자유예요</span>
            </div>
            <VenuePicker
              selected={selected}
              onSelect={(venue) => {
                setSelected(venue);
                setMeal(venue.meal ?? "");
              }}
            />
            <div className="manual">
              <label htmlFor="meal">
                알고 있는 식대가 있나요?
                <small>직접 입력하면 이 금액으로 계산해요.</small>
              </label>
              <div className="money-input">
                <input
                  id="meal"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  placeholder="미입력"
                  value={meal}
                  onChange={(e) => {
                    setMeal(e.target.value);
                    setSelected(null);
                  }}
                />
                <span>원</span>
              </div>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="section-title">
              <span className="step">02</span>
              <h2>두 분은 얼마나 가까운가요?</h2>
            </div>
            <div className="relationships">
              {relations.map((value, index) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="relation"
                    value={value}
                    checked={relation === value}
                    onChange={() => setRelation(value)}
                  />
                  <span>
                    <b>{names[value]}</b>
                    <small>{descriptions[index]}</small>
                  </span>
                  <i>0{index + 1}</i>
                </label>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="section-title">
              <span className="step">03</span>
              <h2>식사도 함께하나요?</h2>
            </div>
            <div className="attendance">
              {[
                ["meal", "참석하고 식사해요"],
                ["no-meal", "식사하지 않아요"],
                ["absent", "마음만 전해요"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="attendance"
                    checked={attendance === value}
                    onChange={() => setAttendance(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="guest-row">
              <div>
                식사 인원<small>본인 포함 · 성인 식대 기준</small>
              </div>
              <div className="stepper">
                <button
                  aria-label="식사 인원 한 명 줄이기"
                  disabled={attendance !== "meal" || people <= 1}
                  onClick={() => setPeople((n) => n - 1)}
                >
                  −
                </button>
                <output aria-label="식사 인원">{people}</output>
                <button
                  aria-label="식사 인원 한 명 늘리기"
                  disabled={attendance !== "meal" || people >= 10}
                  onClick={() => setPeople((n) => n + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </section>
        </div>
        <aside>
          <section className="result" aria-labelledby="result-title">
            <div className="result-top">
              <span className="eyebrow">나의 축의금 가이드</span>
              <span className="seal" aria-hidden="true">
                祝
              </span>
            </div>
            <h2 id="result-title">이 정도 마음을 전해볼까요?</h2>
            <div className="amount" aria-live="polite">
              <strong data-testid="calculated-amount">
                {result ? result.amount / 10000 : "—"}
              </strong>
              <span>만원</span>
            </div>
            <p className="range">
              {result
                ? `참고 범위 ${result.amount / 10000}–${result.upper / 10000}만원`
                : "입력한 식대를 확인해 주세요."}
            </p>
            <div className="result-divider" />
            {result && (
              <>
                <dl>
                  <div>
                    <dt>우리 사이의 기준</dt>
                    <dd>{won(result.base)}</dd>
                  </div>
                  <div>
                    <dt>식사 비용 참고</dt>
                    <dd>
                      {attendance !== "meal"
                        ? "계산에 반영하지 않음"
                        : result.mealTotal === null
                          ? "식대 미입력"
                          : won(result.mealTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt>참석 방식</dt>
                    <dd>
                      {names[attendance]}{" "}
                      {attendance === "meal" && `· ${people}명`}
                    </dd>
                  </div>
                </dl>
                <p className="explanation">
                  {result.mealTotal === null
                    ? "친밀도 기본 금액을 반영했어요."
                    : `친밀도 기준 ${won(result.base)}과 식사 비용 ${won(result.mealTotal)} 중 큰 금액을 5만원 단위로 올림했어요.`}
                </p>
              </>
            )}
            <div className="kind-note">
              금액보다 중요한 건 축하하는 마음.
              <br />내 형편에 맞게 정해도 괜찮아요.
            </div>
          </section>
          <section className="result-community">
            <b>같은 조건의 사용자 사례</b>
            <CommunitySummary
              filters={{ kind: "wedding", relation, attendance, people }}
            />
            <Link to="/cases">사례 보기 · 내 경험 나누기</Link>
            <p className="hint">
              최근 24개월 · 회원별 최근 승인 사례 1건 · 자기보고 자료. 기존 참고
              금액에는 자동 합산하지 않습니다.
            </p>
          </section>
          <div className="aside-note">
            <b>정답이 아닌, 선택을 돕는 기준이에요.</b>
            <p>
              추천 금액은 통계나 사회적 의무가 아닌 서비스의 계산 규칙입니다.
              예식 비용을 하객이 반드시 부담해야 하는 것은 아니에요.
            </p>
          </div>
        </aside>
      </div>
      <section className="guide">
        <div>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>이렇게 계산했어요.</h2>
        </div>
        <div>
          <details>
            <summary>친밀도에 따른 기준 금액</summary>
            <p>
              가끔 보는 사이 5만원, 자주 보는 사이 10만원, 가까운 사이 15만원,
              아주 특별한 사이 20만원을 시작점으로 사용해요. 서비스의 예시
              규칙이며 조사 통계가 아닙니다.
            </p>
          </details>
          <details>
            <summary>식대와 동반 인원은 어떻게 반영하나요?</summary>
            <p>
              식사할 경우 친밀도 기준과 입력한 식대 × 식사 인원 중 큰 금액을
              5만원 단위로 올림해요. 식대가 없거나 식사하지 않으면 친밀도만
              반영합니다. 참고 범위는 계산 금액부터 5만원 위까지예요. 동반자도
              성인 요금으로 계산하므로 어린이는 실제 합산 금액을 고려해
              조정하세요.
            </p>
          </details>
          <details>
            <summary>식대는 얼마나 정확한가요?</summary>
            <p>
              각 예식장에 출처와 자료 확인일을 표시합니다. 자료 확인일은 계약가
              적용일이 아니에요. 공개된 일부 정보만 수록했으며 최신 가격은
              업체에 확인해 주세요. 가격 미공개 업체는 임의 금액을 채우지
              않습니다.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}

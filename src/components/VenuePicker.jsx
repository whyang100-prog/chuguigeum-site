import { useState } from "react";
import { useRemote } from "../hooks/useRemote";
import { regions, won } from "../lib/labels";
import { RemoteStatus } from "./Ui";
export default function VenuePicker({ selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("전체");
  const [limit, setLimit] = useState(6);
  const result = useRemote("/api/venues");
  const matches = (result.data?.venues || []).filter(
    (v) =>
      (region === "전체" || v.region === region) &&
      `${v.name} ${v.district}`.includes(query.trim()),
  );
  return (
    <>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="예식장 검색"
          type="search"
          placeholder="예식장 이름 또는 시·군·구 검색"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(6);
          }}
        />
      </label>
      <div className="regions" aria-label="지역 필터">
        {regions.map((item) => (
          <button
            key={item}
            aria-pressed={region === item}
            onClick={() => {
              setRegion(item);
              setLimit(6);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <RemoteStatus {...result} />
      {result.error && (
        <p className="hint">식대를 직접 입력해 계산할 수 있어요.</p>
      )}
      {result.data && (
        <>
          <div className="list-meta">
            <span role="status">예식장 {matches.length}곳</span>
            <span>1인 식대</span>
          </div>
          <div className="venues">
            {matches.slice(0, limit).map((v) => (
              <div className="venue" key={v.id}>
                <button
                  aria-pressed={selected?.id === v.id}
                  onClick={() => onSelect(v)}
                >
                  <b>{v.name}</b>
                  <small>
                    {v.region} · {v.district}
                  </small>
                  <small>자료 확인 {v.checkedAt}</small>
                </button>
                <div className="price">
                  <b>{v.meal === null ? "가격 미공개" : won(v.meal)}</b>
                  <small>
                    <a
                      href={v.source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {v.sourceName || "출처 확인"}
                    </a>
                  </small>
                </div>
              </div>
            ))}
            {!matches.length && (
              <p className="empty">
                검색 결과가 없어요. 식대를 직접 입력해 주세요.
              </p>
            )}
          </div>
          {matches.length > limit && (
            <button className="more" onClick={() => setLimit((n) => n + 12)}>
              더 보기
            </button>
          )}
        </>
      )}
      <p className="data-note">
        일부 예식장의 공개 참고가입니다. 최신 계약가·전국 전체 목록이 아니며
        날짜·메뉴·세금 포함 여부에 따라 달라질 수 있어요.
      </p>
      {selected && (
        <p className="selected-info">
          선택: {selected.name} · 자료 확인 {selected.checkedAt} · 가격 적용일
          미확인. 최신 견적은 업체에 확인해 주세요.
        </p>
      )}
    </>
  );
}

const $ = (id) => document.getElementById(id);
let me = null;
let records = [];
let editing = null;
let viewVersion = 0;
const names = {
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
const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const options = (keys, selected) =>
  keys
    .map(
      (k) =>
        `<option value="${k}" ${k === selected ? "selected" : ""}>${names[k] || k}</option>`,
    )
    .join("");
const relationOptions = () =>
  options(["acquaintance", "colleague", "close", "best"], "colleague");
const select = (name, label, opts) =>
  `<label>${label}<select name="${name}">${opts}</select></label>`;
const input = (name, label, type = "text", extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" ${extra}></label>`;
function notice(s) {
  $("notice").textContent = s;
}
async function api(path, method = "GET", data) {
  const r = await fetch(path, {
    method,
    headers:
      method === "GET"
        ? {}
        : {
            "Content-Type": "application/json",
            "X-Requested-With": "chuguigeum",
          },
    body: data ? JSON.stringify(data) : undefined,
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || "요청을 처리하지 못했어요.");
  return b;
}
function bindForm(id, fn) {
  $(id).onsubmit = async (e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector("[type=submit]");
    button.disabled = true;
    try {
      await fn(Object.fromEntries(new FormData(e.currentTarget)));
    } catch (err) {
      notice(err.message);
    } finally {
      button.disabled = false;
    }
  };
}
function heading(title, sub) {
  return `<div class="page-heading"><h1>${title}</h1><p>${sub}</p></div>`;
}
function needLogin() {
  if (me) return false;
  $("view").innerHTML =
    heading(
      "나만의 경조사 기록",
      "로그인하면 기기가 바뀌어도 기록이 이어져요.",
    ) +
    '<div class="empty-state"><h2>로그인하고 시작해 주세요</h2><p>개인 기록은 공개 사례에 자동으로 공유되지 않아요.</p><a href="#login" class="primary">로그인 / 회원가입</a></div>';
  return true;
}
function nav() {
  $("account-nav").innerHTML = me
    ? `<a href="#account">${esc(me.username)}</a><button class="secondary" id="logout">로그아웃</button>`
    : '<a href="#login">로그인 / 회원가입</a>';
  $("admin-nav").hidden = me?.role !== "admin";
  if (me)
    $("logout").onclick = async () => {
      try {
        await api("/api/auth/logout", "POST", {});
        me = null;
        nav();
        location.hash = "login";
      } catch (e) {
        notice(e.message);
      }
    };
}
function auth(register = false) {
  $("view").innerHTML =
    `<section class="panel auth-panel"><h2>${register ? "회원가입" : "다시 만나 반가워요"}</h2><form id="auth" class="hub-form">${input("username", "아이디", "text", 'required minlength="4" maxlength="24" pattern="[a-zA-Z0-9_]+" autocomplete="username" placeholder="영문·숫자·밑줄 4~24자"')}${input("password", "비밀번호", "password", `required minlength="10" maxlength="128" autocomplete="${register ? "new-password" : "current-password"}" placeholder="10자 이상"`)}${register ? '<label class="check"><input name="consent" type="checkbox" required> 아이디·암호화된 비밀번호를 계정 유지에 사용하고, 개인 기록을 탈퇴 시까지 저장하는 데 동의합니다. 기록과 공개 사례는 언제든 삭제할 수 있습니다.</label>' : ""}<button type="submit" class="primary">${register ? "가입하고 시작" : "로그인"}</button></form><p class="hint">이메일은 수집하지 않으며 이메일 인증·비밀번호 찾기는 제공하지 않습니다. 아이디와 비밀번호를 안전하게 보관해 주세요.</p><a href="#${register ? "login" : "register"}">${register ? "이미 계정이 있어요" : "처음이라면 회원가입"}</a></section>`;
  bindForm("auth", async (b) => {
    const r = await api(
      "/api/auth/" + (register ? "register" : "login"),
      "POST",
      { ...b, consent: b.consent === "on" },
    );
    me = r.user;
    nav();
    notice("로그인했어요.");
    location.hash = "records";
  });
}
async function recordPage(version) {
  if (needLogin()) return;
  const data = await api("/api/records");
  if (version !== viewVersion) return;
  records = data.records;
  editing = null;
  $("view").innerHTML =
    heading(
      "기억하고 싶은 마음의 기록",
      "축의금과 조의금, 낸 돈과 받은 돈을 한곳에. 이 기록은 본인에게만 보여요.",
    ) +
    `<div class="hub-grid"><section class="panel"><h2 id="record-title">새 기록 남기기</h2><form class="hub-form" id="record-form"><div class="two">${select("kind", "종류", options(["wedding", "funeral"]))}${select("direction", "구분", options(["paid", "received"]))}</div>${input("person", "상대 이름 또는 별칭", "text", 'required maxlength="50" placeholder="예: 대학 동기 김○○"')}<div class="two">${input("amount", "금액 (원)", "number", 'required min="0" max="100000000" step="1"')}${input("event_date", "날짜", "date", "required")}</div>${select("relation", "우리 사이", relationOptions())}<label>메모<textarea name="memo" maxlength="500" placeholder="나중에 기억하고 싶은 내용"></textarea></label><button class="primary" type="submit">기록 저장</button><button id="cancel-edit" type="button" class="secondary" hidden>수정 취소</button></form></section><section><div id="record-stats" class="stats"></div><div class="filters"><input id="record-query" type="search" placeholder="이름·메모 검색" aria-label="기록 검색"><select id="record-kind" aria-label="기록 종류"><option value="">모든 종류</option>${options(["wedding", "funeral"])}</select><select id="record-direction" aria-label="수입 지출"><option value="">낸 돈·받은 돈</option>${options(["paid", "received"])}</select></div><div id="record-list"></div></section></div>`;
  $("record-form").elements.event_date.value = new Date().toLocaleDateString(
    "sv-SE",
    { timeZone: "Asia/Seoul" },
  );
  bindForm("record-form", async (b) => {
    await api(
      "/api/records" + (editing ? "/" + editing : ""),
      editing ? "PUT" : "POST",
      { ...b, amount: Number(b.amount) },
    );
    notice("기록을 저장했어요.");
    render();
  });
  $("cancel-edit").onclick = () => render();
  ["record-query", "record-kind", "record-direction"].forEach(
    (id) => ($(id).oninput = renderRecords),
  );
  renderRecords();
}
function renderRecords() {
  const q = $("record-query").value.toLowerCase();
  const rows = records.filter(
    (r) =>
      (!$("record-kind").value || r.kind === $("record-kind").value) &&
      (!$("record-direction").value ||
        r.direction === $("record-direction").value) &&
      `${r.person} ${r.memo}`.toLowerCase().includes(q),
  );
  $("record-stats").innerHTML = [
    ["기록", rows.length + "건"],
    [
      "낸 돈",
      won(
        rows
          .filter((r) => r.direction === "paid")
          .reduce((a, r) => a + Number(r.amount), 0),
      ),
    ],
    [
      "받은 돈",
      won(
        rows
          .filter((r) => r.direction === "received")
          .reduce((a, r) => a + Number(r.amount), 0),
      ),
    ],
  ]
    .map(
      ([k, v]) =>
        `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`,
    )
    .join("");
  $("record-list").innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<article class="item"><div class="item-top"><div><h3>${esc(r.person)}</h3><span class="tag">${names[r.kind]} · ${names[r.direction]}</span><span class="hint">${esc(r.event_date)}</span></div><b class="amount-small">${won(r.amount)}</b></div><p>${esc(r.memo)}</p><span class="hint">${names[r.relation]}</span><div class="item-actions"><button class="secondary" data-edit="${r.id}">수정</button><button class="danger" data-delete="${r.id}">삭제</button></div></article>`,
        )
        .join("")
    : '<div class="empty-state"><h2>아직 기록이 없어요</h2><p>첫 기록을 남기거나 검색 조건을 바꿔 보세요.</p></div>';
  document.querySelectorAll("[data-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = records.find((r) => r.id === b.dataset.edit);
        editing = r.id;
        for (const key of [
          "kind",
          "direction",
          "person",
          "amount",
          "event_date",
          "relation",
          "memo",
        ])
          $("record-form").elements[key].value = r[key];
        $("record-title").textContent = "기록 수정";
        $("cancel-edit").hidden = false;
        $("record-form").scrollIntoView({ behavior: "smooth" });
      }),
  );
  document.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm("이 개인 기록을 삭제할까요? 복구할 수 없습니다.")) return;
        try {
          await api("/api/records/" + b.dataset.delete, "DELETE", {});
          notice("기록을 삭제했어요.");
          render();
        } catch (e) {
          notice(e.message);
        }
      }),
  );
}
async function casesPage(version) {
  $("view").innerHTML =
    heading(
      "이런 사이, 이만큼 전했어요",
      "회원이 직접 남긴 경험을 살펴보세요. 실제 지급 여부를 증명한 자료는 아닙니다.",
    ) +
    `<div class="filters"><select id="case-kind" aria-label="경조사 종류">${options(["wedding", "funeral"])}</select><select id="case-relation" aria-label="친밀도">${relationOptions()}</select><select id="case-attendance" aria-label="참석 방식">${options(["meal", "no-meal", "absent"])}</select><select id="case-people" aria-label="본인 포함 인원">${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">본인 포함 ${i + 1}명</option>`).join("")}</select></div><div id="community-stats" class="callout"></div><div class="hub-grid"><section><div id="case-list"></div></section><section class="panel"><h2>나의 경험 나누기</h2>${me ? `<p class="hint">직접 낸 경험만 작성해 주세요. 상대 이름, 회사, 연락처 등 개인을 알아볼 수 있는 내용은 쓰지 마세요.</p><form id="case-form" class="hub-form"><div class="two">${select("kind", "종류", options(["wedding", "funeral"]))}${select("relation", "친밀도", relationOptions())}</div>${input("amount", "실제로 낸 총액 (원)", "number", 'required min="10000" max="10000000" step="1"')}<div class="two">${select("attendance", "참석 방식", options(["meal", "no-meal", "absent"]))}${input("people", "본인 포함 인원", "number", 'required value="1" min="1" max="10"')}</div>${input("event_month", "행사 월", "month", "required")}<label>어떤 사이였고, 왜 이 금액을 정했나요?<textarea name="story" required minlength="10" maxlength="500" placeholder="관계, 연락 빈도, 결정한 이유를 알려 주세요."></textarea></label><label class="check"><input name="consent" type="checkbox" required> 실제로 낸 경험이며, 금액·관계·참석 방식·인원·행사 월·설명의 익명 공개와 통계 활용에 동의합니다. 관리자는 작성 계정을 확인할 수 있습니다.</label><button class="primary" type="submit">검토 요청하기</button></form><div id="my-cases"></div>` : '<p>로그인하면 경험을 등록할 수 있어요.</p><a href="#login">로그인하기</a>'}</section></div><p class="hint">집계: 최근 24개월 행사, 같은 종류·친밀도·참석 방식·인원에 대해 회원별 가장 최근 승인 사례 1건. 참여자 5명 이상일 때 중앙값을 표시합니다. 자발적 참여 표본이므로 전체 하객의 기준으로 일반화할 수 없어요. 관리자 승인은 게시 기준 검토이며 지급 사실 인증이 아닙니다.</p>`;
  let requestNo = 0;
  async function load() {
    const n = ++requestNo;
    try {
      const params = new URLSearchParams({
        kind: $("case-kind").value,
        relation: $("case-relation").value,
        attendance: $("case-attendance").value,
        people: $("case-people").value,
      });
      const r = await api("/api/community?" + params);
      if (version !== viewVersion || n !== requestNo) return;
      $("community-stats").textContent =
        `같은 조건의 참여자 ${r.count}명 · ${r.median === null ? "5명 이상 모이면 중앙값을 보여드려요." : "낸 금액 중앙값 " + won(r.median)}`;
      $("case-list").innerHTML = r.cases.length
        ? r.cases
            .map(
              (c) =>
                `<article class="item"><div class="item-top"><span class="tag">익명 · 본인 작성 사례</span><b class="amount-small">${won(c.amount)}</b></div><p>${esc(c.story)}</p><small>행사 ${esc(c.event_month)} · 관리자 게시 승인</small></article>`,
            )
            .join("")
        : '<div class="empty-state"><h2>아직 공개된 사례가 없어요</h2><p>첫 경험이 다음 사람의 선택에 도움이 됩니다.</p></div>';
    } catch (e) {
      notice(e.message);
    }
  }
  ["case-kind", "case-relation", "case-attendance", "case-people"].forEach(
    (id) => ($(id).onchange = load),
  );
  await load();
  if (me && version === viewVersion) {
    bindForm("case-form", async (b) => {
      await api("/api/cases", "POST", {
        ...b,
        amount: Number(b.amount),
        people: Number(b.people),
        consent: b.consent === "on",
      });
      notice("사례가 접수됐어요. 승인 후 공개됩니다.");
      render();
    });
    const mine = await api("/api/cases");
    if (version !== viewVersion) return;
    $("my-cases").innerHTML =
      "<h3>내가 등록한 사례</h3>" +
      mine.cases
        .map(
          (c) =>
            `<div class="item"><span class="tag">${names[c.status]}</span> ${won(c.amount)}<p>${esc(c.story)}</p><button class="danger" data-withdraw="${c.id}">사례 삭제 / 공개 철회</button></div>`,
        )
        .join("");
    document.querySelectorAll("[data-withdraw]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (!confirm("사례를 삭제하고 통계에서도 제외할까요?")) return;
          try {
            await api("/api/cases/" + b.dataset.withdraw, "DELETE", {});
            render();
          } catch (e) {
            notice(e.message);
          }
        }),
    );
  }
}
const funeral = {
  general: [
    "종교를 모르겠다면",
    "빈소 안내를 먼저 확인하고 “어떤 방식으로 인사드리면 될까요?”라고 조용히 물어보세요. 분향·헌화와 절·묵념은 가족의 방식에 맞춥니다. 자신의 신앙과 다르면 정중히 설명하고 묵념으로 애도를 표현할 수 있어요.",
  ],
  buddhist: [
    "불교·전통식",
    "일반적으로 분향 후 영정 앞에서 절하고 상주에게 인사합니다. 향의 불꽃은 입으로 불지 말고 가볍게 흔들어 끕니다. 절의 횟수와 세부 절차는 빈소 안내를 따르세요.",
  ],
  protestant: [
    "개신교식",
    "대체로 헌화 후 묵념이나 기도로 애도합니다. 영정 앞 절을 하지 않는 경우가 많으며, 상주와의 인사 방식도 가족마다 다릅니다. 예배 중에는 조용히 기다리고 진행자의 안내를 따르세요.",
  ],
  catholic: [
    "천주교식",
    "헌화·분향, 묵념이나 기도로 애도하며 가정에 따라 절을 하기도 합니다. 연도나 장례미사 중에는 진행을 방해하지 않고 안내를 따릅니다. 다른 종교인에게 기도나 의식 참여를 강요하지 않습니다.",
  ],
};
function etiquette() {
  $("view").innerHTML =
    heading(
      "처음 가도, 마음을 잘 전할 수 있도록",
      "한국의 일반적인 방문 상황을 기준으로 정리했어요. 가족의 뜻과 현장 안내가 우선입니다.",
    ) +
    `<div class="guide-grid"><section class="panel"><span class="eyebrow">WEDDING</span><h2>결혼식 예절</h2><h3>단정하게, 주인공을 배려하며</h3><ul><li>초대장에 드레스코드가 있으면 먼저 확인하세요. 단정한 셔츠·슬랙스·재킷·원피스 등을 선택할 수 있어요.</li><li>신부 드레스와 비슷한 흰색·아이보리 전체 착장, 과도한 노출이나 화려한 장식은 피하는 편이 좋아요. 흰 셔츠 하나까지 금지라는 뜻은 아닙니다.</li><li>별도 안내가 없다면 슬리퍼·운동복처럼 지나치게 편한 복장은 피하세요.</li></ul><h3>방문 전·예식 중 주의할 점</h3><ul><li>참석 여부와 동반 인원은 미리 알려요. 초대받지 않은 동반자를 임의로 데려가지 않아요.</li><li>여유 있게 도착하고 휴대전화는 무음으로 해요. 늦었다면 진행요원의 안내에 따라 조용히 입장해요.</li><li>촬영 동선을 막지 않고, 사진의 공개·SNS 게시 의사를 먼저 확인해요.</li><li>과음이나 큰 소리, 주인공의 사생활·결혼 비용을 캐묻는 질문은 피하세요.</li></ul><a href="https://emilypost.com/advice/wedding-guest-attire" target="_blank" rel="noopener noreferrer">참고: Emily Post — 하객 복장</a><p class="hint">복장 참고자료와 국내 방문 상황을 고려한 편집 안내입니다. 정해진 금액이나 복장을 일률적으로 강요하는 규칙이 아니에요.</p></section><section class="panel"><span class="eyebrow">CONDOLENCE</span><h2>장례식 예절</h2><h3>차분한 복장과 짧은 위로</h3><ul><li>검정·짙은 남색·회색 등 차분하고 단정한 옷을 준비해요. 화려한 무늬, 큰 장신구, 과도한 노출은 피하세요.</li><li>맨발이 드러나지 않도록 양말과 단정한 신발을 준비하면 좋아요.</li><li>사망 경위나 재산 문제를 캐묻지 않고, 유족의 반응과 슬픔의 크기를 평가하지 않아요.</li><li>사진 촬영과 SNS 게시를 삼가고, 큰 웃음·건배·과음은 피하세요.</li></ul><h3>종교별 인사 방법</h3><div class="religions" role="group" aria-label="장례 방식">${Object.entries(
      funeral,
    )
      .map(
        ([k, v]) =>
          `<button class="secondary" data-religion="${k}" aria-pressed="${k === "general"}">${v[0]}</button>`,
      )
      .join(
        "",
      )}</div><div id="religion-body" class="religion-body"></div><p class="callout">무슨 말을 해야 할지 모르겠다면<br><b>“깊은 위로의 말씀을 드립니다.”</b><br>짧게 마음을 전하고 유족이 쉴 시간을 배려해 주세요.</p><a href="https://www.kuh.ac.kr/funeral/info/knowledge.do" target="_blank" rel="noopener noreferrer">참고: 건국대학교병원 — 종교별 조문예절</a><p class="hint">같은 종교도 교단·가정에 따라 다릅니다. 종교명만으로 절·분향 여부를 단정하지 말고 유족과 진행자의 뜻을 확인하세요.</p></section></div><p class="hint">안내 정리: 2026-09-29 · 의식의 세부 절차는 해당 빈소나 예식 진행자에게 확인해 주세요.</p>`;
  function pick(k) {
    $("religion-body").textContent = funeral[k][1];
    document
      .querySelectorAll("[data-religion]")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.religion === k));
  }
  pick("general");
  document
    .querySelectorAll("[data-religion]")
    .forEach((b) => (b.onclick = () => pick(b.dataset.religion)));
}
async function admin(version) {
  if (needLogin()) return;
  if (me.role !== "admin") {
    $("view").innerHTML = heading(
      "관리자 전용",
      "이 계정에는 접근 권한이 없습니다.",
    );
    return;
  }
  const [users, cases] = await Promise.all([
    api("/api/admin/users"),
    api("/api/admin/cases"),
  ]);
  if (version !== viewVersion) return;
  $("view").innerHTML =
    heading(
      "회원과 사례 관리",
      "회원의 비밀번호와 개인 경조사 기록은 표시하지 않습니다. 사례 승인 전에 개인정보와 게시 내용을 확인하세요.",
    ) +
    `<div class="guide-grid"><section><h2>회원 ${users.users.length}명</h2>${users.users.map((u) => `<article class="item"><h3>${esc(u.username)}</h3><span class="tag">${names[u.role]} · ${names[u.status]}</span><p class="hint">가입 ${esc(u.created_at.slice(0, 10))}</p>${u.role !== "admin" ? `<button class="${u.status === "active" ? "danger" : "secondary"}" data-user="${u.id}" data-status="${u.status === "active" ? "suspended" : "active"}">${u.status === "active" ? "계정 정지" : "정지 해제"}</button> <button class="danger" data-delete-member="${u.id}">회원 삭제</button>` : ""}</article>`).join("")}</section><section><h2>사례 검토 ${cases.cases.length}건</h2>${cases.cases.map((c) => `<article class="item"><h3>${esc(c.username)} · ${won(c.amount)}</h3><span class="tag">${names[c.status]}</span><p class="hint">${names[c.kind]} · ${names[c.relation]} · ${names[c.attendance]} · ${c.people}명 · ${esc(c.event_month)}</p><p>${esc(c.story)}</p><div class="item-actions"><button class="primary" data-case="${c.id}" data-status="approved">승인</button><button class="danger" data-case="${c.id}" data-status="rejected">반려 / 공개 중단</button><button class="danger" data-delete-case="${c.id}">사례 삭제</button></div></article>`).join("") || '<p class="empty-state">검토할 사례가 없어요.</p>'}</section></div>`;
  document.querySelectorAll("[data-delete-case]").forEach((button) => {
    button.onclick = async () => {
      const target = cases.cases.find(
        (item) => item.id === button.dataset.deleteCase,
      );
      if (!target) return;
      if (
        !confirm(
          `${target.username} · ${names[target.kind]} · ${won(target.amount)} · ${target.event_month}\n${target.story}\n\n이 사례를 영구 삭제할까요? 공개 목록과 통계에서 제외되며 복구할 수 없습니다.`,
        )
      )
        return;
      button.disabled = true;
      try {
        await api("/api/admin/cases/" + target.id, "DELETE", {
          confirmCaseId: target.id,
        });
        notice("사례를 삭제했어요.");
        await render();
      } catch (error) {
        notice(error.message);
      } finally {
        button.disabled = false;
      }
    };
  });
  document.querySelectorAll("[data-delete-member]").forEach((button) => {
    button.onclick = async () => {
      const target = users.users.find(
        (user) => user.id === button.dataset.deleteMember,
      );
      if (!target) return;
      const typed = prompt(
        `${target.username} 회원을 영구 삭제합니다.\n개인 경조사 기록, 공개 사례, 로그인 정보도 함께 삭제되며 복구할 수 없습니다.\n삭제하려면 회원 아이디를 정확히 입력하세요: ${target.username}`,
      );
      if (typed === null) return;
      if (typed !== target.username) {
        notice("아이디가 일치하지 않아 삭제하지 않았어요.");
        return;
      }
      button.disabled = true;
      try {
        await api("/api/admin/users/" + target.id, "DELETE", {
          confirmUsername: typed,
        });
        notice("회원과 관련 데이터를 삭제했어요.");
        await render();
      } catch (error) {
        notice(error.message);
      } finally {
        button.disabled = false;
      }
    };
  });
  document.querySelectorAll("[data-user],[data-case]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (
          !confirm(
            "선택한 상태로 변경할까요? 계정 정지는 기존 로그인도 해제합니다.",
          )
        )
          return;
        try {
          await api(
            "/api/admin/" +
              (b.dataset.user ? "users/" : "cases/") +
              (b.dataset.user || b.dataset.case),
            "PATCH",
            { status: b.dataset.status },
          );
          notice("변경했어요.");
          render();
        } catch (e) {
          notice(e.message);
        }
      }),
  );
}
function account() {
  if (needLogin()) return;
  $("view").innerHTML =
    heading("계정 설정", esc(me.username)) +
    `<div class="guide-grid"><section class="panel"><h2>비밀번호 변경</h2><form class="hub-form" id="password-form">${input("current", "현재 비밀번호", "password", 'required autocomplete="current-password"')}${input("password", "새 비밀번호", "password", 'required minlength="10" maxlength="128" autocomplete="new-password"')}<button type="submit" class="primary">변경하고 로그아웃</button></form></section>${me.role !== "admin" ? `<section class="panel"><h2>회원 탈퇴</h2><p>계정과 개인 기록, 공개 사례가 삭제됩니다. 복구할 수 없습니다.</p><form id="delete-account" class="hub-form">${input("password", "비밀번호 확인", "password", 'required autocomplete="current-password"')}<button class="danger" type="submit">탈퇴하기</button></form></section>` : ""}</div>`;
  bindForm("password-form", async (b) => {
    await api("/api/auth/password", "POST", b);
    me = null;
    nav();
    notice("비밀번호가 변경됐어요. 다시 로그인해 주세요.");
    location.hash = "login";
  });
  if ($("delete-account"))
    bindForm("delete-account", async (b) => {
      if (!confirm("계정과 모든 기록·사례를 영구 삭제할까요?")) return;
      await api("/api/auth/account", "DELETE", b);
      me = null;
      nav();
      notice("탈퇴가 완료됐어요.");
      location.hash = "login";
    });
}
async function render() {
  const version = ++viewVersion;
  const page = location.hash.slice(1) || "records";
  document
    .querySelectorAll(".hub-nav a")
    .forEach((a) => a.classList.toggle("active", a.hash === "#" + page));
  $("view").innerHTML = '<p role="status">불러오는 중…</p>';
  try {
    if (page === "login" || page === "register") auth(page === "register");
    else if (page === "records") await recordPage(version);
    else if (page === "cases") await casesPage(version);
    else if (page === "etiquette") etiquette();
    else if (page === "admin") await admin(version);
    else if (page === "account") account();
    else location.hash = "records";
  } catch (e) {
    if (version === viewVersion) {
      $("view").innerHTML =
        '<div class="empty-state">화면을 불러오지 못했어요. <button id="retry" class="secondary">다시 시도</button></div>';
      $("retry").onclick = render;
      notice(e.message);
    }
  }
}
try {
  me = (await api("/api/auth/me")).user;
} catch (e) {
  notice(e.message);
}
nav();
window.addEventListener("hashchange", render);
render();

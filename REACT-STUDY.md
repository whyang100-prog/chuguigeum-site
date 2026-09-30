# 이 프로젝트로 React 공부하기

## 먼저 알아둘 것

React는 화면을 담당하고 Node.js는 서버를 담당합니다. 서버·DB를 React로 바꾸는 것이 아닙니다.
기존 API를 유지하고, 문자열 HTML과 직접 DOM 조작을 React 컴포넌트로 바꿨습니다.
축의금 공식은 큰 값 선택 → 5만원 단위 올림을 유지했습니다. 기본금액+식대 합산 방식은 적용하지 않았습니다.

## 전체 파일 지도

| 파일                                | 역할                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| index.html                          | root 요소, 제목·설명·네이버 인증 메타태그                     |
| src/main.jsx                        | React 시작, HashRouter·AuthProvider 연결, 기존 hash 주소 호환 |
| src/App.jsx                         | URL과 페이지 연결, 로그인·관리자 접근 구분                    |
| src/components/Layout.jsx           | 공통 헤더·메뉴·로그아웃·footer·Outlet                         |
| src/components/ProtectedRoute.jsx   | 로그인 확인 후 자식 화면 표시                                 |
| src/components/Ui.jsx               | 공통 입력창·선택창·안내·로딩·오류 UI                          |
| src/components/VenuePicker.jsx      | 예식장 검색·지역 필터·더 보기·선택                            |
| src/components/CommunitySummary.jsx | 계산기 옆 로그인 회원용 사례 통계                             |
| src/pages/CalculatorPage.jsx        | 계산기 입력 상태와 결과                                       |
| src/pages/AuthPage.jsx              | 로그인·회원가입, 로그인 전 목적지 복귀                        |
| src/pages/RecordsPage.jsx           | 개인 기록 추가·검색·합계·수정·삭제                            |
| src/pages/CasesPage.jsx             | 사례 조건 필터·목록·등록·내 사례 철회                         |
| src/pages/EtiquettePage.jsx         | 결혼식·장례식 예절, 종교별 안내 선택                          |
| src/pages/AccountPage.jsx           | 비밀번호 변경·본인 탈퇴                                       |
| src/pages/AdminPage.jsx             | 회원 상태 변경·삭제, 사례 승인·반려·삭제                      |
| src/context/AuthContext.jsx         | 여러 화면에서 공유하는 로그인 상태                            |
| src/hooks/useRemote.js              | API 조회·로딩·오류·재조회·요청 취소                           |
| src/lib/api.js                      | fetch 요청·JSON·오류·세션 만료 처리                           |
| src/lib/calculator.js               | 화면과 분리된 계산 함수                                       |
| src/lib/labels.js                   | 선택지·다국어 표시·금액 포맷·날짜                             |
| src/data/etiquette.js               | 종교별 장례 안내 데이터                                       |
| src/styles/base.css                 | 기존 계산기·공통 스타일                                       |
| src/styles/hub.css                  | 기록·회원 화면 스타일                                         |
| src/styles/react.css                | React 구조·모바일에 필요한 추가 스타일                        |
| public/favicon.svg                  | 브라우저 탭 아이콘                                            |
| server.mjs                          | API 연결, 예식장 조회, dist 정적 파일 제공                    |
| features.mjs                        | 회원·기록·사례·관리자 API와 권한 검증                         |
| auth.mjs                            | scrypt 비밀번호 해시·검증, 토큰 생성                          |
| db.mjs                              | Turso 연결                                                    |
| schema.mjs                          | 기존 테이블 준비                                              |
| data/venues.json                    | 예식장 초기 자료                                              |
| scripts/seed.mjs                    | 테이블 준비와 예식장 데이터 입력                              |
| scripts/admin.mjs                   | 관리자 생성                                                   |
| scripts/dev.mjs                     | React 개발 서버와 API 동시 실행                               |
| scripts/e2e-server.mjs              | 임시 DB 브라우저 테스트 서버                                  |
| vite.config.js                      | JSX 빌드, API 프록시, 개발 포트                               |
| playwright.config.js                | 브라우저 테스트 설정                                          |
| calculator.test.mjs                 | 계산·예식장·정적 서버 검증                                    |
| features.test.mjs                   | 로그인·권한·소유권·삭제·통계 검증                             |
| tests/e2e/app.spec.js               | 실제 브라우저 클릭·폼 입력 검증                               |
| render.yaml                         | Render 빌드·실행 설정                                         |
| package.json                        | 실행 명령과 의존성                                            |
| package-lock.json                   | 설치 버전 고정                                                |
| .env.example                        | 설정 항목 예시                                                |
| .env                                | 로컬 비밀 설정, Git 제외                                      |
| .gitignore                          | 비밀 파일·빌드·테스트 결과 제외                               |
| README.md                           | 적용·실행·배포 안내                                           |
| REACT-STUDY.md                      | 이 학습 안내                                                  |
| dist/                               | npm run build가 생성한 배포용 결과, 직접 수정하지 않음        |
| node_modules/                       | npm ci가 설치한 라이브러리, 직접 수정하지 않음                |

정리 명령 `npm run cleanup:legacy`는 남아 있는 구버전 화면 파일만 프로젝트 밖에 백업하고 제거합니다.

## 1. JSX와 컴포넌트

```jsx
function Greeting({ name }) {
  return <h2>안녕하세요, {name}님</h2>;
}
```

JSX는 JavaScript 안에서 화면을 표현하는 문법입니다. 컴포넌트는 화면 조각을 반환하는 함수입니다.
`<Greeting name="우혁" />`의 name이 props입니다. HTML의 class는 JSX에서 className, for는 htmlFor입니다.
이 프로젝트는 사용자 입력을 `{record.memo}`로 표시합니다. HTML 문자열로 실행하지 않습니다.

## 2. useState: 화면이 기억하는 값

CalculatorPage.jsx:

```jsx
const [people, setPeople] = useState(1);
<button onClick={() => setPeople(n => n + 1)}>+</button>
<output>{people}</output>
```

people은 현재 값, setPeople은 변경 함수입니다. 값을 바꾸면 React가 컴포넌트를 다시 호출하고 결과를 갱신합니다.
이전처럼 getElementById로 결과 DOM을 찾아 textContent를 바꾸지 않습니다.
`setPeople(n => n + 1)`은 직전 상태를 기준으로 다음 상태를 계산합니다.

연습: 인원 증가 버튼을 누르고 입력값·계산 결과가 함께 바뀌는 이유를 설명해보세요.

## 3. 제어 입력과 계산 결과

```jsx
<input value={meal} onChange={(e) => setMeal(e.target.value)} />
```

입력창의 값이 React 상태와 연결됩니다. 입력 → 상태 갱신 → 재렌더링 → calculate 호출 → 결과 표시 순서입니다.
계산 결과는 입력에서 바로 계산할 수 있으므로 별도의 결과 state에 중복 저장하지 않았습니다.

## 4. props와 상태 끌어올리기

CalculatorPage는 선택한 예식장과 식대를 기억합니다.
VenuePicker는 목록을 그린 후 `onSelect(venue)`로 부모에게 선택 사실을 알려줍니다.
부모가 setSelected와 setMeal을 호출합니다. 한 데이터의 주인을 명확히 정하는 연습입니다.

## 5. useEffect와 useRemote

서버 요청은 외부 시스템과의 연결입니다. useRemote는 주소가 바뀌면 useEffect 안에서 요청합니다.
로딩·데이터·오류를 상태로 보관하고 AbortController로 이전 요청을 취소합니다.
늦게 도착한 이전 필터 응답이 최신 화면을 덮어쓰지 않게 합니다.

개발 중 StrictMode는 Effect의 정리 동작을 확인하기 위해 추가 실행할 수 있습니다.
그래서 조회 효과에는 정리 함수를 두고, 삭제·가입 같은 변경 요청은 클릭·submit 안에서 실행합니다.

## 6. Context로 로그인 상태 공유

AuthProvider가 user와 로그인·로그아웃 함수를 공유합니다.
Layout, ProtectedRoute, AccountPage가 각각 useAuth()로 같은 상태를 읽습니다.
따라서 로그인 후 계산기로 이동해도 아이디가 표시됩니다.
보안은 화면에서만 처리하지 않습니다. 서버 features.mjs가 세션과 role을 다시 검사합니다.

## 7. React Router

App.jsx에서 주소에 따라 화면을 지정합니다. Layout의 Outlet에 현재 페이지가 들어갑니다.
HashRouter를 사용하므로 주소는 `/#/records`처럼 생깁니다.
Link는 앱 안의 페이지 이동, 일반 a는 외부 사이트 이동에 사용합니다.
ProtectedRoute는 비로그인 상태에 안내를 표시하고 로그인 후 원래 목적지로 이어줍니다.

## 8. 개인 기록 저장 흐름

1. RecordsPage의 폼 입력
2. onSubmit에서 preventDefault (기본 페이지 이동 방지)
3. api('/api/records', ...)로 JSON 전송
4. features.mjs에서 세션·입력값·소유권 검증
5. Turso에 INSERT
6. reload()로 다시 조회
7. state가 바뀌고 React가 목록을 다시 그림

F12 → Network → /api/records의 Payload와 Response를 보면서 코드를 따라가세요.
`editing`이 있는 경우 PUT, 없는 경우 POST입니다. DELETE에는 대상 기록 ID가 필요합니다.

## 9. 목록과 key

```jsx
{
  records.map((record) => <article key={record.id}>{record.person}</article>);
}
```

map은 데이터를 화면 목록으로 변환합니다. key는 어떤 항목이 추가·삭제됐는지 구분하는 안정적인 ID입니다.
수정·삭제되는 목록에서 배열 위치 대신 DB ID를 사용합니다.

## 10. 공부 순서

1. main.jsx → App.jsx → Layout.jsx: 실행과 페이지 구조
2. CalculatorPage → calculator.js: state·입력·계산
3. VenuePicker → useRemote → api: props·Effect·fetch
4. AuthContext → ProtectedRoute → AuthPage: 공유 상태·로그인
5. RecordsPage: CRUD·목록·필터·합계
6. CasesPage → AdminPage: 승인·삭제·권한
7. server.mjs → features.mjs → schema.mjs: 서버와 DB
8. tests/e2e/app.spec.js: 사용자 행동을 자동화하는 방법

처음 연습은 제목 수정, 버튼 문구 변경, 기본 친밀도 변경, 기록 검색 조건 추가 순서가 좋습니다.
계산 규칙을 변경하면 calculator.test.mjs의 기대값과 화면 설명도 함께 수정하세요.

## 공식 학습 자료

- React: https://react.dev/learn
- Vite: https://vite.dev/guide/

## 추가 학습: 영어·일본어 전환

### 파일 지도

| 파일                                | 역할                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| src/components/LanguageSwitcher.jsx | 한국어·영어·일본어 선택창                                          |
| src/i18n/index.js                   | 현재 언어, localStorage 저장, React 구독 Hook, HTML 언어·제목 변경 |
| src/i18n/translations.js            | 번역 조회, `{0}` 자리표시자 치환, 서버 오류 번역                   |
| src/i18n/en.json                    | 한국어 문장 → 영어 문장 사전                                       |
| src/i18n/ja.json                    | 한국어 문장 → 일본어 문장 사전                                     |
| src/lib/labels.js                   | 선택지의 표시 이름과 원화 금액 포맷                                |
| i18n.test.mjs                       | 사전의 누락·자리표시자와 오류 번역 테스트                          |
| tests/e2e/languages.spec.js         | 언어 전환·저장·입력 유지·원문 보존·관리자 브라우저 테스트          |

### 버튼을 누르면 일어나는 일

1. 선택창의 `onChange`가 `setLanguage("en")`을 호출합니다.
2. `index.js`가 현재 언어를 변경하고 `localStorage`의 `gift-language`에 저장합니다.
3. `useSyncExternalStore`가 변경을 구독한 컴포넌트에 알려 줍니다.
4. 컴포넌트가 다시 렌더링되고 `t("로그인")`이 영어 사전의 `"Sign in"`을 반환합니다.
5. 같은 React 컴포넌트가 유지되므로 입력 중인 값과 선택한 조건도 유지됩니다.

`useLanguage()`는 언어 변경을 구독하는 Hook입니다. 단순히 `t()`만 부르는 파일은
번역을 읽을 수는 있지만, 언어 변경 시 스스로 다시 렌더링할 구독이 없습니다.
화면 컴포넌트에서 `useLanguage()`를 함께 호출하는 이유입니다.

```jsx
import { t, useLanguage } from "../i18n/index";

export default function Example() {
  useLanguage();
  return <button>{t("로그인")}</button>;
}
```

기본 한국어 문장이 사전의 키입니다. 한국어일 때는 키 자체를 표시합니다.
새 문구를 추가하면 영어·일본어 JSON 양쪽에 같은 키를 넣어 주세요.
기존 한국어 문구를 바꿀 때에도 코드와 두 사전의 키를 함께 바꿔야 합니다.

```json
{
  "로그인": "Sign in",
  "참고 범위 {0}–{1}": "Reference range: {0}–{1}"
}
```

`{0}`, `{1}`은 문장을 완성할 때 넣을 값의 순서입니다.

```jsx
t("참고 범위 {0}–{1}", [won(100000), won(150000)]);
// 영어: Reference range: 100,000 KRW–150,000 KRW
```

`names`의 getter는 읽을 때마다 현재 언어의 표시 이름을 반환합니다.
`names.colleague`는 한국어에서 “자주 보는 사이”, 영어에서 “Regular contact”입니다.
서버로 보내는 값은 계속 `colleague`이므로 데이터와 필터 기준이 달라지지 않습니다.
지역도 화면에서는 Seoul로 표시하지만 검색 조건에는 기존 DB 값인 서울을 사용합니다.

서버는 기존 한국어 오류를 반환합니다. `Ui.jsx`의 `Notice`와 `RemoteStatus`가
`systemMessage()`로 선택한 언어에 맞춰 표시합니다.
이미 표시된 저장 완료·오류 메시지도 언어를 바꾸면 다시 번역됩니다.
새로운 서버 오류를 추가하면 두 번역 사전에 해당 문장을 추가하세요.
알 수 없는 오류는 숨기지 않고 원문으로 표시합니다.

회원이 쓴 글에는 `t()`나 `systemMessage()`를 적용하지 않습니다.
예를 들어 `{item.story}`는 React가 일반 텍스트로 그대로 표시합니다.
금액은 숫자를 저장하고 표시할 때만 `won()`으로 포맷합니다.
영어의 `100,000 KRW`, 일본어의 `100,000ウォン`은 모두 한국 돈 10만원입니다.
브라우저 자체 날짜 선택창·기본 입력 검증 팝업의 언어는 브라우저 설정에 따라 다를 수 있습니다.

## 추가 학습: 사용자 사례 댓글

| 파일                                | 역할                                                  |
| ----------------------------------- | ----------------------------------------------------- |
| src/components/CommentThread.jsx    | 댓글 열기·조회·입력·등록·삭제·페이지 이동             |
| src/components/CommunitySummary.jsx | 승인 사례마다 CommentThread 배치                      |
| src/pages/AdminPage.jsx             | 관리자 사례 카드에도 같은 CommentThread 재사용        |
| comments.mjs                        | 댓글 API, 공개 상태·삭제 권한·길이 검증·익명 별칭     |
| features.mjs                        | 로그인·Origin 검증 후 댓글 API 연결                   |
| schema.mjs                          | case_comments 테이블, 인덱스, 관련 데이터 삭제 트리거 |
| comments.test.mjs                   | 댓글 접근·소유권·익명성·정리·등록 제한 테스트         |
| tests/e2e/comments.spec.js          | 실제 회원 댓글 등록과 관리자 삭제, 번역, 모바일 검증  |

화면의 `<CommentThread caseId={item.id} />`에서 `caseId`는 댓글이 속한 사례의 ID입니다.
`useState`로 댓글 창 열림 여부, 입력 중인 문장, 현재 페이지, 처리 중 상태를 기억합니다.
닫혀 있을 때는 API를 호출하지 않고, 열었을 때 `useRemote`로 댓글을 가져옵니다.

| 요청                                          | 의미                                            |
| --------------------------------------------- | ----------------------------------------------- |
| GET /api/cases/:caseId/comments?page=0        | 첫 페이지 댓글 조회, 최신순 20건                |
| POST /api/cases/:caseId/comments              | `{ "body": "저도 비슷한 경험이 있어요." }` 등록 |
| DELETE /api/cases/:caseId/comments/:commentId | 본인 또는 관리자가 댓글 삭제                    |

1. 사용자가 textarea에 입력하면 `draft` 상태가 바뀝니다.
2. 등록 버튼이 `submit()`을 실행하고 `api()`로 서버에 JSON을 전송합니다.
3. 서버는 로그인 상태·공개 사례·문자 수·등록 횟수를 검증합니다.
4. 서버가 INSERT로 저장하면 화면은 입력창을 비우고 댓글 첫 페이지를 다시 조회합니다.
5. 다른 사용자는 댓글 새로고침을 눌러 새 글을 확인할 수 있습니다.

관리자 여부나 작성자 여부를 브라우저가 보내는 값으로 믿지 않습니다.
서버가 로그인 세션으로 확인한 `user.id`와 DB의 댓글 작성자를 비교합니다.
버튼을 숨기는 것과 별개로 서버에서도 삭제 권한을 검사해야 합니다.

익명 별칭은 사례 ID와 작성자 ID를 해시해서 만듭니다.
같은 사례에서는 같은 회원이 같은 별칭을 쓰지만, 다른 사례에서는 별칭이 달라집니다.
본문을 `{comment.body}`로 출력하므로 HTML 코드를 쓰더라도 문자열로 표시됩니다.

DB 트리거는 지정한 DB 작업이 일어나면 자동으로 실행되는 SQL입니다.
사례를 삭제하면 `delete_case_comments`가 해당 사례 댓글을 함께 삭제하고,
회원을 삭제하면 `delete_user_comments`가 그 회원이 다른 사례에 남긴 댓글도 삭제합니다.
기존 회원 탈퇴·관리자 삭제·사례 철회 경로에 동일하게 적용됩니다.
관리자의 댓글 삭제 작업은 본문 대신 작업 대상 ID와 시각을 `admin_audit`에 기록합니다.

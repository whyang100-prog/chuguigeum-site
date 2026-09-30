# 축의금 얼마하지? — React 버전

React + React Router + Vite 화면, Node.js API, Turso DB를 사용하는 프로젝트입니다.
기존 회원·기록·사례·관리자 기능과 DB 구조를 유지합니다. 기존 계산 공식도 유지합니다.

## 기존 프로젝트에 적용

1. 기존 폴더를 백업하고 실행 중인 서버를 Ctrl+C로 종료합니다.
2. 압축의 chuguigeum-site 폴더 안 내용을 기존 프로젝트에 덮어씁니다.
3. 기존 `.env`와 `.git`은 그대로 유지합니다. 압축에는 비밀값이 없습니다.
4. 다음 명령을 실행합니다.

```powershell
cd C:\HowMuch\chuguigeum-site
npm ci
npm test
npm run dev
```

개발 화면: http://localhost:5173 (React 개발 서버)
API: http://localhost:3000 (Node.js 서버)
`npm run dev`가 두 서버를 함께 실행하고 APP_ORIGIN을 개발 주소에 맞춥니다.
기존 3000번 서버가 켜져 있다면 먼저 종료하세요. 다른 API 포트가 필요하면:

```powershell
$env:API_PORT="3001"
npm run dev
```

수정한 JSX는 저장하면 개발 화면에 반영됩니다.
Node.js 22.12 이상이 필요합니다. 기존 Render 22.16과 로컬 24에서 사용할 수 있습니다.

## 운영과 같은 방식으로 실행

```powershell
npm run build
npm start
```

http://localhost:3000 에 접속합니다. `.env`의 APP_ORIGIN도 해당 주소를 사용하세요.
React 파일 수정 후 `npm start`만 하면 이전 빌드가 보입니다. 다시 빌드해야 합니다.

## Render 배포

기존 Render 서비스를 그대로 사용하세요. 새 DB나 서비스를 만들 필요는 없습니다.

- Build Command: `npm ci --include=dev && npm run build && npm run db:seed`
- Start Command: `npm start`
- Health Check Path: `/healthz`
- 기존 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 유지
- 운영 APP_ORIGIN에 localhost를 넣지 마세요. Render 기본 주소는 RENDER_EXTERNAL_URL로 처리합니다.

render.yaml도 수정했지만 대시보드에 수동 설정한 Build Command가 있다면 직접 확인하세요.
`npm ci`에서 개발 의존성까지 설치되어야 Vite 빌드가 가능합니다 (NPM_CONFIG_PRODUCTION=true 같은 설정을 넣지 마세요).

```powershell
git add .
git commit -m "전체 화면을 React로 전환"
git push
```

네이버 인증 메타태그는 루트 index.html에 유지되어 빌드 결과에도 포함됩니다.
기존 `/hub#records` 링크도 새 화면으로 연결됩니다.
이 버전은 클라이언트 렌더링입니다. 검색용 정적 페이지/SSR은 별도 구현하지 않았습니다.

## 구버전 파일 정리

압축을 덮어쓴 후 다음을 한 번 실행하세요.

```powershell
npm run cleanup:legacy
```

이 명령은 남아 있는 구버전 public 화면 7개와 UPDATE-V2.md만 제거합니다.
삭제 전 프로젝트 바깥의 형제 폴더에 백업합니다. `.env`, `.git`, 회원·기록 DB, 서버 코드는 유지됩니다.
새 React 화면은 src, 입구 HTML은 루트 index.html, 정적 아이콘은 public/favicon.svg에 있습니다.
Node.js 서버는 React에서 호출하는 로그인·기록·관리자 API이므로 필요합니다.
빌드 결과 dist와 설치 라이브러리 node_modules는 자동 생성되므로 공부할 때 직접 수정하지 않습니다.

## 테스트

- `npm test`: 빌드 + 계산/서버/API/권한 통합 테스트
- `npx playwright install chromium`: 브라우저 테스트 환경 설치 (최초 1회)
- `npm run test:e2e`: 임시 로컬 DB에서 브라우저 기능 테스트

브라우저 테스트는 운영 DB를 사용하지 않습니다. 운영 사용자/사례를 테스트로 생성하거나 삭제하지 않습니다.

## 페이지

| 주소                  | 내용                                | 접근   |
| --------------------- | ----------------------------------- | ------ |
| /#/                   | 계산기                              | 공개   |
| /#/etiquette          | 예절 안내                           | 공개   |
| /#/login, /#/register | 로그인·가입                         | 공개   |
| /#/records            | 개인 기록 CRUD                      | 회원   |
| /#/cases              | 사례 등록·조회·철회·통계            | 회원   |
| /#/account            | 비밀번호 변경·탈퇴                  | 회원   |
| /#/admin              | 회원 정지·삭제, 사례 승인·반려·삭제 | 관리자 |

관리자 생성은 기존처럼 `.env`의 ADMIN_USERNAME, ADMIN_PASSWORD 설정 후 `npm run admin:create`입니다.
일반 회원으로 사용하지 않은 아이디, 14자 이상 비밀번호를 사용하고 생성 후 ADMIN_PASSWORD를 지우세요.

## 공부

`REACT-STUDY.md`의 파일 지도와 실습 순서로 읽어보세요.

## 한국어·영어·일본어

상단의 🌐 메뉴에서 한국어 / English / 日本語를 선택합니다.
선택한 언어는 해당 브라우저에 저장되어 새로고침과 다음 접속에도 유지됩니다.
기본 언어는 한국어이며 로그인 없이도 변경할 수 있습니다.

계산기·회원가입·로그인·개인 기록·사례·예절·관리자 화면과 서버 오류 안내를 번역합니다.
예식장 이름, 상세 지역명, 출처명, 사용자 이름·메모·사례 글은 원문을 유지합니다.
외부 번역 API를 사용하지 않으며 사용자 글을 번역 업체로 전송하지 않습니다.
모든 금액은 원화(KRW)입니다. 언어 선택은 환율이나 계산 공식에 영향을 주지 않습니다.
예절 안내는 세 언어 모두 한국의 결혼식·장례식 기준입니다.

기존 프로젝트에 업데이트 파일을 덮어쓴 후, 실행 중인 서버를 Ctrl+C로 종료하고:

```powershell
npm ci
npm test
npm start
```

`npm test`에 React 빌드가 포함되어 있습니다. 이후 화면 코드를 수정할 때는
`npm run build` 후 `npm start`로 실행합니다. 주소는 http://localhost:3000 입니다.
Render에는 기존 Build Command의 `npm run build`가 포함되어 있으면 추가 환경변수 없이 배포됩니다.
이번 언어 기능에는 DB 구조 변경이 없습니다.

## 사용자 사례 댓글

승인된 사례의 **댓글 보기 · 소통하기**를 누르면 댓글을 조회하고 작성할 수 있습니다.
사례가 1건만 있어도 사용할 수 있습니다. 통계 중앙값의 5명 기준과 무관합니다.
로그인한 활성 회원만 이용하며 댓글은 승인 대기 없이 바로 공개됩니다.
사례별 익명 별칭을 표시하고 로그인 아이디는 공개하지 않습니다.
본인 댓글에만 삭제 버튼이 표시됩니다. 관리자는 관리자 페이지의 사례 카드에서
댓글을 열어 다른 회원의 댓글도 삭제할 수 있습니다.

- 댓글: 공백 제외 최소 1자, 최대 500자; 회원당 15분에 최대 20회 등록
- 최신순 20개씩 조회, 이전·다음 페이지 및 새로고침 버튼
- 자동 실시간 갱신은 하지 않으며 새 댓글 확인은 **댓글 새로고침** 사용
- 사례가 반려되거나 작성자가 정지되면 일반 회원은 해당 댓글에 접근할 수 없음
- 정지 회원의 댓글은 일반 회원에게 숨기고 관리자에게는 표시
- 사례 삭제 시 그 사례의 댓글 삭제; 회원 삭제 시 그 회원이 쓴 댓글 삭제
- 한국어·영어·일본어 UI 지원, 댓글 본문은 원문 유지

기존 버전에서 업데이트할 때에는 실행 중인 서버를 종료하고 다음 순서로 실행하세요.

```powershell
npm ci
npm run db:seed
npm test
npm start
```

`npm run db:seed`가 기존 데이터를 유지하며 댓글 테이블과 인덱스·정리 트리거를 추가합니다.
Render의 Build Command는 `npm ci --include=dev && npm run build && npm run db:seed`로 유지합니다.
추가 환경변수나 번역 API 키는 필요하지 않습니다.

## 같은 회원의 여러 사례 표시

같은 회원이 같은 조건으로 제출한 사례도 승인되면 공개 목록에 모두 표시합니다.
최근 24개월·선택한 조건·활성 회원 기준은 유지하며, 최신순 20건씩 페이지를 넘겨 확인합니다.
사례 등록의 15분당 10건 제한은 제거했습니다. 등록한 사례마다 관리자 승인이 필요합니다.
통계 참여자 수와 중앙값에는 회원별 가장 최근 승인 사례 1건만 반영합니다.
이번 목록 변경은 추가 DB 구조 변경 없이 적용됩니다.

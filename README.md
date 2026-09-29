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

## 이전 파일 정리

덮어쓰기하면 이전 public 파일이 남을 수 있지만 서버는 dist만 제공합니다.
새 화면 동작 확인 후 아래 구버전 파일만 선택적으로 삭제할 수 있습니다.

- public/app.js, public/calculator.js
- public/hub.js, public/hub.html, public/index.html
- public/style.css, public/hub.css

public/favicon.svg는 유지하세요. 공부할 때는 src 안의 파일을 수정하세요.

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

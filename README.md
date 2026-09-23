# 축의금 얼마하지?

친밀도, 예식장 식대, 참석 여부와 성인 식사 인원을 바탕으로 축의금 참고 금액을 보여주는 반응형 웹 서비스입니다.

## 현재 완성 범위와 한계

- 예식장 이름·시군구 검색 및 전국 17개 시도 필터
- 초기 예식장 60곳: 공개 참고가 44곳, 가격 미확인 16곳
- 친밀도 4단계, 식사 여부 3가지, 본인 포함 식사 인원 1~10명
- 식대 직접 입력, 출처 및 자료 확인일 표시
- Node.js 서버 + Turso(libSQL) DB 연결 코드 + Render Blueprint
- 전체 전국 예식장 DB가 아닙니다. 제3자 공개 표기가를 제한적으로 수록한 초기 데이터입니다. 최신 견적, 폐업 여부, 세금·봉사료 포함 여부, 가격 적용일을 업체에 직접 검증하지 않았습니다. 확인일(2026-09-23)은 공개 자료 열람일입니다.
- Render 배포 및 원격 Turso 연결은 계정 인증과 환경변수 설정 전입니다. 실제 공개 URL은 아직 없습니다.

## 내 컴퓨터에서 실행

Node.js 22 이상을 설치한 후 압축 해제한 폴더에서 실행합니다.

```powershell
npm ci
npm start
```

브라우저에서 http://localhost:3000 을 엽니다. DB 환경변수가 없으면 개발용 JSON 데이터로 검색과 계산이 작동합니다. 운영 모드에서는 DB 없는 실행을 차단합니다.

## Turso 연결

이 프로젝트는 Turso의 **libSQL 데이터베이스**와 `@libsql/client`를 사용합니다. Turso의 새 엔진용 `turso://` URL과 혼용하지 마세요. 기존 libSQL DB의 `libsql://...` URL과 DB 접근 토큰을 준비하세요.

`.env.example`을 `.env`로 복사하고 두 값을 입력합니다.

```dotenv
TURSO_DATABASE_URL=libsql://YOUR_DATABASE.turso.io
TURSO_AUTH_TOKEN=YOUR_DATABASE_TOKEN
PORT=3000
```

```powershell
npm run db:seed
npm start
```

키는 서버에서만 읽습니다. `.env`는 Git에서 제외됩니다. 토큰을 HTML이나 public 폴더에 넣지 마세요.

`db:seed`는 테이블과 지역 인덱스를 생성하고 초기 데이터를 넣습니다. 재실행 시 기존 ID는 수정하지 않습니다. 운영자가 수정한 식대가 다음 배포에서 초기값으로 덮어써지지 않습니다.

## Render 배포

1. 이 폴더의 파일을 새 GitHub 저장소에 올립니다. node_modules와 .env는 올리지 않습니다.
2. Render Dashboard에서 New → Blueprint를 선택하고 저장소를 연결합니다.
3. 포함된 render.yaml을 사용합니다. 계정에서 무료 Web Service 사용 가능 여부를 확인합니다.
4. TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN을 Render의 비밀 환경변수로 입력합니다.
5. 생성/배포하면 npm ci → DB 초기 입력 → npm start 순서로 실행됩니다.
6. Render가 생성한 실제 URL을 열어 /healthz 응답에 status: ok, storage: turso가 표시되는지 확인합니다.

Blueprint 대신 Web Service를 직접 생성하는 경우:

| 항목 | 값 |
|---|---|
| Runtime | Node |
| Build Command | npm ci && npm run db:seed |
| Start Command | npm start |
| Health Check Path | /healthz |
| NODE_ENV | production |
| NODE_VERSION | 22.16.0 |
| TURSO_DATABASE_URL | 내 Turso libSQL DB URL |
| TURSO_AUTH_TOKEN | 내 DB 토큰 |

초기 입력은 배포 빌드 단계에서 수행합니다. 운영 규모가 커지면 스키마 변경·대량 수집을 별도 관리 작업으로 분리하세요. 5,000건을 넘기면 API 페이지네이션도 추가해야 합니다.

## 데이터 관리

초기 데이터는 data/venues.json입니다. 필드: id, name, region, district, meal(원 또는 null), source, sourceName, checkedAt, priceDate, status.

정확한 운영용 전국 DB를 만들려면 업체 제공 자료나 이용 허가된 공급 데이터를 확보하고, 식대 적용 기간·메뉴·세금·최소 인원 조건을 검증해야 합니다. 현재 수집 데이터는 지역별 전체 목록을 복제한 자료가 아닙니다. 자동 갱신은 구현하지 않았습니다.

이미 DB에 있는 금액은 Turso SQL 편집기에서 해당 ID를 확인하여 매개변수화된 관리 스크립트나 SQL로 수정할 수 있습니다. 이 앱은 일반 방문자에게 DB 수정 API를 제공하지 않습니다.

## 계산 방식

친밀도 기준: 지인 5만원, 동료/친구 10만원, 가까운 친구 15만원, 절친/가족 20만원. 통계나 사회적 합의가 아닌 서비스의 예시 규칙입니다.

식사할 때: max(친밀도 기준, 1인 식대 × 식사 인원)을 5만원 단위로 올림합니다.
식대 미입력, 식사 안 함, 불참일 때: 친밀도 기준만 적용합니다.
참고 범위: 계산 금액 ~ 계산 금액 + 5만원.

예시: 친구(10만원), 식대 8만원, 2명 식사 → 16만원을 5만원 단위로 올려 20만원. 불참으로 바꾸면 10만원입니다. 어린이는 실제 비용이 다를 수 있습니다.

## 검증

npm test로 계산의 경계값, 동반 인원, 불참, 입력 검증, 17개 지역 및 ID 무결성, 서버 검색과 비밀 파일 차단을 확인합니다. 로컬 libSQL DB에 시드 입력 후 같은 통합 검증을 통과했습니다. 원격 DB 연결·Render 배포·실제 브라우저 시각 검증은 별도 단계입니다.

## 참고 문서

- https://docs.turso.tech/sdk/ts/quickstart
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/blueprint-spec
- 예식장별 공개 출처는 data/venues.json 및 화면의 출처 링크에 수록

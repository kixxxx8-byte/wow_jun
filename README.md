# WJ+ Command

`/v8/` 하나만 공개 경로로 사용하는 React/Vite/TypeScript WoW 개인 대시보드입니다.

## 구조

- `app/`: React 앱 소스
- `dist/v8/`: 배포되는 `/v8/` 앱 빌드 결과
- `dist/index.html`: `/`에서 `/v8/`로 보내는 정적 안내/리다이렉트
- `functions/`: Firebase Functions TypeScript 소스
- 공개 경로는 `/v8/`만 사용하며 `/v8-ai/`와 iframe 흐름은 사용하지 않습니다.

## 로컬 실행

```powershell
$env:Path = (Join-Path (Get-Location) '.tools\node-v24.14.0-win-x64') + ';' + $env:Path
.\.tools\node-v24.14.0-win-x64\npm.cmd run dev
```

브라우저에서 엽니다.

```text
http://127.0.0.1:5173/v8/
```

Functions emulator를 같이 테스트할 때는 별도 터미널에서 실행합니다.

```powershell
$env:Path = (Join-Path (Get-Location) '.tools\node-v24.14.0-win-x64') + ';' + $env:Path
.\.tools\node-v24.14.0-win-x64\npm.cmd run emulators
```

Vite dev 서버는 `/api/*`, `/auth/*`를 Functions emulator로 프록시합니다.

## Secret 설정

프론트 코드나 채팅에 운영 키를 넣지 않습니다. Firebase Secret Manager에만 설정합니다.

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd run secret:gemini
.\.tools\node-v24.14.0-win-x64\npm.cmd run secret:bnet:id
.\.tools\node-v24.14.0-win-x64\npm.cmd run secret:bnet:secret
```

로컬 emulator에서만 실제 키를 쓸 때는 `functions/.secret.local`을 사용합니다. 이 파일은 Git에서 제외됩니다.

## 검증

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd test
.\.tools\node-v24.14.0-win-x64\npm.cmd run gear:validate-season
.\.tools\node-v24.14.0-win-x64\npm.cmd run build
.\.tools\node-v24.14.0-win-x64\npm.cmd --prefix functions run build
```

한 번에 확인하려면:

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd run preflight
```

## 배포

기본 배포는 `/v8/` Hosting과 Battle.net/AI Functions 전체를 함께 갱신합니다. Battle.net 함수는 secret binding이 필요하므로 부분 배포 대신 기본적으로 전체 배포를 사용합니다.

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd run deploy
```

AI 함수와 Hosting만 빠르게 갱신하려면 아래 명령을 사용합니다. 이 경우 Battle.net 함수는 갱신되지 않습니다.

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd run deploy:current
```

Battle.net 함수까지 배포하려면 `BNET_CLIENT_ID`, `BNET_CLIENT_SECRET`의 최신 secret 버전이 모두 있어야 합니다.

```powershell
.\.tools\node-v24.14.0-win-x64\npm.cmd run deploy:full
```

배포 대상은 `hokkaido-trip-c1907`이며 `.firebaserc`에 고정되어 있습니다.

## v9 Gear Coach

v9 Gear Coach는 부위별 BIS 목록이 아니라 사용자가 허용한 획득 경로 안에서 현재 시즌 기준의 검증된 장비 후보만 사용해 최종 목표 세팅과 이번 주 행동 계획을 보여주는 구조입니다.

- 추천 결정은 `app/src/features/gear/domain/`의 순수 GearRecommendation 엔진이 담당합니다.
- Wowhead 자료는 “참고 BIS”로만 표시하며 기본 추천 확정 근거로 쓰지 않습니다.
- AI는 추천 결과를 설명만 하며 결과 밖의 아이템이나 던전을 만들면 안 됩니다.
- 불확실한 시즌 던전템, 한국어 이름 누락, low confidence 후보는 기본 추천에서 숨기고 제외 후보에 기록합니다.
- 시즌 후보 데이터 변경 후에는 `npm run gear:validate-season`을 반드시 실행합니다.

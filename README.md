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

# WORKLOG

## 2026-05-18

- GitHub 기준 작업 흐름을 준비했습니다.
- `wj-command-transfer-20260518-082354.zip` 작업본을 검토용 기준 폴더로 풀었습니다.
- React/Vite/TypeScript 앱, Firebase Functions, 데이터 파일, 배포 스크립트 구조를 확인했습니다.
- 검증 결과:
  - App unit tests: 통과
  - App TypeScript build: 통과
  - Functions TypeScript build: 통과
  - Vite production build: 통과
  - Playwright E2E: 브라우저 바이너리 미설치로 실행 불가
- 라이브 확인 결과:
  - `/v8/`는 `WJ+ Command` 앱으로 응답
  - `/api/ai/today-plan` rewrite 동작
  - `/api/bnet/sync` rewrite 동작
  - `/api/items/tooltip`은 현재 라이브에서 404

## 남은 작업

- Battle.net 연결 후 실제 자동 동기화 호출 여부 확인 및 수정
- 아이템 툴팁 fallback API가 배포 대상에 포함되는지 확인
- `/api/items/tooltip` 공개 호출 정책 결정
- 메모 저장 debounce 적용
- GitHub private repository 연결 후 첫 push

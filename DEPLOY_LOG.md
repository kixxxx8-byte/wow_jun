# DEPLOY_LOG

## 2026-05-18

- 상태: 사용자가 이미 라이브 배포했다고 알려줌
- 확인 URL: https://hokkaido-trip-c1907.web.app/v8/
- 확인 결과:
  - `/v8/` 정상 응답
  - 페이지 제목: `WJ+ Command`
  - `/api/ai/today-plan` 함수 연결 확인
  - `/api/bnet/sync` 함수 연결 확인
  - `/api/items/tooltip`은 404로 확인
  - Wowhead BIS 지원 배포 완료: `functions:api`, `hosting`
  - `/api/items/bis`는 로그인 없이 401 응답 확인
- 메모:
  - 받은 ZIP 작업본의 툴팁 fallback 구현과 현재 라이브 번들이 완전히 일치하지 않을 가능성이 있음
  - 다음 배포 전 `npm run build`, `functions build`, `/api/items/tooltip` 확인 필요

## 배포 체크리스트

- `npm test`
- `npm run build`
- `npm --prefix functions run build`
- `npm run e2e` 또는 브라우저 smoke check
- `npm run deploy`
- 배포 후 `/v8/`, `/api/ai/today-plan`, `/api/bnet/sync`, `/api/items/tooltip` 확인

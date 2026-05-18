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
- Wowhead BIS 비교 기능을 추가했습니다.
  - `/api/items/bis`에서 로그인 사용자만 Wowhead 암살 도적 BIS 표를 새로고침할 수 있게 했습니다.
  - 12시간 캐시를 두고, 사용자가 `BIS 새로고침`을 누르면 강제 갱신합니다.
  - `아이템 최적화` 화면에 현재 착용 장비와 Wowhead BIS를 슬롯별로 비교하는 패널을 추가했습니다.
- 아이템 추천 알고리즘을 재구성했습니다.
  - 오래된 수동 추천 후보를 현재 Wowhead BIS 기준 후보로 교체했습니다.
  - 반지/장신구/무기처럼 두 칸을 쓰는 부위는 부위군 단위로 배정합니다.
  - 이미 착용 중인 아이템은 다른 칸 목표로 다시 추천하지 않습니다.
  - 같은 아이템을 두 칸 목표로 중복 추천하지 않도록 테스트를 추가했습니다.
- 검증 추가:
  - Wowhead BIS 원문 표 파싱: 16개 슬롯 확인
  - App unit tests: 통과
  - App TypeScript build: 통과
  - Functions TypeScript build: 통과
  - Vite production build: 통과

## 남은 작업

- Battle.net 연결 후 실제 자동 동기화 호출 여부 확인 및 수정
- 아이템 툴팁 fallback API가 배포 대상에 포함되는지 확인
- `/api/items/tooltip` 공개 호출 정책 결정
- 메모 저장 debounce 적용
- GitHub private repository 연결 후 첫 push

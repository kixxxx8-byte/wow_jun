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
- 장비표 표시를 Wowhead BIS 갱신 결과 중심으로 바꿨습니다.
  - BIS 데이터가 있으면 수동 목표 대신 Wowhead BIS 목표를 장비표/조감도에 표시합니다.
  - 이미 같은 부위군에 착용 중인 BIS는 다시 목표로 표시하지 않습니다.
  - Wowhead 영어 외부 툴팁 대신 Battle.net 한국어 툴팁 카드가 뜨도록 변경했습니다.
  - Wowhead 이동 링크도 한국어 페이지(`/ko/item`)를 우선 사용합니다.
- 로그인 후 캐릭터 자동 선택을 복구했습니다.
  - 저장된 `activeCharacterId`를 우선 사용하고, 없으면 `승선을준비하라`를 자동 선택합니다.
  - 저장값이 깨진 경우 장비 데이터가 있는 캐릭터 중 높은 아이템 레벨 캐릭터를 기본값으로 선택합니다.
  - 동기화 후에도 선택이 비지 않도록 대표 캐릭터를 다시 계산합니다.
- 장비 조감도 디자인을 다시 구성했습니다.
  - 중앙 캐릭터 쇼케이스를 크게 확대하고, 이미지가 박스 안에서 자연스럽게 잘릴 수 있게 했습니다.
  - 슬롯 카드는 현재/목표 흐름이 한눈에 보이도록 얇고 밀도 있게 재배치했습니다.
  - 준비도 영역을 상단 전체 폭 요약 바로 바꿔 좌우 장비판과 함께 읽히게 했습니다.
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

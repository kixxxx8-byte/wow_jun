# Git Workflow

이 프로젝트는 GitHub private repository를 기준본으로 사용합니다.

## 작업 시작

```powershell
git pull
npm install
npm --prefix functions install
```

## 검증

```powershell
npm test
npm run build
npm --prefix functions run build
```

Playwright 브라우저가 없는 컴퓨터에서는 한 번만 설치합니다.

```powershell
npx playwright install chromium
```

## 작업 저장

```powershell
git status
git add .
git commit -m "작업 내용"
git push
```

## 배포

```powershell
npm run deploy
```

배포 후 `DEPLOY_LOG.md`에 배포 날짜, 커밋, 확인 결과를 남깁니다.

## 주의

다음 파일/폴더는 GitHub에 올리지 않습니다.

- `node_modules/`
- `functions/node_modules/`
- `.tools/`
- `dist/`
- `.firebase/`
- `test-results/`
- `playwright-report/`
- `functions/.secret.local`
- `.env`
- 압축 파일

> **Note**: This project is inspired by
> [yoonbae81/lotto](https://github.com/yoonbae81/lotto).

## Motivation

Python으로 작성된 [yoonbae81/lotto](https://github.com/yoonbae81/lotto)
프로젝트에서 영감을 받아, Deno와 Playwright를 활용한 TypeScript 버전으로 새롭게
구현했습니다.

# lotto-deno

Deno + Playwright로 동행복권(dhlottery) 웹사이트에 로그인해서 **예치금 확인** 및
**로또 6/45 자동선택 구매**를 수행하는 스크립트입니다.

**주요 기능:**

- 🔐 자동 로그인 및 세션 관리
- 💰 구매 전/후 잔액 확인 및 검증
- 🎫 로또 6/45 자동선택 구매 (1~5게임 설정 가능)
- 📸 구매 영수증 및 에러 스크린샷 자동 저장
- 🔔 Discord Webhook 알림 (성공/실패/잔액부족)
- 🤖 GitHub Actions 스케줄링 지원 (매주 자동 구매)
- 🌐 Browserless(원격 CDP) 또는 로컬 브라우저 지원

## Requirements

- Deno (JSR + `npm:` import를 사용하므로 최신 버전 권장)
- Browserless(또는 CDP를 제공하는 원격 Chromium) WebSocket endpoint
- (선택) Discord Webhook URL

## Setup

### 1) 환경변수 설정

이 프로젝트는 `@std/dotenv`로 `.env`를 읽고, `zod`로 스키마 검증을 합니다.

- `.env.example` → `.env`로 복사 후 값 채우기

```bash
cp .env.example .env
```

필수/선택 환경변수:

| 변수명                    | 필수 여부 | 설명                                                 | 기본값 |
| ------------------------- | --------- | ---------------------------------------------------- | ------ |
| `USER_ID`                 | ✅ 필수   | 동행복권 로그인 아이디                               | -      |
| `PASSWD`                  | ✅ 필수   | 동행복권 로그인 비밀번호                             | -      |
| `BROWSERLESS_WS_ENDPOINT` | ✅ 필수   | Browserless CDP WebSocket endpoint (예: `wss://...`) | -      |
| `BROWSERLESS_TOKEN`       | 선택      | Browserless 토큰 (querystring으로 자동 추가)         | -      |
| `DISCORD_WEBHOOK_URL`     | 선택      | Discord Webhook URL (알림용)                         | -      |
| `AUTO_GAMES`              | 선택      | 자동선택 게임 수 (1~5)                               | `5`    |

### 2) 권한(permissions)

스크립트는 다음이 필요합니다.

- `.env` 읽기: `--allow-read`
- 환경변수 접근: `--allow-env`
- 외부 네트워크 접근(Browserless/Discord): `--allow-net`

편의상 `deno task purchase` 등은 `--allow-all`로 실행하도록 되어 있습니다.

## Usage

`deno.json`에 정의된 task를 사용합니다.

- 전체 플로우(로그인 → 잔액 조회 → 로또 6/45 흐름):

```bash
deno task purchase
```

- 잔액만 확인:

```bash
deno task balance
```

- 로또 6/45만 실행:

```bash
deno task lotto645
```

- 개발용 watch 실행:

```bash
deno task dev
```

> 참고: `dev` task는 현재 권한 플래그가 없어서 환경에 따라 실행이 막힐 수
> 있습니다. 필요하면 `deno.json`의 `dev`를
> `deno run --allow-all --watch main.ts`로 바꿔 사용하세요.

## What it does

### 파일 구조

- [main.ts](main.ts) - 메인 진입점
  - 브라우저/컨텍스트 생성
  - 로그인 수행
  - 구매 전 잔액 확인 및 검증 (부족 시 중단)
  - 로또 6/45 구매 실행
  - 구매 후 잔액 확인 및 Discord 알림

- [src/env.ts](src/env.ts)
  - `.env` 로드 + Zod 스키마 검증
  - 환경변수 타입 안정성 보장

- [src/browser.ts](src/browser.ts)
  - Browserless(원격 CDP) 또는 로컬 Chromium 연결
  - Stealth 모드 및 User Agent 설정

- [src/login.ts](src/login.ts)
  - 동행복권 로그인 자동화

- [src/balance.ts](src/balance.ts)
  - 마이페이지에서 예치금 및 구매가능 금액 조회

- [src/lotto645.ts](src/lotto645.ts)
  - 로또 6/45 페이지 이동
  - 자동선택 게임 수 설정 (`AUTO_GAMES`)
  - 결제 금액 검증 (금액 불일치 시 에러)
  - 구매 확인 팝업 처리
  - 한도 초과 감지 및 에러 처리
  - 성공 시 영수증 스크린샷 저장

- [src/notify.ts](src/notify.ts)
  - Discord Webhook으로 메시지 및 이미지 전송

- [src/error-handler.ts](src/error-handler.ts)
  - 에러 발생 시 스크린샷 저장
  - Discord로 에러 알림 전송

### 구매 흐름

1. **로그인** - 동행복권 계정 인증
2. **잔액 확인** - 구매 가능 여부 검증 (부족 시 Discord 알림 후 종료)
3. **로또 구매** - 자동선택 게임 추가 → 금액 검증 → 구매 확인
4. **결과 처리**
   - ✅ 성공: 영수증 스크린샷 + 구매 후 잔액 + Discord 알림
   - ❌ 실패: 에러 스크린샷 + Discord 알림 (한도 초과/금액 불일치 등)

## Output files

스크립트 실행 시 `screenshots/` 디렉토리에 파일이 저장됩니다:

- `result_645_YYYY-MM-DD.png` - 구매 성공 시 영수증 스크린샷
- `error_YYYY-MM-DDTHH-MM-SS-sssZ.png` - 에러 발생 시 스크린샷

## GitHub Actions 자동 실행 설정

매주 정해진 시간에 자동으로 로또를 구매하려면 GitHub Actions를 설정하세요.

### 1. GitHub Repository Secrets 등록

Repository Settings → Secrets and variables → Actions → New repository secret

**`DOTENV` 시크릿 생성:**

`.env` 파일 내용을 **그대로** 복사해서 `DOTENV`라는 이름의 시크릿으로
등록합니다.

```env
USER_ID=your_user_id
PASSWD=your_password
BROWSERLESS_WS_ENDPOINT=wss://chrome.browserless.io/playwright
BROWSERLESS_TOKEN=your_token_here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
AUTO_GAMES=5
```

> ⚠️ **주의:**
>
> - 여러 줄로 된 내용 전체를 하나의 시크릿(`DOTENV`)에 저장합니다.
> - 각 환경변수를 개별 시크릿으로 등록하지 마세요.
> - 값에 따옴표를 추가하지 마세요 (그대로 복사).

### 2. Workflow 파일 확인

이미 [.github/workflows/purchase.yml](.github/workflows/purchase.yml) 파일이
포함되어 있습니다.

**주요 설정:**

```yaml
on:
  # 수동 실행 (테스트용)
  workflow_dispatch:

  # 자동 스케줄 (매주 토요일 오전 10시 KST)
  schedule:
    - cron: "0 1 * * 6" # UTC 01:00 = KST 10:00
```

**Cron 스케줄 커스터마이징:**

| 한국 시간 (KST)       | UTC 시간     | Cron 표현식  |
| --------------------- | ------------ | ------------ |
| 매주 토요일 오전 10시 | 토요일 01:00 | `0 1 * * 6`  |
| 매주 금요일 오후 8시  | 금요일 11:00 | `0 11 * * 5` |
| 매일 오전 9시         | 매일 00:00   | `0 0 * * *`  |

> 💡 **Tip:** [crontab.guru](https://crontab.guru/)에서 cron 표현식을 테스트할
> 수 있습니다.

### 3. 수동 실행 테스트

처음에는 스케줄 대신 **수동 실행**으로 테스트하는 것을 권장합니다:

1. GitHub Repository → **Actions** 탭 클릭
2. 왼쪽에서 **"Lotto Auto Purchase (Deno)"** 워크플로우 선택
3. 오른쪽 상단 **"Run workflow"** 버튼 클릭
4. Branch 선택 후 **"Run workflow"** 실행

실행 결과는 Actions 탭에서 실시간으로 확인할 수 있습니다.

### 4. 로그 확인

- ✅ 성공: Discord로 구매 완료 알림 + 영수증 이미지 전송
- ❌ 실패: Discord로 에러 메시지 + 에러 스크린샷 전송
- GitHub Actions 로그에서도 전체 실행 과정 확인 가능

### 5. 문제 해결

**"Invalid environment variables" 에러 발생 시:**

- `DOTENV` 시크릿의 형식을 확인하세요
- URL은 `https://` 또는 `wss://`로 시작해야 합니다
- 줄바꿈이 제대로 되어 있는지 확인하세요

**구매 실패 (한도 초과) 시:**

- 동행복권은 주당 구매 한도가 있습니다
- Discord 알림으로 자세한 에러 메시지를 확인하세요

**Browserless 연결 실패 시:**

- `BROWSERLESS_WS_ENDPOINT`가 올바른 CDP WebSocket URL인지 확인
- 토큰 만료 여부 확인

## Troubleshooting

### 환경변수 관련

- **`❌ Invalid environment variables`**
  - `.env` 파일의 형식/값을 확인하세요
  - URL은 올바른 형식이어야 합니다 (`https://`, `wss://`)
  - `AUTO_GAMES`는 1~5 사이의 숫자여야 합니다

### 로그인/구매 관련

- **로그인 실패**
  - 동행복권 사이트의 selector가 변경되었을 수 있습니다
  - [src/login.ts](src/login.ts)의 selector 확인 필요

- **구매 실패 (한도 초과)**
  - 동행복권은 주당 구매 한도 제한이 있습니다
  - Discord 알림 또는 에러 스크린샷을 확인하세요

- **금액 불일치 에러**
  - `AUTO_GAMES` 설정과 실제 표시 금액이 다를 경우 발생
  - 사이트 UI 변경 시 [src/lotto645.ts](src/lotto645.ts) 수정 필요

### 브라우저 연결 관련

- **Browserless 연결 실패**
  - endpoint가 **CDP WebSocket** 형식인지 확인 (`wss://`)
  - 토큰 만료 여부 확인
  - Browserless 서비스 상태 확인

### GitHub Actions 관련

- **Secrets 설정 오류**
  - `DOTENV` 시크릿에 `.env` 전체 내용이 올바르게 들어갔는지 확인
  - 여러 줄 형식을 유지해야 합니다

- **Workflow 실행 안 됨**
  - Cron 시간대는 UTC 기준입니다 (KST = UTC + 9시간)
  - Actions 탭에서 workflow가 활성화되어 있는지 확인

## Acknowledgements

이 프로젝트는 [yoonbae81/lotto](https://github.com/yoonbae81/lotto) 프로젝트를
참고하여 TypeScript(Deno)로 재작성되었습니다. 훌륭한 원본 코드를 공유해 주신
제작자분께 감사드립니다.

This project is a TypeScript port based on
[yoonbae81/lotto](https://github.com/yoonbae81/lotto). Special thanks to the
original author for the great work.

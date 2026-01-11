> **Note**: This project is inspired by
> [yoonbae81/lotto](https://github.com/yoonbae81/lotto).

## Motivation

Python으로 작성된 [yoonbae81/lotto](https://github.com/yoonbae81/lotto)
프로젝트에서 영감을 받아, Deno와 Playwright를 활용한 TypeScript 버전으로 새롭게
구현했습니다.

# lotto-deno

Deno + Playwright로 동행복권(dhlottery) 웹사이트에 로그인해서 **예치금 확인** 및
**로또 6/45 자동선택 구매(현재는 검증 단계)** 를 수행하는 스크립트입니다.

- 브라우저는 기본적으로 Browserless(원격 Chromium)에 **CDP(WebSocket)** 로
  연결합니다.
- 로또 6/45는 자동선택 5게임을 담고, 검증용 스크린샷을 저장한 뒤(옵션) Discord
  Webhook으로 알림을 보냅니다.

> 주의: 실제 결제/구매 버튼 클릭은 현재 코드에서 주석 처리되어
> 있습니다(안전장치).

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

- `USER_ID` (필수): 동행복권 로그인 아이디
- `PASSWD` (필수): 동행복권 로그인 비밀번호
- `BROWSERLESS_WS_ENDPOINT` (필수): Browserless CDP WebSocket endpoint (예:
  `wss://...`)
- `BROWSERLESS_TOKEN` (선택): Browserless 토큰 (있으면 querystring으로 자동
  추가)
- `DISCORD_WEBHOOK_URL` (선택): 구매/검증 결과 알림용 Discord Webhook URL

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

- [main.ts](main.ts)
  - 브라우저/컨텍스트 생성
  - 로그인 수행
  - 예치금/구매가능 금액 조회
  - 로또 6/45 자동선택 구매 흐름 실행

- [src/env.ts](src/env.ts)
  - `.env` 로드 + 스키마 검증

- [src/lotto645.ts](src/lotto645.ts)
  - 게임645 페이지 이동 → 자동선택 5게임 담기 → 스크린샷 저장(`verify_645.png`)
  - (현재) 실제 구매 버튼 클릭은 주석 처리
  - (옵션) Discord Webhook 알림 전송

## Enabling real purchase

현재 [src/lotto645.ts](src/lotto645.ts)에서 실제 구매 버튼 클릭이 주석 처리되어
있습니다.

- 실제 구매를 원하면 `#btnBuy` 클릭 부분의 주석을 해제하세요.
- 사이트 UI/팝업/약관 동의 등 흐름이 바뀌면 selector가 깨질 수 있습니다.

## Output files

- `verify_645.png`: 로또 6/45 선택 내역 검증용 스크린샷

## Troubleshooting

- `❌ Invalid environment variables`가 뜨면 `.env` 값/형식을 확인하세요(특히 URL
  형식).
- 로그인 실패 시 동행복권 로그인 페이지의 selector가 바뀌었을 수 있습니다:
  [src/login.ts](src/login.ts).
- Browserless 연결 실패 시 endpoint가 **CDP WebSocket** 인지 확인하세요.

## Acknowledgements

이 프로젝트는 [yoonbae81/lotto](https://github.com/yoonbae81/lotto) 프로젝트를
참고하여 TypeScript(Deno)로 재작성되었습니다. 훌륭한 원본 코드를 공유해 주신
제작자분께 감사드립니다.

This project is a TypeScript port based on
[yoonbae81/lotto](https://github.com/yoonbae81/lotto). Special thanks to the
original author for the great work.

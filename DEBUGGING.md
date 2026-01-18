# 디버깅 가이드

에러가 발생했을 때 다음 파일들에서 정보를 확인할 수 있습니다.

## 에러 로그 파일

```
logs/error_YYYY-MM-DD.log
```

- 모든 에러 메시지와 스택 트레이스가 기록됩니다
- 실행할 때마다 추가됩니다 (기존 로그는 지워지지 않음)
- 시간 순서대로 정렬되어 있습니다

**예시:**

```
[2026-01-19T10:15:23.456Z] FATAL ERROR
Message: page.click: Target page, context or browser has been closed
Stack: Error: page.click: Target page, context or browser has been closed
    at Page.click (/path/to/playwright/page.ts:123)
    at buyLotto645 (/home/iceship/code/deno/lotto-deno/src/lotto645.ts:45)
============================================================
```

## 에러 스크린샷

```
screenshots/error_YYYY-MM-DDTHH-MM-SS-sssZ.png
```

- 에러 발생 시 자동으로 저장됩니다 (브라우저가 아직 열려있을 때)
- 브라우저가 이미 닫혀있으면 저장되지 않으므로 로그 파일을 확인하세요
- 에러가 발생한 정확한 시점의 화면을 볼 수 있습니다

## Discord 알림

- 스크린샷 및 에러 메시지가 Discord Webhook으로 전송됩니다
- 에러 스택 트레이스도 함께 표시됩니다
- Discord에서 완전한 에러 정보를 확인할 수 있습니다

## 실행 로그 (Console)

실행 시 콘솔 출력을 파일로 저장하려면:

```bash
deno task purchase 2>&1 | tee execution.log
```

- 실시간으로 모든 메시지를 콘솔에서 확인할 수 있습니다
- `execution.log`에 저장되므로 나중에 검토 가능합니다

## 일반적인 에러 메시지 해석

### `page.click: Target page, context or browser has been closed`

**원인:** 브라우저 또는 페이지가 먼저 닫혀있어서 추가 작업을 수행할 수 없음

**해결 방법:**

1. `logs/error_YYYY-MM-DD.log`에서 원래 에러 메시지를 찾으세요
2. 그 에러가 실제 문제입니다 (위 에러는 결과일 뿐입니다)
3. 예: "Payment mismatch" → 금액 검증 실패 → 하드 에러 처리 후 브라우저 종료

**예시 로그:**

```
[2026-01-19T10:15:23.456Z] FATAL ERROR
Message: ❌ Payment mismatch! Expected: 5000, Displayed: 4000
Stack: Error: ❌ Payment mismatch! Expected: 5000, Displayed: 4000
    at buyLotto645 (/src/lotto645.ts:42)
```

### `Payment mismatch! Expected: X, Displayed: Y`

**원인:** 결제 금액이 예상과 다름

**해결 방법:**

- 네트워크 상태 확인
- 동행복권 시스템 상태 확인
- 제한된 금액 등이 있는지 확인
- 재시도

### `Weekly Limit Exceeded`

**원인:** 주간 구매 한도 초과

**해결 방법:**

- 동행복권의 주간 구매 한도 규정 확인
- 다음 주를 기다린 후 재시도

### `page.waitForSelector: Timeout`

**원인:** 페이지 요소가 제한된 시간 내에 로딩되지 않음

**해결 방법:**

- 네트워크 상태 확인
- 동행복권 서버 상태 확인 (https://www.dhlottery.co.kr)
- 브라우저 서비스 상태 확인
- 일반적인 타임아웃은 5-15초 이상 기다립니다 (스크린샷 참고)

## 디버깅 팁

### 1. 최신 로그 확인

```bash
tail -f logs/error_*.log
```

### 2. 특정 날짜의 로그만 보기

```bash
cat logs/error_2026-01-19.log
```

### 3. 에러 메시지 검색

```bash
grep -r "Payment mismatch" logs/
```

### 4. Discord 알림 확인

- 구매 실패 시 Discord로 자동 알림이 전송됩니다
- 알림에는 스크린샷과 에러 메시지가 포함됩니다

### 5. 수동 테스트

```bash
# 개별 기능 테스트
deno run --allow-all src/lotto645.ts
deno run --allow-all src/balance.ts
```

## 개선사항

현재 버전에서는:

- ✅ 모든 에러를 `logs/` 디렉토리에 기록합니다
- ✅ 스택 트레이스를 포함합니다
- ✅ 에러 발생 시 스크린샷을 (가능하면) 저장합니다
- ✅ Discord로 완전한 에러 정보를 전송합니다
- ✅ 브라우저 종료 순서를 개선하여 "page closed" 에러를 방지합니다

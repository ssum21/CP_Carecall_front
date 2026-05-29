# SPEC 주제

**참고 영상:** https://youtu.be/m3-ZGSwZ6ww?si=qrsJ7ECm4hDSyqo6

## 타겟 고객

독거노인 돌봄 기관 및 지자체 복지 담당 부서

- **현재 상황:** 복지사 1인당 수십~수백 명 담당, 매일 안부 전화가 물리적으로 불가능

---

## 핵심 가치

**복지 사각지대 해소 + 돌봄 인력 부담 경감**

- AI가 매일 자동으로 안부 전화 실시
- 음성에서 이상 징후 감지 시 담당자에게 즉시 알림
  - 우울 감정 감지
  - 무응답 또는 비정상 응답
  - 건강 이상 징후
- 복지사는 위험군에만 집중 대응 가능 → 효율 극대화

---

## AWS 활용 구조

### 프론트엔드

**관리자 대시보드** (대상자 목록, 통화 이력, 위험도 현황)

- 프론트엔드 팀이 자신있는 프레임워크 사용 (React, Vue, Next.js 등)
- **S3 + CloudFront:** 정적 웹 호스팅
- **Amazon Cognito:** 관리자 로그인 및 JWT 토큰 발급, 기관(orgId) 단위 데이터 접근 제어

### 백엔드 - 통화 & AI 분석

- **Amazon Connect:** 자동 발신 콜 시스템 (스케줄링 기반)
- **Amazon Transcribe:** 통화 음성 → 텍스트 변환 (STT)
- **Amazon Comprehend:** 감정 분석 (부정/우울/무기력 감지)
- **Amazon Bedrock (Claude):** 대화 맥락 분석 & 위험도 종합 판단

### 백엔드 - 인프라

- **Lambda + API Gateway:** 서버리스 백엔드
- **Amazon Cognito:** 사용자 인증 및 JWT 토큰 검증, API Gateway Authorizer로 연결
- **DynamoDB:** 대상자 정보 & 통화 기록 저장 (orgId 파티션 키로 기관별 데이터 격리)
- **Amazon SNS:** 이상 감지 시 담당자 긴급 알림 (문자/카카오톡)
- **EventBridge:** 매일 정해진 시간 자동 발신 스케줄링

---

## 시스템 플로우

1. **스케줄링:** EventBridge가 매일 설정된 시간에 Lambda 함수 트리거
2. **자동 발신:** Lambda가 DynamoDB에서 대상자 목록을 조회하여 Amazon Connect를 통해 자동 전화
3. **대화 수행:** Connect가 사전 정의된 스크립트로 안부 확인 대화 진행
4. **음성 분석:** Transcribe로 음성을 텍스트로 변환
5. **감정/맥락 분석:** Comprehend와 Bedrock이 감정 상태 및 대화 맥락 분석
6. **위험도 판단:** AI가 종합적으로 위험도 평가 (정상/주의/위험)
7. **알림 발송:** 이상 징후 감지 시 SNS를 통해 담당 복지사에게 즉시 알림
8. **기록 저장:** 모든 통화 내용 및 분석 결과를 DynamoDB에 저장
9. **대시보드 업데이트:** 관리자 대시보드에 실시간 반영

## Architecture Description

### 통화 처리 파이프라인

1. EventBridge가 매일 오전 9시에 Scheduler Lambda를 호출한다.
2. Scheduler Lambda는 DynamoDB에서 오늘 발신 대상자 목록을 조회하고, 각 대상자별로 Connect StartOutboundVoiceContact API를 호출하여 전화를 건다.
3. Amazon Connect는 지정된 Contact Flow를 실행하여 분기형 안부 질문을 진행한다.
4. Contact Flow 중간에 RiskJudge Lambda를 호출하여 응답을 분석하고 위험도를 판단한다.
5. 위험 판정 시 SNS로 담당자에게 긴급 알림을 발송하고, 모든 결과는 DynamoDB에 기록된다.

### 대시보드 파이프라인

React 기반 웹 대시보드는 S3 + CloudFront로 배포하고, API Gateway + Lambda를 통해 DynamoDB의 데이터를 조회한다. 대시보드는 대상자 목록, 오늘의 통화 현황, 위험군 목록, 통화 이력 타임라인을 제공한다.

### 인증 파이프라인

1. 관리자가 대시보드에서 로그인 → Cognito User Pool에서 자격증명 검증
2. Cognito가 JWT 토큰 발급 (토큰 안에 `orgId` 포함)
3. 이후 모든 API 요청에 JWT 토큰 첨부 (`Authorization: Bearer {token}`)
4. API Gateway의 Cognito Authorizer가 토큰 유효성 자동 검증
5. Lambda가 토큰에서 `orgId` 추출 → 해당 기관 데이터만 DynamoDB에서 조회하여 반환

## AWS 아키텍처

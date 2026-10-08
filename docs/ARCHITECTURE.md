# ARCHITECTURE: 아덴힐 스마트 통합 관리 시스템

## 1. 기술 스택 (Tech Stack)
- Frontend: Next.js (App Router), React, Tailwind CSS, TypeScript
- Backend & Database: Supabase (PostgreSQL, Realtime, Storage)
- Hosting & CI/CD: Vercel (GitHub main 브랜치 푸시 시 자동 배포)

## 2. 프로젝트 디렉토리 구조
```text
antigravity/
├── CLAUDE.md                 # 프로젝트 최우선 헌법 및 절대 규칙
├── docs/                     # 프로젝트 핵심 기획/설계 문서
│   ├── PRD.md                # 제품 요구사항 정의서
│   ├── ARCHITECTURE.md       # 시스템 구조 및 폴더 규칙
│   └── UI_GUIDE.md           # 디자인 가이드 및 UI 금지 규칙
├── src/
│   ├── app/                  # Next.js App Router 페이지 및 API 라우트
│   │   ├── (auth)/           # 로그인 및 사용자 인증
│   │   ├── mobile/           # 현장 작업자 전용 모바일 1~2클릭 화면
│   │   ├── admin/            # 관리자 PC 대시보드 및 마스터 CRUD
│   │   └── api/              # 백엔드 API 엔드포인트
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   │   ├── mobile/           # 모바일 전용 단순 버튼/입력 컴포넌트
│   │   ├── admin/            # 관리자용 테이블, 차트, 모달
│   │   └── ui/               # 공통 기본 디자인 컴포넌트
│   ├── lib/                  # 외부 연동 및 공통 라이브러리
│   │   └── supabase/         # Supabase 클라이언트 및 설정
│   └── types/                # TypeScript 타입 정의 (자산, 차량, 자재 등)
└── .env.local                # 로컬 환경 변수 (Supabase URL 및 API Key)
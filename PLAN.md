# 폴라베어 계산기 리빌드 계획

## 목표
- 기존 `oox` 정적 계산기 6개를 **Next.js + Vercel + Supabase** 구조로 다시 만든다
- 계산이 끝나서 품목이 정해지면 **카페24 자사몰 장바구니에 한 번에 담기**까지 연결한다
- 최종 주소: `폴라베어.kr/calculator/...` (예: `폴라베어.kr/calculator/t5`)
- 기능 이식이 끝난 다음 디자인을 리뉴얼한다

## 기본 정보
| 항목 | 내용 |
|---|---|
| 로컬 경로 | `/Users/scrowna/Desktop/web/polarbear calculator` |
| GitHub | https://github.com/swa44/polarbear_calculator |
| 원본 소스 | `/Users/scrowna/Desktop/web/oox/root` |
| 배포 | Vercel (`basePath: /calculator`) |
| DB | Supabase |
| 쇼핑몰 | 카페24 자사몰 |

### 가져올 것 / 버릴 것
- **가져옴**: 계산기 6개(`t5`, `t5nu`, `t3`, `12vbb`, `24vbb`, `mline`), 계산기에 쓰는 이미지(측정 가이드, 샘플 이미지), 파비콘
- **버림**: `psd/` 폴더 전체
- **검토 후 결정**: 메인 `index.html`, `guide/*.html` 10개, about / terms / privacy, AdSense, GA, `/kjk` 리다이렉트
  → 자사몰로 연결하는 구조라 AdSense는 빼는 쪽을 권장

---

## Phase 0. 프로젝트 세팅
- [x] Next.js 생성 (App Router, TypeScript, Tailwind, ESLint) — Next 16.4
- [x] `next.config.ts`에 `basePath: '/calculator'` 설정
- [x] git init 후 `swa44/polarbear_calculator`에 연결 (첫 push는 아직)
- [ ] Vercel 프로젝트 연결 (push하면 자동 배포)
- [ ] Supabase 프로젝트 생성, 환경변수 등록 (`.env.local` + Vercel)
- [x] `.env.example` 작성

> ⚠️ 로컬 폴더 경로에 공백(`polarbear calculator`)이 있으면 Turbopack의 Tailwind 로더가 실패해서 `next build`/`next dev`가 안 됨.
> 폴더 이름을 `polarbear_calculator`로 바꾸는 게 좋음 (Vercel 빌드는 영향 없음)

## Phase 1. 구조 / 라우팅
```
app/
  layout.tsx              공통 레이아웃 (헤더 로고: /logo.png)
  page.tsx                /calculator          계산기 목록
  t5/page.tsx             /calculator/t5       남영 T5
  t5nu/page.tsx           /calculator/t5nu     누빔 T5
  t3/page.tsx             /calculator/t3       T3
  12vbb/page.tsx          /calculator/12vbb    12V 블럭바
  24vbb/page.tsx          /calculator/24vbb    24V 블럭바
  mline/page.tsx          /calculator/mline    매립 라인조명
  api/cart/route.ts       장바구니 연동용 서버 API (Phase 4)
lib/
  calc/                   계산 로직, 순수 함수 (UI와 분리)
  products.ts             품목 데이터 조회 (Supabase)
  cafe24.ts               카페24 연동
components/               공통 UI (타입 선택, 입력, 결과표, 합계바, 장바구니 버튼)
public/                   이미지, 파비콘, logo.png
```
- 계산기마다 페이지를 따로 둬서 URL로 바로 들어갈 수 있게 함
- 이미지 경로는 `basePath` 기준으로 정리 (기존 `/t5/assets/...` 하드코딩 경로를 수정)

## Phase 2. 계산기 이식 (디자인은 기존 그대로)
계산기마다 같은 순서로 진행:
1. `app.js`의 데이터(사이즈, 단가)와 계산 로직을 `lib/calc/<이름>.ts`로 분리
2. DOM 조작 코드를 React 상태로 바꿈
3. 계산 결과를 **공통 형식**으로 내보내게 통일 (아래 참고). 장바구니 연동의 기준이 됨
4. 기존 사이트와 같은 값을 넣고 결과가 똑같은지 비교 검증

진행 순서: `t5` → `t5nu` → `t3` → `12vbb` → `24vbb` → `mline`

진행 상황:
- [x] `t5`, `t5nu`: 공통 로직 `lib/calc/tube.ts` + UI `components/legacy/TubeCalculator.tsx`. 원본과 길이 4,572건 비교해서 결과 동일
- [ ] `t3` (같은 tube 로직을 쓸 가능성이 높음. 차이 확인 필요)
- [ ] `12vbb`, `24vbb`, `mline`
- GA, AdSense는 아직 안 넣음 (결정 대기 4번)

### 공통 결과 형식 (초안)
```ts
type CartLine = {
  sku: string;       // 내부 품목 코드 (예: "t5-namyoung-1200")
  name: string;      // 표시용 이름
  quantity: number;
  unitPrice: number;
};
```

## Phase 3. Supabase: 품목 ↔ 카페24 상품 매핑
코드에 하드코딩된 단가를 DB로 옮기고, 각 품목에 카페24 상품 정보를 연결한다.

`products` 테이블 (초안)
| 컬럼 | 설명 |
|---|---|
| `sku` (PK) | 내부 품목 코드 |
| `calculator` | 소속 계산기 (`t5`, `mline` ...) |
| `name` | 품목명 |
| `spec` | 사이즈, 길이 등 계산용 값 (jsonb) |
| `price` | 단가 |
| `cafe24_product_no` | 카페24 상품번호 |
| `cafe24_variant_code` | 카페24 옵션(품목) 코드 |
| `active` | 판매 여부 |

- [ ] 테이블 생성, RLS 설정 (읽기는 공개, 쓰기는 관리자만)
- [ ] 기존 `app.js`의 단가 데이터를 시드로 입력
- [ ] 카페24 관리자에서 상품번호와 옵션 코드를 확인해서 매핑 입력
- [ ] 페이지에서는 서버 컴포넌트로 조회하고 revalidate로 캐싱

## Phase 4. 카페24 장바구니 연동 ⚠️ 사전 조사 필요
계산 결과(`CartLine[]`)를 카페24 장바구니에 한 번에 담는다.

### 조사 항목
- [ ] 카페24 개발자센터 앱 등록 (Client ID / Secret, 필요 권한 범위)
- [ ] **비회원 장바구니** 담기가 가능한지 (Front API는 고객 인증이 필요할 수 있음)
- [ ] 여러 상품·옵션을 한 번에 담는 방법

### 후보 방식
| 방식 | 설명 | 장점 | 단점 |
|---|---|---|---|
| A. 카페24 Front API | 서버(`/api/cart`)에서 장바구니 API 호출 | 공식 방식 | 고객 인증·토큰 처리 필요, 비회원 제약 가능성 |
| B. 자사몰 스킨에 수신 페이지 | 계산기가 품목 목록을 URL 파라미터로 넘기면, 카페24 스킨 안의 스크립트가 장바구니에 담고 장바구니 페이지로 이동 | 비회원 가능, 자사몰 쿠키·세션을 그대로 씀 | 카페24 스킨 수정 필요 |
| C. 상품별 개별 담기 | 품목마다 상품 페이지 링크 제공 | 구현이 쉬움 | "한 번에 담기" 목표를 못 이룸 (임시 대안) |

→ 조사 결과를 보고 A 또는 B로 결정. 장바구니는 자사몰 도메인의 세션을 쓰기 때문에 **B가 현실적일 가능성이 높음**

### 공통 작업
- [ ] 결과 화면에 "장바구니 담기" 버튼과 담길 품목 미리보기
- [ ] 매핑 안 된 품목이나 품절 품목 처리 (안내 문구)
- [ ] 담기 실패 시 안내와 재시도

## Phase 5. 도메인 / 배포
목표 주소: `폴라베어.kr/calculator` (퓨니코드: `xn--` 형식으로 변환된 주소로 DNS 설정)

> ⚠️ **확인 필요**: `폴라베어.kr`이 카페24 자사몰 도메인이라면 Vercel이 하위 경로(`/calculator`)만 따로 가져갈 수 없음.
> 그럴 경우 아래 중에서 선택:
> - **서브도메인**: `calc.폴라베어.kr` → Vercel (가장 간단)
> - **리버스 프록시**: 메인 도메인을 Vercel로 두고 `/calculator` 외 경로는 카페24로 rewrite (복잡하고 카페24 쪽 제약이 있음)
> - 메인 도메인이 카페24가 아니라면 Vercel에 그대로 연결하면 됨
>
> 장바구니 방식 B를 쓰면 계산기 도메인이 달라도 문제없음

- [ ] 도메인 구조 확정
- [ ] Vercel 프리뷰 URL에서 6개 계산기 + 장바구니 연동 전체 점검
- [ ] 도메인 연결
- [ ] 기존 oox 사이트 처리 (새 주소로 리다이렉트할지, 그대로 둘지)

## Phase 6. 디자인 리뉴얼
- [ ] 디자인 방향 결정 (자사몰 톤과 맞추기)
- [ ] 색상, 타이포, 공통 컴포넌트 정의
- [ ] 계산기 페이지와 결과·장바구니 화면에 적용
- [ ] 모바일 우선으로 점검

---

## 결정 대기 항목
1. 카페24 장바구니 방식 (A / B), Phase 4 조사 후 결정
2. `폴라베어.kr`이 카페24 자사몰 도메인인지 → 최종 URL 구조
3. 가이드 글, about / terms / privacy 페이지를 가져올지
4. GA는 유지하고 AdSense는 뺄지
5. 단가 수정용 관리자 페이지가 필요한지 (필요 없으면 Supabase 대시보드에서 직접 수정)

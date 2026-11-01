# 폴라베어 계산기 리빌드 계획

## 목표
- 기존 `oox` 정적 계산기 6개를 **Next.js + Vercel + Supabase** 구조로 다시 만든다
- 계산이 끝나서 품목이 정해지면 **카페24 자사몰 장바구니에 한 번에 담기**까지 연결한다
- 최종 주소: `계산기.폴라베어.kr/...` (예: `계산기.폴라베어.kr/t5`)
- 기능 이식이 끝난 다음 디자인을 리뉴얼한다

## 기본 정보
| 항목 | 내용 |
|---|---|
| 로컬 경로 | `/Users/scrowna/Desktop/web/polarbear_calculator` |
| GitHub | https://github.com/swa44/polarbear_calculator |
| 원본 소스 | `/Users/scrowna/Desktop/web/oox/root` |
| 배포 | Vercel, `계산기.폴라베어.kr` (루트 배포) |
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
- [x] `next.config.ts`에 basePath 설정 → 서브도메인 배포로 바꾸면서 비움 (`lib/basePath.ts`)
- [x] git init 후 `swa44/polarbear_calculator`에 연결 (첫 push는 아직)
- [ ] Vercel 프로젝트 연결 (push하면 자동 배포)
- [ ] Supabase 프로젝트 생성, 환경변수 등록 (`.env.local` + Vercel)
- [x] `.env.example` 작성

> 로컬 폴더명을 `polarbear_calculator`로 변경함 (경로 공백 때문에 Turbopack Tailwind 로더가 실패했음)

## Phase 1. 구조 / 라우팅
```
app/
  layout.tsx              공통 레이아웃 (헤더 로고: /logo.png)
  page.tsx                /                    계산기 목록
  t5/page.tsx             /t5                 남영 디밍 T5
  t5nu/page.tsx           /t5nu               누빔 T5
  t3/page.tsx             /t3                 T3
  12vbb/page.tsx          /12vbb              12V 블럭바
  24vbb/page.tsx          /24vbb              24V 블럭바
  mline/page.tsx          /mline              매립 라인조명
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
- [x] `t5`, `t5nu`, `t3`: 공통 로직 `lib/calc/tube.ts` + UI `components/legacy/TubeCalculator.tsx`. 원본과 6,858건 비교 결과 동일
- [x] `12vbb`, `24vbb`: `lib/calc/blockbar.ts` + `BlockBarCalculator.tsx`. 원본과 371,984건 비교 결과 동일
- [x] `mline`: `lib/calc/mline.ts` + `MlineCalculator.tsx`. 원본과 119,721건 비교 결과 동일
- 원본의 오타/어색한 동작(12V "고정클림", 24V 클립 0개 줄 표시 등)은 일단 그대로 유지. 디자인 리뉴얼 때 정리
- 장바구니 sku는 임시 규칙 (`bb12-1000`, `mline-40-line-1000` 등). Phase 3에서 확정
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

- Supabase 프로젝트: `polarebear_quotation` (회사 관리 DB와 같이 사용, ref `wetigiwdevokobwrcwsv`)
- **계산기 테이블은 모두 `calculator_` 접두어**를 붙여 기존 `control_*` 등과 구분한다
- 길이, 소비전력, 계산 규칙은 코드(`lib/calc`)에 두고, **단가와 카페24 매핑만 DB**에 둔다

`calculator_products` 테이블 ([마이그레이션](supabase/migrations/20261031000000_calculator_products.sql))
| 컬럼 | 설명 |
|---|---|
| `sku` (PK) | 내부 품목 코드 (`CartLine.sku`와 같음) |
| `calculator` | 소속 계산기 (`t5`, `mline` ...) |
| `name` | 품목명 |
| `price` | 단가 |
| `cafe24_product_no` | 카페24 상품번호 |
| `cafe24_variant_code` | 카페24 옵션(품목) 코드 |
| `memo` | 메모 |
| `active` | 판매 여부 (Phase 4 장바구니에서 사용) |
| `sort_order` | 정렬 순서 |

- [x] 테이블 생성, RLS 설정 (읽기는 공개, 쓰기는 secret key만)
- [x] 코드 단가 83개 시드 입력 ([seed.sql](supabase/seed.sql), [products.csv](supabase/products.csv))
- [x] 페이지에서 DB 단가 조회 (`lib/products.ts`, `use cache` + `cacheLife("hours")`)
  - DB 조회 실패나 DB에 없는 sku는 코드 기본 단가 사용
  - DB에서 단가를 바꾸면 **최대 1시간 뒤** 반영
- [ ] 카페24 관리자에서 상품번호와 옵션 코드를 확인해서 매핑 입력
- [ ] 계산기마다 같은 실제 상품 정리 (예: 24V SMPS = 매립라인 SMPS, 12V/24V 클립·커버·코너각대)

### SQL 실행 방법
테이블 생성과 시드는 `supabase db push`가 아니라 `supabase db query --linked -f <파일>`로 실행했다.
같은 DB를 쓰는 다른 프로젝트의 마이그레이션 기록과 섞이지 않게 하기 위해서다.

## Phase 4. 카페24 장바구니 연동 ✅
계산 결과 → "구매하러 가기" → 색온도 선택 → 자사몰(polarbearmarket.com) 장바구니에 한 번에 담기.

### 구조
- 카페24 몰 아이디 `polarbearshop`, 앱 Client ID `sOg4Bz7LLBwgiHMvvsHAvC` (앱 권한: 상품 읽기, 개인화정보 읽기+쓰기)
- 장바구니는 고객의 자사몰 세션에 묶여 있어 계산기 서버가 직접 담을 수 없다
  → 계산기가 `https://polarbearmarket.com/order/basket.html#pbcart=<base64url [[상품번호, 옵션코드, 수량], ...]>` 로 이동
  → 자사몰 장바구니 페이지에 넣은 스크립트(`public/cafe24-cart.js`)가 `CAFE24API.addCart` 로 담고 장바구니를 새로 고침
- 비회원도 담김 (테스트 완료). 한 번에 10개씩 나눠 담음
- 스크립트 위치: Supabase Storage `calculator-public/cafe24-cart.js` (스킨 `order/basket.html` 맨 끝에 `<script src>` 한 줄)
  - 스크립트를 고치면 Storage에 다시 올려야 반영됨. Vercel 배포 후 그쪽 주소로 옮겨도 됨
  - 스킨을 고치지 않는 대안: `scripts/cafe24-script-tag.mjs` (앱 스크립트 등록, Client Secret 필요)

### 데이터
- `calculator_cafe24_variants`: 품목(sku) × 색온도 → 카페24 상품번호/옵션 코드/판매가
- `scripts/sync-cafe24.mjs`: 카페24 옵션·가격을 읽어 위 테이블과 `calculator_products.price`를 갱신
  - **자사몰에서 가격·옵션을 바꾸면 실행**: `node --env-file=.env.local scripts/sync-cafe24.mjs` (`--dry`로 미리보기)
  - 계산기 금액 = 자사몰 판매가 (사이트 반영은 최대 1시간 뒤)
- 사이드캡은 규격별 상품이라 `mline-40-sidecap`(1,000원) / `mline-60-sidecap`(1,600원)으로 분리

### 남은 것
- [ ] Vercel 배포 후 실제 주소에서 한 번 더 확인
- [ ] 자사몰 상품을 새로 추가·삭제하면 `sync-cafe24.mjs`의 연결 규칙(상품번호) 수정 필요

## Phase 5. 도메인 / 배포
최종 주소: **`계산기.폴라베어.kr`** (퓨니코드 `xn--989a00a691b.xn--oi2bn1hh5i3lp.kr`), 루트에 배포 (`BASE_PATH` 비움)
- 예: `계산기.폴라베어.kr/t5`, `계산기.폴라베어.kr/mline`
- DNS: Cloudflare에서 `계산기` CNAME → Vercel 연결 완료 (프록시 끔, DNS only)

Vercel 환경변수 (공개용 값만)
| 변수 | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `NEXT_PUBLIC_CAFE24_CLIENT_ID` | 카페24 앱 Client ID |
| `NEXT_PUBLIC_CAFE24_MALL_URL` | `https://polarbearmarket.com` |

- [x] 도메인 구조 확정, DNS 연결
- [ ] GitHub push → Vercel 배포, 도메인 추가
- [ ] 배포 주소에서 6개 계산기 + 장바구니 연동 점검
- [ ] 기존 oox 사이트 처리 (새 주소로 리다이렉트할지, 그대로 둘지)

## Phase 6. 디자인 리뉴얼
- [x] 1차 리뉴얼: 폴라베어 로고 톤의 흑백 모노톤, Pretendard 폰트
- [x] 디자인 토큰과 공통 클래스를 `app/globals.css` 하나로 통합 (기존 legacy CSS 3개 삭제)
- [x] 공통 헤더(로고)·푸터, 홈 계산기 목록(그룹별 카드), 6개 계산기 화면 적용
- [x] 모바일(390px)·데스크톱 화면 점검, 리뉴얼 후 원본과 결과 비교 69건 일치
- [ ] 자사몰 톤과 최종 맞추기 (자사몰 디자인 확정 후)
- [ ] 장바구니 담기 화면 (Phase 4와 함께)

---

## 결정 대기 항목
1. 카페24 장바구니 방식 (A / B), Phase 4 조사 후 결정
2. `폴라베어.kr`이 카페24 자사몰 도메인인지 → 최종 URL 구조
3. 가이드 글, about / terms / privacy 페이지를 가져올지
4. GA는 유지하고 AdSense는 뺄지
5. 단가 수정용 관리자 페이지가 필요한지 (필요 없으면 Supabase 대시보드에서 직접 수정)

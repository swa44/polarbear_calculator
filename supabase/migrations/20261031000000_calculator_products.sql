-- 계산기 품목 단가 + 카페24 상품 매핑
-- 같은 DB의 회사 관리 테이블(control_*)과 구분하기 위해 calculator_ 접두어를 쓴다.

create table if not exists public.calculator_products (
  sku                 text primary key,              -- 내부 품목 코드 (lib/calc 의 CartLine.sku)
  calculator          text not null,                 -- t5, t5nu, t3, 12vbb, 24vbb, mline
  name                text not null,                 -- 표시용 품목명
  price               integer not null check (price >= 0),
  cafe24_product_no   integer,                       -- 카페24 상품번호
  cafe24_variant_code text,                          -- 카페24 옵션(품목) 코드
  memo                text,
  active              boolean not null default true, -- 판매 여부 (Phase 4 장바구니에서 사용)
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists calculator_products_calculator_idx
  on public.calculator_products (calculator, sort_order);

create or replace function public.calculator_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calculator_products_updated_at on public.calculator_products;
create trigger calculator_products_updated_at
  before update on public.calculator_products
  for each row execute function public.calculator_set_updated_at();

-- RLS: 누구나 읽기 가능 (단가는 공개 정보), 쓰기는 secret key(service_role)만
alter table public.calculator_products enable row level security;

drop policy if exists "calculator_products public read" on public.calculator_products;
create policy "calculator_products public read"
  on public.calculator_products
  for select
  to anon, authenticated
  using (true);

grant select on public.calculator_products to anon, authenticated;
grant all on public.calculator_products to service_role;

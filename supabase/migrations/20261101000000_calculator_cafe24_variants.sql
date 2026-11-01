-- 계산기 품목(sku) × 색온도 → 카페24 상품번호/옵션(품목) 코드
-- scripts/sync-cafe24.mjs 가 카페24 Front API 에서 읽어 채운다. 손으로 고치지 않는다.

create table if not exists public.calculator_cafe24_variants (
  sku           text not null references public.calculator_products (sku) on delete cascade,
  color         text not null default '',  -- 전구색, 주백색, 주광색, 전주백색 / 색온도 없는 품목은 ''
  product_no    integer not null,
  variant_code  text not null,              -- 예: P00000JZ000M
  option_label  text not null,              -- 카페24 옵션명 (확인용)
  price         integer not null,           -- 카페24 판매가 (기본가 + 옵션 추가금)
  selling       boolean not null default true,
  updated_at    timestamptz not null default now(),
  primary key (sku, color)
);

alter table public.calculator_cafe24_variants enable row level security;

drop policy if exists "calculator_cafe24_variants public read" on public.calculator_cafe24_variants;
create policy "calculator_cafe24_variants public read"
  on public.calculator_cafe24_variants
  for select
  to anon, authenticated
  using (true);

grant select on public.calculator_cafe24_variants to anon, authenticated;
grant all on public.calculator_cafe24_variants to service_role;

-- 사이드캡은 카페24에서 규격별(40/60)로 나뉘어 있어 품목을 둘로 나눈다
insert into public.calculator_products (sku, calculator, name, price, sort_order)
values
  ('mline-40-sidecap', 'mline', '매립라인조명 40 사이드캡[2개]', 1000, 76),
  ('mline-60-sidecap', 'mline', '매립라인조명 60 사이드캡[2개]', 1600, 77)
on conflict (sku) do nothing;
delete from public.calculator_products where sku = 'mline-sidecap';

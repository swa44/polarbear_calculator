-- T5·T3 구매 확인창 부속: T3 양방향 연결잭 + 전원코드 4종 (단가는 sync-cafe24.mjs 가 카페24에서 가져옴)
insert into public.calculator_products (sku, calculator, name, price, sort_order) values
  ('t3-jack-30',  't3', '누빔 T3 양방향 연결잭 30cm', 0, 10),
  ('t3-jack-60',  't3', '누빔 T3 양방향 연결잭 60cm', 0, 11),
  ('t3-jack-120', 't3', '누빔 T3 양방향 연결잭 1.2M', 0, 12),
  ('t5-nubim-cord-150',       't5nu', '누빔 T5 전원코드 1.5M', 0, 20),
  ('t5-nubim-cord-300',       't5nu', '누빔 T5 전원코드 3M', 0, 21),
  ('t5-nubim-cord-150-sw',    't5nu', '누빔 T5 전원코드 1.5M (중간스위치)', 0, 22),
  ('t5-nubim-cord-300-sw',    't5nu', '누빔 T5 전원코드 3M (중간스위치)', 0, 23),
  ('t3-cord-150',             't3',   '누빔 T3 전원코드 1.5M', 0, 20),
  ('t3-cord-300',             't3',   '누빔 T3 전원코드 3M', 0, 21),
  ('t3-cord-150-sw',          't3',   '누빔 T3 전원코드 1.5M (중간스위치)', 0, 22),
  ('t3-cord-300-sw',          't3',   '누빔 T3 전원코드 3M (중간스위치)', 0, 23)
on conflict (sku) do nothing;

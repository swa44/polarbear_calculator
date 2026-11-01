-- T5 양방향 연결잭 (구매 확인창에서 고르는 추가 품목, 단가는 sync-cafe24.mjs 가 카페24에서 가져옴)
insert into public.calculator_products (sku, calculator, name, price, sort_order) values
  ('t5-namyoung-jack-30',  't5',   '남영 디밍 T5 양방향 연결잭 30cm', 0, 10),
  ('t5-namyoung-jack-60',  't5',   '남영 디밍 T5 양방향 연결잭 60cm', 0, 11),
  ('t5-namyoung-jack-120', 't5',   '남영 디밍 T5 양방향 연결잭 1.2M', 0, 12),
  ('t5-nubim-jack-30',     't5nu', '누빔 T5 양방향 연결잭 30cm', 0, 10),
  ('t5-nubim-jack-60',     't5nu', '누빔 T5 양방향 연결잭 60cm', 0, 11),
  ('t5-nubim-jack-120',    't5nu', '누빔 T5 양방향 연결잭 1.2M', 0, 12)
on conflict (sku) do nothing;

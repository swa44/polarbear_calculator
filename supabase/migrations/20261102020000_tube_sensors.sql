-- 센서·스위치 부속 (T3: 마이크로파센서, 누빔 T5: 전원스위치·동작감지센서)
insert into public.calculator_products (sku, calculator, name, price, sort_order) values
  ('t3-sensor-mw',    't3',   '누빔 T3 마이크로파센서', 0, 30),
  ('t5-nubim-switch', 't5nu', '누빔 T5 전원스위치', 0, 30),
  ('t5-nubim-sensor', 't5nu', '누빔 T5 동작감지센서', 0, 31)
on conflict (sku) do nothing;

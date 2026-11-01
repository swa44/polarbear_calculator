import type { TubeProduct } from "./tube";

/** 남영 디밍 T5. 원본: oox/root/t5/app.js (단가는 Supabase/카페24 동기화 값이 우선, 여기는 기본값) */
export const t5: TubeProduct = {
  skuPrefix: "t5-namyoung",
  name: "남영 디밍 T5",
  sizes: [
    { label: "1200", length: 1160, price: 13800 },
    { label: "900", length: 860, price: 13200 },
    { label: "600", length: 560, price: 11500 },
    { label: "400", length: 390, price: 10800 },
    { label: "300", length: 300, price: 9800 },
  ],
};


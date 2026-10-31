import type { TubeProduct } from "./tube";

/** 남영 T5. 원본: oox/root/t5/app.js (Phase 3에서 Supabase로 이전 예정) */
export const t5: TubeProduct = {
  skuPrefix: "t5-namyoung",
  name: "남영 T5",
  sizes: [
    { label: "1200", length: 1160, price: 6700 },
    { label: "900", length: 860, price: 6200 },
    { label: "600", length: 560, price: 5800 },
    { label: "400", length: 390, price: 6100 },
    { label: "300", length: 300, price: 3800 },
  ],
};


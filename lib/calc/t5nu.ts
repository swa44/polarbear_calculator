import type { TubeProduct } from "./tube";

/** 누빔 T5. 원본: oox/root/t5nu/app.js (Phase 3에서 Supabase로 이전 예정) */
export const t5nu: TubeProduct = {
  skuPrefix: "t5-nubim",
  name: "누빔 T5",
  sizes: [
    { label: "1500", length: 1505, price: 7200 },
    { label: "1200", length: 1180, price: 4800 },
    { label: "900", length: 880, price: 4600 },
    { label: "600", length: 580, price: 4200 },
    { label: "400", length: 375, price: 4600 },
    { label: "300", length: 285, price: 2800 },
  ],
};


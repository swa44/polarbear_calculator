import type { TubeProduct } from "./tube";

/** 누빔 T5. 원본: oox/root/t5nu/app.js (단가는 Supabase/카페24 동기화 값이 우선, 여기는 기본값) */
export const t5nu: TubeProduct = {
  skuPrefix: "t5-nubim",
  name: "누빔 T5",
  sizes: [
    { label: "1500", length: 1505, price: 9000 },
    { label: "1200", length: 1180, price: 5700 },
    { label: "900", length: 880, price: 5500 },
    { label: "600", length: 580, price: 5100 },
    { label: "400", length: 375, price: 4900 },
    { label: "300", length: 285, price: 4700 },
  ],
};


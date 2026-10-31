import type { TubeProduct } from "./tube";

/** T3. 원본: oox/root/t3/app.js (Phase 3에서 Supabase로 이전 예정) */
export const t3: TubeProduct = {
  skuPrefix: "t3",
  name: "T3",
  sizes: [
    { label: "1200", length: 1175, price: 6500 },
    { label: "900", length: 875, price: 6300 },
    { label: "600", length: 575, price: 6000 },
    { label: "400", length: 370, price: 5900 },
    { label: "300", length: 280, price: 5800 },
  ],
};

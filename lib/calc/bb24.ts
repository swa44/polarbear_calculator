import type { BlockBarProduct } from "./blockbar";

/** 24V 블럭바. 원본: oox/root/24vbb/app.js (Phase 3에서 Supabase로 이전 예정) */
export const bb24: BlockBarProduct = {
  skuPrefix: "bb24",
  smpsSkuPrefix: "smps24",
  name: "24V 블럭바",
  smpsName: "24V SMPS",
  // 24V는 50mm 규격 없음
  sizes: [1000, 500, 400, 300, 200, 100],
  prices: { 100: 4000, 200: 5000, 300: 6000, 400: 7000, 500: 8000, 1000: 15900 },
  watts: { 100: 1.5, 200: 3, 300: 4.5, 400: 6, 500: 7.5, 1000: 15 },
  midPrice: 17900,
  midLabel: "중간케이블형",
  unit: 100,
  leftoverPolicy: "prefer40to99",
  smps: [
    { watt: 60, price: 12800 },
    { watt: 100, price: 24000 },
    { watt: 200, price: 34000 },
    { watt: 300, price: 38000 },
  ],
  loadLimit: 0.7,
  accessories: {
    screwClip: 120,
    tapeClip: 200,
    powerLine: 1450,
    cover: 1600,
    cornerAngle: 2300,
    cornerClip: 120,
    cornerClipsPerAngle: 3,
  },
  warnLength: 5000,
  // 24V 원본은 병렬연결에서는 경고 모달을 띄우지 않음
  warnParallel: false,
  // 24V 원본은 클립 수량이 0개여도 부속품 카드에 줄을 표시함
  alwaysShowClipLines: true,
  summaryClipLabel: "고정클립",
};

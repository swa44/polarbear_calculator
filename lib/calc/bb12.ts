import type { BlockBarProduct } from "./blockbar";

/** 12V 블럭바. 원본: oox/root/12vbb/app.js (Phase 3에서 Supabase로 이전 예정) */
export const bb12: BlockBarProduct = {
  skuPrefix: "bb12",
  smpsSkuPrefix: "smps12",
  name: "12V 블럭바",
  smpsName: "12V SMPS",
  sizes: [1000, 500, 400, 300, 200, 100, 50],
  prices: { 50: 1700, 100: 1800, 200: 2100, 300: 2700, 400: 3700, 500: 4600, 1000: 8800 },
  watts: { 50: 0.75, 100: 1.5, 200: 3, 300: 4.5, 400: 6, 500: 7.5, 1000: 15 },
  midPrice: 10700,
  midLabel: "중간연결형",
  unit: 50,
  leftoverPolicy: "fixed50to99",
  smps: [
    { watt: 60, price: 12800 },
    { watt: 100, price: 21000 },
    { watt: 200, price: 27000 },
    { watt: 300, price: 29500 },
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
  warnLength: 3000,
  warnParallel: true,
  alwaysShowClipLines: false,
  // 원본 오타 그대로 유지 (하단 요약에만 "고정클림"으로 표기됨)
  summaryClipLabel: "고정클림",
};

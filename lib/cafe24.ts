/**
 * 계산 결과 → 카페24 자사몰 장바구니 연동 (브라우저에서도 쓰는 순수 함수)
 *
 * 흐름: 계산기 "구매하러 가기" → 색온도 선택 → 자사몰 /order/basket.html#pbcart=... 로 이동
 *       → 자사몰에 등록한 public/cafe24-cart.js 가 CAFE24API.addCart 로 담고 장바구니를 새로 고침
 */
import type { CartLine } from "./calc/types";
import type { Cafe24Map } from "./products";

/** 색온도 표시 순서 */
export const COLOR_ORDER = ["전구색", "전주백색", "주백색", "주광색"] as const;

export const COLOR_DESC: Record<string, string> = {
  전구색: "3000K · 따뜻한 노란빛",
  전주백색: "3500K · 은은한 아이보리빛",
  주백색: "4000K · 자연스러운 흰빛",
  주광색: "6000K · 밝고 푸른 흰빛",
};

/** 주광색이 6500K 인 제품 (T5·T3·매립라인) */
export const COLOR_DESC_6500: Record<string, string> = { 주광색: "6500K · 밝고 푸른 흰빛" };

/** 색온도가 있는 품목(조명)들이 공통으로 가진 색온도. 조명이 없으면 빈 배열 */
export function availableColors(lines: CartLine[], map: Cafe24Map): string[] {
  const sets: string[][] = lines
    .map((l) =>
      Object.entries(map[l.sku] ?? {})
        .filter(([c, v]) => c !== "" && v.selling)
        .map(([c]) => c),
    )
    .filter((colors) => colors.length > 0); // 색온도 없는 품목 (부속품·SMPS) 제외
  if (!sets.length) return [];
  return COLOR_ORDER.filter((c) => sets.every((colors) => colors.includes(c)));
}

export type PurchaseItem = CartLine & { color: string };
export type CartPayload = [productNo: number, variantCode: string, quantity: number][];

/** 담을 품목과 카페24 요청 데이터. 자사몰에 없거나 판매중지인 품목은 missing 으로 */
export function buildPurchase(lines: CartLine[], map: Cafe24Map, color: string | null) {
  const items: PurchaseItem[] = [];
  const missing: CartLine[] = [];
  const byCode = new Map<string, CartPayload[number]>();
  for (const l of lines) {
    const opts = map[l.sku] ?? {};
    const hasColor = Object.keys(opts).some((c) => c !== "");
    const v = hasColor ? (color ? opts[color] : undefined) : opts[""];
    if (!v || !v.selling) {
      if (!hasColor || color) missing.push(l);
      continue;
    }
    items.push({ ...l, color: hasColor ? (color as string) : "" });
    const prev = byCode.get(v.variantCode);
    if (prev) prev[2] += l.quantity;
    else byCode.set(v.variantCode, [v.productNo, v.variantCode, l.quantity]);
  }
  return { items, missing, payload: [...byCode.values()] };
}

/** base64url(JSON) — 한글 없이 숫자/옵션코드만 담는다 */
function encode(payload: CartPayload): string {
  return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function cartUrl(payload: CartPayload): string {
  const mall = (process.env.NEXT_PUBLIC_CAFE24_MALL_URL || "https://polarbearmarket.com").replace(/\/$/, "");
  return `${mall}/order/basket.html#pbcart=${encode(payload)}`;
}

/**
 * Supabase calculator_products 테이블에서 단가를 읽어 계산기 데이터(lib/calc)에 덮어쓴다.
 * - 서버 컴포넌트(page.tsx)에서만 호출한다.
 * - DB 조회에 실패하거나 sku가 DB에 없으면 코드의 기본 단가를 그대로 쓴다.
 */
import { cacheLife, cacheTag } from "next/cache";
import type { BlockBarProduct } from "./calc/blockbar";
import { DEFAULT_PRICES, type MlinePrices } from "./calc/mline";
import type { TubeProduct } from "./calc/tube";

export const PRODUCTS_CACHE_TAG = "calculator-products";

export type PriceMap = Record<string, number>;

/** calculator 별 { sku: price } */
export async function getPrices(calculator: string): Promise<PriceMap> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[products] Supabase 환경변수가 없어 코드 기본 단가를 사용합니다.");
    return {};
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/calculator_products?select=sku,price&calculator=eq.${encodeURIComponent(calculator)}`,
      { headers: { apikey: key } },
    );
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const rows: { sku: string; price: number }[] = await res.json();
    return Object.fromEntries(rows.map((r) => [r.sku, r.price]));
  } catch (e) {
    console.error(`[products] ${calculator} 단가 조회 실패, 코드 기본 단가를 사용합니다.`, e);
    return {};
  }
}

/** 카페24 옵션: sku → 색온도("" = 색온도 없음) → 상품번호/옵션 코드 */
export type Cafe24Map = Record<string, Record<string, { productNo: number; variantCode: string; selling: boolean }>>;

/** calculator 별 카페24 옵션 매핑 (scripts/sync-cafe24.mjs 가 채움) */
export async function getCafe24Map(calculator: string): Promise<Cafe24Map> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {};
  try {
    const res = await fetch(
      `${url}/rest/v1/calculator_cafe24_variants?select=sku,color,product_no,variant_code,selling,calculator_products!inner(calculator)` +
        `&calculator_products.calculator=eq.${encodeURIComponent(calculator)}`,
      { headers: { apikey: key } },
    );
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const rows: { sku: string; color: string; product_no: number; variant_code: string; selling: boolean }[] = await res.json();
    const map: Cafe24Map = {};
    for (const r of rows) {
      (map[r.sku] ??= {})[r.color] = { productNo: r.product_no, variantCode: r.variant_code, selling: r.selling };
    }
    return map;
  } catch (e) {
    console.error(`[products] ${calculator} 카페24 옵션 조회 실패 (구매하기 버튼 숨김)`, e);
    return {};
  }
}

/** 구매 확인창에서 고르는 추가 품목 (예: 양방향 연결잭) */
export type Addon = { sku: string; name: string; unitPrice: number };

/** DB 단가가 있는(0원 초과) 추가 품목만 */
export function addonsFrom(prices: PriceMap, defs: { sku: string; name: string }[]): Addon[] {
  return defs.filter((d) => (prices[d.sku] ?? 0) > 0).map((d) => ({ ...d, unitPrice: prices[d.sku] }));
}

const pick = (prices: PriceMap, sku: string, fallback: number) => prices[sku] ?? fallback;

export function applyTubePrices(product: TubeProduct, prices: PriceMap): TubeProduct {
  return {
    ...product,
    sizes: product.sizes.map((s) => ({
      ...s,
      price: pick(prices, `${product.skuPrefix}-${s.label}`, s.price),
    })),
  };
}

export function applyBlockBarPrices(product: BlockBarProduct, prices: PriceMap): BlockBarProduct {
  const p = product.skuPrefix;
  const acc = product.accessories;
  return {
    ...product,
    prices: Object.fromEntries(
      product.sizes.map((s) => [s, pick(prices, `${p}-${s}`, product.prices[s])]),
    ),
    midPrice: pick(prices, `${p}-mid-1000`, product.midPrice),
    smps: product.smps.map((o) => ({
      ...o,
      price: pick(prices, `${product.smpsSkuPrefix}-${o.watt}`, o.price),
    })),
    accessories: {
      ...acc,
      screwClip: pick(prices, `${p}-clip-screw`, acc.screwClip),
      tapeClip: pick(prices, `${p}-clip-tape`, acc.tapeClip),
      powerLine: pick(prices, `${p}-powerline-2m`, acc.powerLine),
      cover: pick(prices, `${p}-cover-1m`, acc.cover),
      cornerAngle: pick(prices, `${p}-corner-1200`, acc.cornerAngle),
      cornerClip: pick(prices, `${p}-corner-clip`, acc.cornerClip),
    },
  };
}

export function applyMlinePrices(prices: PriceMap): MlinePrices {
  const d = DEFAULT_PRICES;
  const specs = ["40", "60"] as const;
  const bySpec = <T,>(f: (spec: (typeof specs)[number]) => T) =>
    Object.fromEntries(specs.map((spec) => [spec, f(spec)])) as Record<(typeof specs)[number], T>;
  const mapValues = <K extends number>(obj: Record<K, number>, sku: (k: K) => string) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, pick(prices, sku(Number(k) as K), v as number)]),
    ) as Record<K, number>;

  return {
    line: bySpec((spec) => mapValues(d.line[spec], (mm) => `mline-${spec}-line-${mm}`)),
    cover: bySpec((spec) => mapValues(d.cover[spec], (m) => `mline-${spec}-cover-${m}m`)),
    lCorner: bySpec((spec) => pick(prices, `mline-${spec}-corner`, d.lCorner[spec])),
    lCornerCover: bySpec((spec) => pick(prices, `mline-${spec}-corner-cover`, d.lCornerCover[spec])),
    bracket: pick(prices, "mline-bracket", d.bracket),
    sideCap: bySpec((spec) => pick(prices, `mline-${spec}-sidecap`, d.sideCap[spec])),
    wire1: pick(prices, "mline-wire-1", d.wire1),
    wire10: pick(prices, "mline-wire-10", d.wire10),
    smps: mapValues(d.smps, (w) => `mline-smps-${w}`),
  };
}

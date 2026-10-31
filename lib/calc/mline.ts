/**
 * 매립 라인조명 자동계산기 로직.
 * 원본: oox/root/mline/app.js (Phase 3에서 단가 데이터를 Supabase로 이전 예정)
 * UI와 분리된 순수 함수만 둔다. 원본의 계산 순서와 반올림 방식을 그대로 따른다.
 */
import type { CartLine } from "./types";

export type ConnectionType = "serial" | "parallel" | "square";
export type Spec = "40" | "60";
export type WireType = "wire1" | "wire10" | "mixed";

/** 사용 규격(mm, 내림차순) */
export const DENOMS = [1000, 500, 400, 300, 200, 100] as const;
export type Denom = (typeof DENOMS)[number];
export type LineCounts = Record<Denom, number>;

// ===== 가격표 =====
export const PRICES: Record<Spec, { line: Record<Denom, number>; cover: Record<CoverSize, number> }> = {
  40: {
    line: { 100: 4400, 200: 5900, 300: 7200, 400: 8300, 500: 9600, 1000: 14000 },
    cover: { 5: 27500, 10: 55000, 15: 74500, 20: 80000 },
  },
  60: {
    line: { 100: 4800, 200: 7200, 300: 8700, 400: 11000, 500: 13200, 1000: 17200 },
    cover: { 5: 32500, 10: 65000, 15: 92500, 20: 100000 },
  },
};
export type CoverSize = 5 | 10 | 15 | 20;

// 공통 부속품
export const BRACKET_SET_PRICE = 2000; // 라인조명 1개당 1세트
export const SIDE_CAP_SET_PRICE = 1000; // 일자 견적은 무조건 1세트

// 전원선
export const WIRE_PRICES = {
  wire1: 2000, // 전원선 1구(2m)
  wire10: 30000, // 전원선 10구(10.5m)
};

// SMPS (70% 규칙)
export type SmpsCap = 60 | 100 | 200 | 300;
export const SMPS_PRICES: Record<SmpsCap, number> = { 60: 12800, 100: 24000, 200: 34000, 300: 38000 };
export const SMPS_OPTIONS: SmpsCap[] = [60, 100, 200, 300]; // 정격(W)
export const LOAD_LIMIT = 0.7; // 70%

// 라인조명 소비전력 (W)
export const WATTS: Record<Spec, Record<Denom, number>> = {
  40: { 100: 1.5, 200: 3, 300: 4.5, 400: 6, 500: 7.5, 1000: 15 },
  60: { 100: 3, 200: 6, 300: 9, 400: 12, 500: 15, 1000: 30 },
};

// 기역자형 가격/치수
export const L_CORNER_LINE_PRICE = 10000; // 규격 40/60 동일
export const L_CORNER_COVER_PRICE: Record<Spec, number> = { 40: 12000, 60: 13000 };
export const L_CORNER_SIZE: Record<Spec, number> = { 40: 45, 60: 65 }; // mm
export const L_CORNER_WATT = 1.5; // 기역자형 1개당 소비전력 (W)

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  serial: "일자연결",
  parallel: "ㄱ자연결",
  square: "ㅁ자연결",
};

// ===== 유틸 =====
export const fmt = (n: number) => Number(n).toLocaleString("ko-KR");
export const isValidHundreds = (value: number) =>
  Number.isInteger(value) && value > 0 && value % 100 === 0;

const emptyCounts = (): LineCounts => ({ 100: 0, 200: 0, 300: 0, 400: 0, 500: 0, 1000: 0 });

/** 최소 개수 분해 (DP - 코인체인지) */
export function decomposeLengthMM(total: number): LineCounts | null {
  const dp: number[] = Array(total + 1).fill(Number.POSITIVE_INFINITY);
  const prev: (Denom | null)[] = Array(total + 1).fill(null);
  dp[0] = 0;

  for (let i = 100; i <= total; i += 100) {
    for (const d of DENOMS) {
      if (i - d >= 0 && dp[i - d] + 1 < dp[i]) {
        dp[i] = dp[i - d] + 1;
        prev[i] = d;
      }
    }
  }
  if (!Number.isFinite(dp[total])) return null;

  const counts = emptyCounts();
  let cur = total;
  while (cur > 0) {
    const d = prev[cur];
    if (d == null) break;
    counts[d] += 1;
    cur -= d;
  }
  return counts;
}

/** 사용한 라인조명 목록 ("1000mm × 2개" ...) */
export function countsToLines(counts: LineCounts): string[] {
  const arr: string[] = [];
  DENOMS.forEach((mm) => {
    const c = counts[mm] || 0;
    if (c > 0) arr.push(`${mm}mm × ${fmt(c)}개`);
  });
  return arr;
}

export function countPieces(counts: LineCounts): number {
  return DENOMS.reduce((s, mm) => s + (counts[mm] || 0), 0);
}

export function sumWatts(spec: Spec, counts: LineCounts): number {
  return DENOMS.reduce((w, mm) => w + (counts[mm] || 0) * (WATTS[spec][mm] || 0), 0);
}

/** 원본은 Object.keys 순서(오름차순)로 합산 */
export function linesPrice(spec: Spec, counts: LineCounts): number {
  const table = PRICES[spec].line;
  let sum = 0;
  ([100, 200, 300, 400, 500, 1000] as const).forEach((mm) => {
    const c = counts[mm] || 0;
    if (c > 0) sum += c * (table[mm] || 0);
  });
  return sum;
}

// ===== 커버 선택 =====
export type CoverPack = { size: CoverSize; count: number; price: number };
export type CoverPick = { packs: CoverPack[]; subtotal: number };

export function pickCoverPacks(neededMeters: number, spec: Spec): CoverPick {
  const coverPrices = PRICES[spec].cover;
  const packs: CoverPack[] = [];
  if (neededMeters <= 0) return { packs, subtotal: 0 };

  const full20 = Math.floor(neededMeters / 20);
  const rem = neededMeters % 20;

  if (full20 > 0) packs.push({ size: 20, count: full20, price: coverPrices[20] });

  if (rem > 0) {
    let remainderPack: CoverSize = 5;
    if (rem <= 5) remainderPack = 5;
    else if (rem <= 10) remainderPack = 10;
    else if (rem <= 15) remainderPack = 15;
    else remainderPack = 20;
    packs.push({ size: remainderPack, count: 1, price: coverPrices[remainderPack] });
  }

  const subtotal = packs.reduce((s, p) => s + p.count * p.price, 0);
  return { packs, subtotal };
}

// ===== SMPS =====
export type SmpsItem = { cap: SmpsCap; count: number; price: number };
export type SmpsCombo = { items: SmpsItem[]; subtotal: number; eff: number; cap: number };

/**
 * SMPS 조합 추천 (최소 비용, 70% 규칙).
 * 원본에 정의만 되어 있고 실제 계산(renderOutput)에서는 쓰이지 않는다. 참고용으로 보존.
 */
export function recommendSmpsCombo(totalW: number): SmpsCombo {
  if (totalW <= 0) return { items: [], subtotal: 0, eff: 0, cap: 0 };

  const units = SMPS_OPTIONS.map((cap) => ({
    cap,
    eff: Math.round(cap * LOAD_LIMIT),
    price: SMPS_PRICES[cap],
  }));

  const target = Math.ceil(totalW);
  const maxEff = Math.max(...units.map((u) => u.eff));
  const DP_SIZE = target + maxEff;

  const dp: number[] = Array(DP_SIZE + 1).fill(Infinity);
  const choice: (SmpsCap | null)[] = Array(DP_SIZE + 1).fill(null);
  dp[0] = 0;

  for (let w = 0; w <= DP_SIZE; w++) {
    if (!Number.isFinite(dp[w])) continue;
    for (const u of units) {
      const nw = Math.min(DP_SIZE, w + u.eff);
      const ncost = dp[w] + u.price;
      if (ncost < dp[nw]) {
        dp[nw] = ncost;
        choice[nw] = u.cap;
      }
    }
  }

  let bestW = -1,
    bestCost = Infinity;
  for (let w = target; w <= DP_SIZE; w++) {
    if (dp[w] < bestCost) {
      bestCost = dp[w];
      bestW = w;
    }
  }
  if (bestW === -1) return { items: [], subtotal: 0, eff: 0, cap: 0 };

  const counts: Partial<Record<SmpsCap, number>> = {};
  let cur = bestW;
  while (cur > 0 && choice[cur] != null) {
    const cap = choice[cur] as SmpsCap;
    counts[cap] = (counts[cap] || 0) + 1;
    const eff = Math.round(cap * LOAD_LIMIT);
    cur -= eff;
    if (cur < 0) break;
    while (cur > 0 && choice[cur] == null) cur--;
  }

  const items = SMPS_OPTIONS.filter((c) => counts[c])
    .map((cap) => ({ cap, count: counts[cap] as number, price: SMPS_PRICES[cap] }))
    .sort((a, b) => b.cap - a.cap);

  const subtotal = items.reduce((s, it) => s + it.count * it.price, 0);
  const totalEff = items.reduce((s, it) => s + Math.round(it.cap * LOAD_LIMIT) * it.count, 0);
  const totalCap = items.reduce((s, it) => s + it.cap * it.count, 0);

  return { items, subtotal, eff: totalEff, cap: totalCap };
}

export function buildComboFromItems(items: { cap: SmpsCap; count: number }[]): SmpsCombo {
  const subtotal = items.reduce((s, it) => s + SMPS_PRICES[it.cap] * it.count, 0);
  const eff = items.reduce((s, it) => s + Math.round(it.cap * LOAD_LIMIT) * it.count, 0);
  const cap = items.reduce((s, it) => s + it.cap * it.count, 0);
  const normItems = items
    .map((it) => ({ cap: it.cap, count: it.count, price: SMPS_PRICES[it.cap] }))
    .sort((a, b) => b.cap - a.cap);
  return { items: normItems, subtotal, eff, cap };
}

/** 원본 renderOutput()의 SMPS 선택 규칙 (단일 → 200W×2 → 300W×n) */
export function selectSmps(totalWatt: number): SmpsCombo {
  const eff60 = Math.round(60 * LOAD_LIMIT);
  const eff100 = Math.round(100 * LOAD_LIMIT);
  const eff200 = Math.round(200 * LOAD_LIMIT);
  const eff300 = Math.round(300 * LOAD_LIMIT);

  if (totalWatt <= eff300) {
    let singleCap: SmpsCap = 300;
    if (totalWatt <= eff60) singleCap = 60;
    else if (totalWatt <= eff100) singleCap = 100;
    else if (totalWatt <= eff200) singleCap = 200;
    else singleCap = 300;
    return buildComboFromItems([{ cap: singleCap, count: 1 }]);
  } else if (totalWatt <= eff200 * 2) {
    return buildComboFromItems([{ cap: 200, count: 2 }]);
  }
  const n300 = Math.max(2, Math.ceil(totalWatt / eff300));
  return buildComboFromItems([{ cap: 300, count: n300 }]);
}

/** SMPS 카드 표시용 데이터 (원본 renderSmpsCombo) */
export type SmpsView = {
  totalWattText: string;
  /** 품목이 없을 때 "라인조명이 없어 전원 공급 불필요" */
  empty: boolean;
  groups: { title: string; uses: string[] }[];
  overallText: string;
};

export function smpsView(totalW: number, combo: SmpsCombo): SmpsView {
  const totalWattText = `총 소비전력: ${totalW.toFixed(0)} W`;
  if (!combo.items.length) return { totalWattText, empty: true, groups: [], overallText: "" };

  let remaining = totalW;
  const groups = combo.items.map((it) => {
    const uses: string[] = [];
    for (let i = 0; i < it.count; i++) {
      if (remaining <= 0) {
        uses.push(`[0W사용] (부하 0.0% / 70% 기준 충족)`);
        continue;
      }
      const cap = it.cap;
      const limit = cap * LOAD_LIMIT;
      const alloc = Math.max(0, Math.min(remaining, limit));
      const pct = (alloc / cap) * 100;
      uses.push(`[${alloc.toFixed(0)}W사용] (부하 ${pct.toFixed(1)}% / 70% 기준 충족)`);
      remaining -= alloc;
    }
    return { title: `SMPS ${it.cap} W × ${fmt(it.count)}개`, uses };
  });

  const overallPct = combo.cap > 0 ? ((totalW / combo.cap) * 100).toFixed(1) : "0.0";
  return { totalWattText, empty: false, groups, overallText: `(부하 ${overallPct}% / 70% 기준 충족)` };
}

// ===== 전원선 =====
export type WirePick = {
  label: string;
  countStr: string;
  cost: number;
  /** 장바구니용 실제 수량 */
  wire1: number;
  wire10: number;
};

/** 전원선 혼합형 계산 */
export function calcWireMixed(pieces: number): WirePick {
  if (pieces <= 0) return { label: "전원선 혼합형", countStr: "없음", cost: 0, wire1: 0, wire10: 0 };
  if (pieces < 5) {
    return {
      label: "전원선 1구(2m)",
      countStr: `${fmt(pieces)}개`,
      cost: pieces * WIRE_PRICES.wire1,
      wire1: pieces,
      wire10: 0,
    };
  }
  if (pieces <= 10) {
    return { label: "전원선 10구(10.5m)", countStr: "1개", cost: WIRE_PRICES.wire10, wire1: 0, wire10: 1 };
  }
  if (pieces <= 14) {
    const cost = WIRE_PRICES.wire10 + (pieces - 10) * WIRE_PRICES.wire1;
    return {
      label: "전원선 혼합형(10구+낱개)",
      countStr: `10구 1개 + 1구 ${fmt(pieces - 10)}개`,
      cost,
      wire1: pieces - 10,
      wire10: 1,
    };
  }
  const full10 = Math.floor(pieces / 10);
  const rem = pieces % 10;
  const cost = full10 * WIRE_PRICES.wire10 + (rem > 0 ? rem * WIRE_PRICES.wire1 : 0);
  const label = rem > 0 ? "전원선 혼합형(10구+낱개)" : "전원선 10구(10.5m)";
  const countStr = rem > 0 ? `10구 ${fmt(full10)}개 + 1구 ${fmt(rem)}개` : `10구 ${fmt(full10)}개`;
  return { label, countStr, cost, wire1: rem, wire10: full10 };
}

export function pickWire(wireType: WireType, pieces: number): WirePick {
  if (wireType === "wire1") {
    return {
      label: "전원선 1구(2m)",
      countStr: `${fmt(pieces)}개`,
      cost: pieces * WIRE_PRICES.wire1,
      wire1: pieces,
      wire10: 0,
    };
  }
  if (wireType === "wire10") {
    const packs = Math.ceil(pieces / 10);
    return {
      label: "전원선 10구(10.5m)",
      countStr: `${fmt(packs)}개`,
      cost: packs * WIRE_PRICES.wire10,
      wire1: 0,
      wire10: packs,
    };
  }
  return calcWireMixed(pieces);
}

// ===== 계산 =====
export type MlineInputs = {
  connectionType: ConnectionType | null;
  spec: Spec | null;
  wireType: WireType | null;
  /** 입력칸의 원본 문자열 (input.value). serial은 length, ㄱ/ㅁ자는 a, b */
  length?: string;
  a?: string;
  b?: string;
};

/** 시공 안내 박스 */
export type MlineNotice =
  | { kind: "serial"; L: number }
  | { kind: "square"; corner: number; A: number; B: number; aTot: number; bTot: number }
  | { kind: "parallel"; add: number; corner: number; A: number; B: number; aTot: number; bTot: number };

export type MlineResult = {
  connectionType: ConnectionType;
  spec: Spec;
  wireType: WireType;
  /** 일반 라인조명 수량 (기역자형 제외) */
  counts: LineCounts;
  /** 기역자형 개수 (일자 0, ㄱ자 1, ㅁ자 4) */
  lCornerCount: number;
  lCornerCoverPrice: number;
  linesArr: string[];
  linesSubtotal: number;
  pieces: number;
  bracketSets: number;
  bracketSubtotal: number;
  sideCapSets: number;
  sideCapSubtotal: number;
  coverPick: CoverPick;
  wire: WirePick;
  partsArr: string[];
  partsSubtotal: number;
  totalWatt: number;
  smpsCombo: SmpsCombo;
  smps: SmpsView;
  /** SMPS 2대 이상이면 "같은 와트수로 세팅" 안내 */
  equalize: boolean;
  smpsSubtotal: number;
  grandTotal: number;
  notice: MlineNotice | null;
};

export type MlineCalcResult =
  | { ok: true; result: MlineResult }
  | { ok: false; message: string; focus?: "length" | "a" | "b" };

const parseLen = (v: string | undefined) => (v ? parseInt(v, 10) : NaN);

/** 원본 doCalculate() + renderOutput()의 계산 부분 */
export function calculate(input: MlineInputs): MlineCalcResult {
  const { connectionType, spec, wireType } = input;
  if (!connectionType) return { ok: false, message: "먼저 연결 방식을 선택해주세요." };
  if (!spec) return { ok: false, message: "먼저 규격(40/60)을 선택해주세요." };
  if (!wireType) return { ok: false, message: "전원선 종류를 선택해주세요." };

  let counts: LineCounts;
  let pieces: number;
  let linesSubtotal: number;
  let sideCapSets = 0;
  let lCornerCount = 0;
  let neededMeters: number;
  let notice: MlineNotice | null;

  if (connectionType === "serial") {
    const L = parseLen(input.length);
    if (!isValidHundreds(L)) {
      return { ok: false, message: "길이는 100 단위로 입력해주세요. (예: 100, 200, 300 …)", focus: "length" };
    }
    const c = decomposeLengthMM(L);
    if (!c) return { ok: false, message: "분해에 실패했습니다. 다른 길이로 시도해주세요." };
    counts = c;
    linesSubtotal = linesPrice(spec, counts);
    pieces = countPieces(counts);
    sideCapSets = 1;
    neededMeters = Math.ceil(L / 1000);
    notice = { kind: "serial", L };
  } else {
    const A = parseLen(input.a);
    const B = parseLen(input.b);
    if (!isValidHundreds(A)) return { ok: false, message: "A변 길이는 100 단위로 입력해주세요.", focus: "a" };
    if (!isValidHundreds(B)) return { ok: false, message: "B변 길이는 100 단위로 입력해주세요.", focus: "b" };
    const countsA = decomposeLengthMM(A);
    const countsB = decomposeLengthMM(B);
    if (!countsA || !countsB) return { ok: false, message: "분해에 실패했습니다. 다른 길이로 시도해주세요." };

    const mult = connectionType === "square" ? 2 : 1;
    counts = emptyCounts();
    ([100, 200, 300, 400, 500, 1000] as const).forEach((mm) => {
      counts[mm] = (countsA[mm] || 0) * mult + (countsB[mm] || 0) * mult;
    });

    const cornerAdd = L_CORNER_SIZE[spec] || 0; // 규격별 기역자 길이 (40:45mm, 60:65mm)
    if (connectionType === "parallel") {
      // === ㄱ자연결 ===
      lCornerCount = 1;
      linesSubtotal = linesPrice(spec, counts) + L_CORNER_LINE_PRICE;
      pieces = countPieces(countsA) + countPieces(countsB) + 1;
      sideCapSets = 1;
      const totalCoverLen = A + B + 2 * cornerAdd;
      const straightCoverNeed = Math.max(0, totalCoverLen - 2000);
      neededMeters = Math.ceil(straightCoverNeed / 1000);
      const add = spec === "40" ? 50 : 70;
      const corner = spec === "40" ? 45 : 65;
      notice = { kind: "parallel", add, corner, A, B, aTot: A + add, bTot: B + add };
    } else {
      // === ㅁ자연결: A변 2개 + B변 2개 + 기역자형 4개, 사이드캡 없음 ===
      lCornerCount = 4;
      linesSubtotal = linesPrice(spec, counts) + L_CORNER_LINE_PRICE * 4;
      pieces = (countPieces(countsA) + countPieces(countsB)) * 2 + 4;
      sideCapSets = 0;
      // 4개 모서리 * 2m = 8m 기본 제공, 나머지만 일반 커버
      const totalCoverLen = (A + B) * 2 + 4 * 2 * cornerAdd;
      const straightCoverNeed = Math.max(0, totalCoverLen - 8000);
      neededMeters = Math.ceil(straightCoverNeed / 1000);
      const corner = spec === "40" ? 45 : 65;
      notice = { kind: "square", corner, A, B, aTot: A + 2 * corner, bTot: B + 2 * corner };
    }
  }

  const bracketSets = pieces;
  const bracketSubtotal = bracketSets * BRACKET_SET_PRICE;
  const sideCapSubtotal = sideCapSets * SIDE_CAP_SET_PRICE;
  const lCornerCoverPrice = lCornerCount > 0 ? L_CORNER_COVER_PRICE[spec] || 0 : 0;
  const coverPick = pickCoverPacks(neededMeters, spec);
  const wire = pickWire(wireType, pieces);

  const linesArr = countsToLines(counts);
  if (lCornerCount > 0) linesArr.unshift(`기역자형 × ${lCornerCount}개`);

  // 총 소비전력 (기역자형 포함)
  const totalWatt = sumWatts(spec, counts) + lCornerCount * L_CORNER_WATT;
  const smpsCombo = selectSmps(totalWatt);
  const totalUnits = smpsCombo.items.reduce((s, it) => s + it.count, 0);
  const smpsSubtotal = smpsCombo.subtotal;

  const lCornerCoverUsed = lCornerCount > 0;
  const partsSubtotal =
    bracketSubtotal +
    sideCapSubtotal +
    (lCornerCoverUsed ? lCornerCoverPrice * lCornerCount : 0) +
    wire.cost +
    coverPick.subtotal;
  const grandTotal = linesSubtotal + partsSubtotal + smpsSubtotal;

  const partsArr: string[] = [];
  if (bracketSets > 0) partsArr.push(`고정브라켓(스프링)[4개입] × ${fmt(bracketSets)}세트`);
  if (sideCapSets > 0) partsArr.push(`사이드캡[2개] × ${fmt(sideCapSets)}세트`);
  if (lCornerCoverUsed && lCornerCount > 0)
    partsArr.push(`기역자형 커버 1조(좌, 우 1m) × ${lCornerCount}개`);
  coverPick.packs.forEach((p) => partsArr.push(`커버 ${p.size}M × ${fmt(p.count)}개`));
  if (wire.label && wire.countStr) partsArr.push(`${wire.label} × ${wire.countStr}`);

  return {
    ok: true,
    result: {
      connectionType,
      spec,
      wireType,
      counts,
      lCornerCount,
      lCornerCoverPrice,
      linesArr,
      linesSubtotal,
      pieces,
      bracketSets,
      bracketSubtotal,
      sideCapSets,
      sideCapSubtotal,
      coverPick,
      wire,
      partsArr,
      partsSubtotal,
      totalWatt,
      smpsCombo,
      smps: smpsView(totalWatt, smpsCombo),
      equalize: totalUnits >= 2,
      smpsSubtotal,
      grandTotal,
      notice,
    },
  };
}

/** 최종 결과 → 장바구니 품목 (합계는 grandTotal과 같다) */
export function toCartLines(r: MlineResult): CartLine[] {
  const { spec } = r;
  const lines: CartLine[] = [];
  const push = (sku: string, name: string, quantity: number, unitPrice: number) => {
    if (quantity <= 0) return;
    // 커버는 "20M × n" + 나머지 "20M × 1"(16~19m)처럼 같은 품목이 두 줄로 나올 수 있어 합친다
    const same = lines.find((l) => l.sku === sku);
    if (same) same.quantity += quantity;
    else lines.push({ sku, name, quantity, unitPrice });
  };

  push(`mline-${spec}-corner`, `매립라인조명 ${spec} 기역자형`, r.lCornerCount, L_CORNER_LINE_PRICE);
  DENOMS.forEach((mm) =>
    push(`mline-${spec}-line-${mm}`, `매립라인조명 ${spec} ${mm}mm`, r.counts[mm], PRICES[spec].line[mm]),
  );
  push("mline-bracket", "고정브라켓(스프링)[4개입]", r.bracketSets, BRACKET_SET_PRICE);
  push("mline-sidecap", "사이드캡[2개]", r.sideCapSets, SIDE_CAP_SET_PRICE);
  push(
    `mline-${spec}-corner-cover`,
    `매립라인조명 ${spec} 기역자형 커버 1조(좌, 우 1m)`,
    r.lCornerCount,
    r.lCornerCoverPrice,
  );
  r.coverPick.packs.forEach((p) =>
    push(`mline-${spec}-cover-${p.size}m`, `매립라인조명 ${spec} 커버 ${p.size}M`, p.count, p.price),
  );
  push("mline-wire-10", "전원선 10구(10.5m)", r.wire.wire10, WIRE_PRICES.wire10);
  push("mline-wire-1", "전원선 1구(2m)", r.wire.wire1, WIRE_PRICES.wire1);
  r.smpsCombo.items.forEach((it) => push(`mline-smps-${it.cap}`, `SMPS ${it.cap}W`, it.count, it.price));
  return lines;
}

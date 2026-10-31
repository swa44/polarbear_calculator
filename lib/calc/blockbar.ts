/**
 * 12V / 24V 블럭바 계산기 공통 로직.
 * 원본: oox/root/12vbb/app.js, oox/root/24vbb/app.js
 * 두 원본은 규격·단가·남는공간 정책·경고 기준 등만 다르고 흐름은 같으므로
 * 차이는 BlockBarProduct 데이터(lib/calc/bb12.ts, bb24.ts)로 분리한다.
 * UI와 분리된 순수 함수만 둔다. (값 import 없이 type import만 사용)
 */
import type { CartLine } from "./types";

export type Connection = "serial" | "parallel";

export type BlockBarOptions = {
  /** 중간연결형(24V: 중간케이블형) */
  mid: boolean;
  /** 아크릴 커버 */
  cover: boolean;
  /** 코너각대 */
  corner: boolean;
};

export type BlockBarProduct = {
  /** sku 접두어 (예: "bb12") */
  skuPrefix: string;
  /** SMPS sku 접두어 (예: "smps12") */
  smpsSkuPrefix: string;
  /** 표시용 품목명 접두어 (예: "12V 블럭바") */
  name: string;
  /** 표시용 SMPS 품목명 접두어 (예: "12V SMPS") */
  smpsName: string;
  /** 규격 (mm, 큰 것부터. 원본 sizes 배열 순서) */
  sizes: number[];
  /** 규격별 단가 */
  prices: Record<number, number>;
  /** 규격별 소비전력 (W) */
  watts: Record<number, number>;
  /** 중간연결형 1000mm 단가 */
  midPrice: number;
  /** 중간연결형 표기 ("중간연결형" | "중간케이블형") */
  midLabel: string;
  /** DP 조합 단위 (mm) */
  unit: number;
  /**
   * 남는공간 정책
   * - "fixed50to99": 12V. 항상 50~99mm (50mm 미만이면 전부 남는공간)
   * - "prefer40to99": 24V. 40~99mm 우선, 불가 시 100~139mm (음수면 0)
   */
  leftoverPolicy: "fixed50to99" | "prefer40to99";
  /** SMPS 용량(W) 오름차순 + 단가 */
  smps: { watt: number; price: number }[];
  /** SMPS 부하 한도 (0.7 = 70%) */
  loadLimit: number;
  /** 부속품 단가 */
  accessories: {
    /** 고정클립(피스형) /개 */
    screwClip: number;
    /** 고정클립(양면테이프형) /개 */
    tapeClip: number;
    /** 전원 연결선 (2M) */
    powerLine: number;
    /** 아크릴 커버 /1M */
    cover: number;
    /** 코너각대 /1.2M */
    cornerAngle: number;
    /** 코너각대 고정클립 /개 */
    cornerClip: number;
    /** 각대 1개당 클립 수 */
    cornerClipsPerAngle: number;
  };
  /** 이 길이(mm) 초과 시 경고 모달 */
  warnLength: number;
  /** 병렬에서도 A/B 중 하나가 warnLength 초과면 모달 (12V: true, 24V: false) */
  warnParallel: boolean;
  /** 클립 수량이 0개여도 부속품 카드에 줄을 표시 (24V 원본 동작) */
  alwaysShowClipLines: boolean;
  /** 하단 요약의 클립 표기 (12V 원본은 오타 "고정클림" 그대로) */
  summaryClipLabel: string;
};

export type Counts = Record<number, number>;

export type BlockBarItem = {
  /** 규격 (mm) */
  size: number;
  /** 중간연결형 여부 */
  mid: boolean;
  count: number;
  unitPrice: number;
  /** count × unitPrice */
  price: number;
};

export type SideResult = {
  /** 사용(설치) 길이 */
  used: number;
  /** 남는공간 */
  leftover: number;
  counts: Counts;
  /** 원본 라인 순서 (1000mm(중간연결형 → 일반), 500 … 50) */
  items: BlockBarItem[];
  subtotal: number;
};

export type BlockBarCalc = {
  ok: true;
  connection: Connection;
  options: BlockBarOptions;
  /** 직렬: [전체], 병렬: [A변, B변] */
  sides: SideResult[];
  /** 경고 모달 표시 여부 */
  showModal: boolean;
  totalsCounts: Counts;
  totalPieces: number;
  blockbarSubtotal: number;
  screwClips: number;
  tapeClips: number;
  powerLineCount: number;
  powerLineSubtotal: number;
  coverCount: number;
  coverSubtotal: number;
  cornerCount: number;
  cornerSubtotal: number;
  cornerClipCount: number;
  cornerClipSubtotal: number;
  accSubtotal: number;
  totalWatt: number;
  /** 권장 SMPS 용량 (W). 70% 기준 충족 불가면 null */
  recommended: number | null;
  smpsSubtotal: number;
  grandTotal: number;
};

export type BlockBarResult = BlockBarCalc | { ok: false; message: string };

/** 원본 getNumberValue(): parseInt(value, 10) */
export function parseLength(value: string): number {
  return parseInt(value, 10);
}

/** 원본 fmt(): toLocaleString('ko-KR') */
export function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

/** 사용 길이 / 남는공간 결정 (원본 pickUsedLen12V / pickUsedLenRounded) */
export function pickUsedLen(
  product: BlockBarProduct,
  totalLength: number,
): { used: number; leftover: number } {
  if (product.leftoverPolicy === "fixed50to99") {
    const unit = product.unit;
    if (totalLength < 50) return { used: 0, leftover: totalLength };
    const remainder = totalLength % unit; // 0~49
    const leftover = 50 + remainder; // 50~99
    return { used: totalLength - leftover, leftover };
  }

  const rem100 = totalLength % 100;
  let used: number;
  if (rem100 >= 40 && rem100 <= 99) {
    used = totalLength - rem100;
  } else if (rem100 < 40) {
    used = totalLength - (rem100 + 100);
  } else {
    used = Math.floor(totalLength / 100) * 100;
  }
  if (used < 0) used = 0;
  return { used, leftover: totalLength - used };
}

/** DP 최소 개수 조합 (원본 dpDecompose, 동률 처리 순서까지 동일) */
export function dpDecompose(product: BlockBarProduct, usedLen: number): Counts {
  const { sizes, unit } = product;
  const usedUnits = Math.floor(usedLen / unit);
  const denomsUnits = sizes.map((s) => s / unit);
  const dp: number[] = Array(usedUnits + 1).fill(Infinity);
  const prev: number[] = Array(usedUnits + 1).fill(-1);
  const via: number[] = Array(usedUnits + 1).fill(-1);
  dp[0] = 0;

  for (let i = 1; i <= usedUnits; i++) {
    for (let j = 0; j < denomsUnits.length; j++) {
      const c = denomsUnits[j];
      if (i >= c && dp[i - c] + 1 < dp[i]) {
        dp[i] = dp[i - c] + 1;
        prev[i] = i - c;
        via[i] = j;
      }
    }
  }

  const counts: Counts = {};
  sizes.forEach((s) => (counts[s] = 0));
  if (usedUnits > 0 && dp[usedUnits] < Infinity) {
    let u = usedUnits;
    while (u > 0) {
      const j = via[u];
      if (j === -1) break;
      counts[sizes[j]] += 1;
      u = prev[u];
    }
  }
  return counts;
}

/** counts → 라인 & 소계 (원본 blockbarLinesAndSubtotal. 중간연결형은 1000mm 1개에만 적용) */
export function blockbarItems(
  product: BlockBarProduct,
  counts: Counts,
  isMid: boolean,
): { items: BlockBarItem[]; subtotal: number } {
  const items: BlockBarItem[] = [];
  const push = (size: number, mid: boolean, count: number, unitPrice: number) =>
    items.push({ size, mid, count, unitPrice, price: count * unitPrice });

  const c1000 = counts[1000] || 0;
  if (c1000 > 0 && isMid) {
    push(1000, true, 1, product.midPrice);
    if (c1000 - 1 > 0) push(1000, false, c1000 - 1, product.prices[1000]);
  } else if (c1000 > 0) {
    push(1000, false, c1000, product.prices[1000]);
  }

  product.sizes
    .filter((s) => s !== 1000)
    .forEach((s) => {
      if ((counts[s] || 0) > 0) push(s, false, counts[s], product.prices[s]);
    });

  const subtotal = items.reduce((sum, it) => sum + it.price, 0);
  return { items, subtotal };
}

function sumCounts(product: BlockBarProduct, list: Counts[]): Counts {
  const out: Counts = {};
  product.sizes.forEach((s) => (out[s] = list.reduce((sum, c) => sum + (c[s] || 0), 0)));
  return out;
}

function sumWatt(product: BlockBarProduct, counts: Counts): number {
  return product.sizes.reduce((w, s) => w + (counts[s] || 0) * (product.watts[s] || 0), 0);
}

/** 원본 calculate()의 계산 부분 */
export function calculate(
  product: BlockBarProduct,
  connection: Connection,
  lengths: number[],
  options: BlockBarOptions,
): BlockBarResult {
  const { mid: isMid, cover: useCover, corner: useCorner } = options;
  const acc = product.accessories;

  // ===== 입력값 검증 / 경고 모달
  let showModal = false;
  if (connection === "serial") {
    const total = lengths[0];
    if (isNaN(total) || total <= 0) {
      return { ok: false, message: "길이를 올바르게 입력해주세요." };
    }
    if (total > product.warnLength) showModal = true;
  } else {
    const [lenA, lenB] = lengths;
    if ([lenA, lenB].some((v) => isNaN(v) || v <= 0)) {
      return { ok: false, message: "A변과 B변 길이를 모두 올바르게 입력해주세요." };
    }
    if (product.warnParallel && (lenA > product.warnLength || lenB > product.warnLength)) {
      showModal = true;
    }
  }

  // ===== 사용 길이 / 조합 / 소계
  const inputLens = connection === "serial" ? [lengths[0]] : [lengths[0], lengths[1]];
  const sides: SideResult[] = inputLens.map((len) => {
    const { used, leftover } = pickUsedLen(product, len);
    const counts = dpDecompose(product, used);
    const { items, subtotal } = blockbarItems(product, counts, isMid);
    return { used, leftover, counts, items, subtotal };
  });

  const blockbarSubtotal = sides.reduce((sum, s) => sum + s.subtotal, 0);
  const totalsCounts =
    connection === "serial" ? sides[0].counts : sumCounts(product, sides.map((s) => s.counts));
  const totalPieces = Object.values(totalsCounts).reduce((a, b) => a + b, 0);

  // ===== 부속품
  const screwClips = useCorner ? 0 : totalPieces * 2;
  // 병렬이면 -2, 직렬이면 -1 (최소 0)
  const tapeClips = useCorner ? 0 : Math.max(totalPieces - (connection === "parallel" ? 2 : 1), 0);
  let accSubtotal = screwClips * acc.screwClip + tapeClips * acc.tapeClip;

  // 전원 연결선 (중간연결형 미체크 시 자동 포함)
  let powerLineCount = 0;
  let powerLineSubtotal = 0;
  if (!isMid) {
    powerLineCount = connection === "parallel" ? 2 : 1;
    powerLineSubtotal = powerLineCount * acc.powerLine;
    accSubtotal += powerLineSubtotal;
  }

  // 아크릴 커버 (설치 길이 합계 1,000mm 단위 올림)
  const coverBaseLen = sides.reduce((sum, s) => sum + s.used, 0);
  let coverCount = 0;
  let coverSubtotal = 0;
  if (useCover && coverBaseLen > 0) {
    coverCount = Math.ceil(coverBaseLen / 1000);
    coverSubtotal = coverCount * acc.cover;
    accSubtotal += coverSubtotal;
  }

  // 코너각대 (설치 길이 합계 1,200mm 단위 올림) + 전용 클립
  let cornerCount = 0;
  let cornerSubtotal = 0;
  let cornerClipCount = 0;
  let cornerClipSubtotal = 0;
  if (useCorner && coverBaseLen > 0) {
    cornerCount = Math.ceil(coverBaseLen / 1200);
    cornerSubtotal = cornerCount * acc.cornerAngle;
    cornerClipCount = cornerCount * acc.cornerClipsPerAngle;
    cornerClipSubtotal = cornerClipCount * acc.cornerClip;
    accSubtotal += cornerSubtotal + cornerClipSubtotal;
  }

  // ===== 소비전력 & SMPS (부하 70% 이내 최소 용량)
  const totalWatt = sumWatt(product, totalsCounts);
  let recommended: number | null = null;
  for (const opt of product.smps) {
    if (totalWatt <= opt.watt * product.loadLimit) {
      recommended = opt.watt;
      break;
    }
  }
  let smpsSubtotal = 0;
  if (recommended !== null && totalWatt > 0) {
    smpsSubtotal = product.smps.find((o) => o.watt === recommended)?.price || 0;
  }

  const grandTotal = blockbarSubtotal + accSubtotal + smpsSubtotal;

  return {
    ok: true,
    connection,
    options: { ...options },
    sides,
    showModal,
    totalsCounts,
    totalPieces,
    blockbarSubtotal,
    screwClips,
    tapeClips,
    powerLineCount,
    powerLineSubtotal,
    coverCount,
    coverSubtotal,
    cornerCount,
    cornerSubtotal,
    cornerClipCount,
    cornerClipSubtotal,
    accSubtotal,
    totalWatt,
    recommended,
    smpsSubtotal,
    grandTotal,
  };
}

// ===== 표시용 문구 (원본 출력 문자열 그대로) =====

/** "1000mm" / "중간연결형1000mm" */
export function itemLabel(product: BlockBarProduct, item: BlockBarItem): string {
  return item.mid ? `${product.midLabel}${item.size}mm` : `${item.size}mm`;
}

/** 사용한 블럭바 카드의 줄 목록 */
export function sideLines(product: BlockBarProduct, side: SideResult): string[] {
  return side.items.map(
    (it) => `${itemLabel(product, it)} × ${it.count}개 — ₩${fmt(it.price)}`,
  );
}

/** 필요 부속품 카드의 줄 목록 */
export function partsLines(product: BlockBarProduct, r: BlockBarCalc): string[] {
  const acc = product.accessories;
  const lines: string[] = [];
  if (!r.options.corner) {
    const sc = r.screwClips;
    const tc = r.tapeClips;
    if (product.alwaysShowClipLines || sc > 0)
      lines.push(`고정클립(피스형) × ${fmt(sc)}개 — ₩${fmt(sc * acc.screwClip)}`);
    if (product.alwaysShowClipLines || tc > 0)
      lines.push(`고정클립(양면테이프형) × ${fmt(tc)}개 — ₩${fmt(tc * acc.tapeClip)}`);
  }
  if (r.powerLineCount > 0) {
    lines.push(`전원 연결선 (2M) × ${fmt(r.powerLineCount)}개 — ₩${fmt(r.powerLineSubtotal)}`);
  }
  if (r.options.cover && r.coverCount > 0) {
    lines.push(`아크릴 커버 (1M) × ${fmt(r.coverCount)}개 — ₩${fmt(r.coverSubtotal)}`);
  }
  if (r.options.corner && r.cornerCount > 0) {
    lines.push(`코너각대 (1.2M) × ${fmt(r.cornerCount)}개 — ₩${fmt(r.cornerSubtotal)}`);
    lines.push(`코너각대 고정클립 × ${fmt(r.cornerClipCount)}개 — ₩${fmt(r.cornerClipSubtotal)}`);
  }
  return lines;
}

/** 하단 요약: "1000mm × 2개, 500mm × 1개" / "없음" (원본 countsToSummaryText) */
export function countsSummaryText(product: BlockBarProduct, counts: Counts): string {
  const parts = product.sizes
    .filter((s) => (counts[s] || 0) > 0)
    .map((s) => `${s}mm × ${counts[s]}개`);
  return parts.length ? parts.join(", ") : "없음";
}

/** 하단 요약: 부속품 */
export function accSummaryText(product: BlockBarProduct, r: BlockBarCalc): string {
  const parts: string[] = [];
  const clip = product.summaryClipLabel;
  if (!r.options.corner) {
    if (r.screwClips > 0) parts.push(`${clip}(피스형) × ${fmt(r.screwClips)}개`);
    if (r.tapeClips > 0) parts.push(`${clip}(양면테이프형) × ${fmt(r.tapeClips)}개`);
  }
  if (r.powerLineCount > 0) parts.push(`전원연결선(2M) × ${fmt(r.powerLineCount)}개`);
  if (r.options.cover && r.coverCount > 0) parts.push(`아크릴커버(1M) × ${fmt(r.coverCount)}개`);
  if (r.options.corner && r.cornerCount > 0)
    parts.push(
      `코너각대(1.2M) × ${fmt(r.cornerCount)}개, 코너각대 고정클립 × ${fmt(r.cornerClipCount)}개`,
    );
  return parts.length ? parts.join(", ") : "없음";
}

/** 하단 요약: SMPS */
export function smpsSummaryText(r: BlockBarCalc): string {
  return r.recommended !== null && r.totalWatt > 0 ? `${r.recommended}W × 1대` : "해당 없음";
}

/** SMPS 권장 카드 (원본 renderSmps). muted=true 는 회색 안내문 */
export function smpsLines(product: BlockBarProduct, r: BlockBarCalc): { text: string; muted: boolean }[] {
  const totalW = r.totalWatt;
  const out = [{ text: `총 소비전력: ${totalW.toFixed(2)} W`, muted: false }];
  if (totalW === 0) {
    out.push({ text: "블럭바가 없어 전원 공급 불필요", muted: true });
  } else if (r.recommended !== null) {
    const pct = (totalW / r.recommended) * 100;
    out.push({
      text: `권장 SMPS: ${r.recommended} W (부하 ${pct.toFixed(1)}% / 70% 기준 충족)`,
      muted: false,
    });
    out.push({ text: `권장 SMPS 가격: ₩${fmt(r.smpsSubtotal)}`, muted: false });
  } else {
    const maxCap = product.smps[product.smps.length - 1].watt;
    const limitW = (maxCap * product.loadLimit).toFixed(1);
    out.push({ text: "권장 SMPS: 단일 SMPS로 70% 기준 충족 불가", muted: false });
    out.push({
      text: `총 소비전력 ${totalW.toFixed(2)} W → ${maxCap}W × 70% = ${limitW} W 초과`,
      muted: true,
    });
    out.push({ text: "옵션: ① 규격/수량 조정 ② SMPS 2대 이상 분산", muted: true });
  }
  return out;
}

// ===== 장바구니 =====

/** 계산 결과 → 공통 장바구니 형식 (수량 0인 품목 제외) */
export function toCartLines(product: BlockBarProduct, r: BlockBarCalc): CartLine[] {
  const p = product.skuPrefix;
  const acc = product.accessories;
  const lines: CartLine[] = [];
  const add = (sku: string, name: string, quantity: number, unitPrice: number) => {
    if (quantity <= 0) return;
    const existing = lines.find((l) => l.sku === sku);
    if (existing) existing.quantity += quantity;
    else lines.push({ sku, name, quantity, unitPrice });
  };

  // 블럭바 (병렬이면 A/B변 합산)
  for (const side of r.sides) {
    for (const it of side.items) {
      if (it.mid) add(`${p}-mid-${it.size}`, `${product.name} ${product.midLabel} ${it.size}mm`, it.count, it.unitPrice);
      else add(`${p}-${it.size}`, `${product.name} ${it.size}mm`, it.count, it.unitPrice);
    }
  }
  // 원본 표시 순서(규격 큰 것부터, 중간연결형 먼저)로 정렬
  const order = (sku: string) => {
    const mid = sku.startsWith(`${p}-mid-`);
    const size = Number(sku.slice(sku.lastIndexOf("-") + 1));
    return -size * 2 - (mid ? 1 : 0);
  };
  lines.sort((a, b) => order(a.sku) - order(b.sku));

  if (r.recommended !== null && r.totalWatt > 0) {
    add(`${product.smpsSkuPrefix}-${r.recommended}`, `${product.smpsName} ${r.recommended}W`, 1, r.smpsSubtotal);
  }
  add(`${p}-clip-screw`, "고정클립(피스형)", r.screwClips, acc.screwClip);
  add(`${p}-clip-tape`, "고정클립(양면테이프형)", r.tapeClips, acc.tapeClip);
  add(`${p}-powerline-2m`, "전원 연결선 (2M)", r.powerLineCount, acc.powerLine);
  add(`${p}-cover-1m`, "아크릴 커버 (1M)", r.coverCount, acc.cover);
  add(`${p}-corner-1200`, "코너각대 (1.2M)", r.cornerCount, acc.cornerAngle);
  add(`${p}-corner-clip`, "코너각대 고정클립", r.cornerClipCount, acc.cornerClip);
  return lines;
}

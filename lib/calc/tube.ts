/**
 * T5 / 누빔 T5 / T3 처럼 "정해진 길이의 등기구를 조합해 한 변을 채우는" 계산기의 공통 로직.
 * 원본: oox/root/t5/app.js (generateCombos, comboToCounts, priceFromCounts ...)
 * UI와 분리된 순수 함수만 둔다.
 */
import type { CartLine } from "./types";

export type TubeSize = {
  /** 표기 사이즈 (예: "1200") */
  label: string;
  /** 실제 길이 (mm) */
  length: number;
  /** 단가 (원) */
  price: number;
};

export type TubeProduct = {
  /** sku 접두어 (예: "t5-namyoung") */
  skuPrefix: string;
  /** 표시용 품목명 접두어 (예: "남영 T5") */
  name: string;
  /** 큰 사이즈부터 (원본 order 배열 순서) */
  sizes: TubeSize[];
};

export type InstallType = "straight" | "L" | "square";

export type Combo = {
  /** 사용된 사이즈 label 목록 */
  combo: string[];
  used: number;
  remaining: number;
  cost: number;
};

export type Counts = Record<string, number>;

/** 타입별 입력 변과 여유치수 범위 */
export const INSTALL_TYPES: Record<
  InstallType,
  { sides: { id: string; label: string; title: string }[]; minRem: number; maxRem: number }
> = {
  straight: {
    sides: [{ id: "STRAIGHT", label: "A", title: "일자 조합 리스트" }],
    minRem: 50,
    maxRem: 100,
  },
  L: {
    sides: [
      { id: "A", label: "A", title: "A 조합 리스트" },
      { id: "B", label: "B", title: "B 조합 리스트" },
    ],
    minRem: 50,
    maxRem: 100,
  },
  square: {
    sides: [
      { id: "S1", label: "A", title: "A 조합 리스트" },
      { id: "S2", label: "B", title: "B 조합 리스트" },
      { id: "S3", label: "C", title: "C 조합 리스트" },
      { id: "S4", label: "D", title: "D 조합 리스트" },
    ],
    minRem: 50,
    maxRem: 120,
  },
};

/** 조합 생성 (여유 minRem~maxRem, 같은 여유는 최저가만, 비용 오름차순) */
export function generateCombos(
  product: TubeProduct,
  space: number,
  minRem = 50,
  maxRem = 100,
): Combo[] {
  const { sizes } = product;
  const priceOf = priceLookup(product);
  const combos: Combo[] = [];
  const curr: TubeSize[] = [];

  function dfs(index: number, used: number) {
    if (used > space) return;
    const remaining = space - used;
    if (remaining >= minRem && remaining <= maxRem) {
      combos.push({
        combo: curr.map((s) => s.label),
        used,
        remaining,
        cost: curr.reduce((sum, s) => sum + priceOf[s.label], 0),
      });
    }
    for (let i = index; i < sizes.length; i++) {
      curr.push(sizes[i]);
      dfs(i, used + sizes[i].length);
      curr.pop();
    }
  }
  dfs(0, 0);

  // 여유치수별 최저가 하나만
  const best = new Map<number, Combo>();
  for (const it of combos) {
    const prev = best.get(it.remaining);
    if (
      !prev ||
      it.cost < prev.cost ||
      (it.cost === prev.cost && it.combo.length < prev.combo.length) ||
      (it.cost === prev.cost &&
        it.combo.length === prev.combo.length &&
        it.used > prev.used)
    ) {
      best.set(it.remaining, it);
    }
  }

  return Array.from(best.values()).sort(
    (a, b) =>
      a.cost - b.cost ||
      a.combo.length - b.combo.length ||
      b.remaining - a.remaining ||
      b.used - a.used,
  );
}

function priceLookup(product: TubeProduct): Record<string, number> {
  return Object.fromEntries(product.sizes.map((s) => [s.label, s.price]));
}

export function emptyCounts(product: TubeProduct): Counts {
  return Object.fromEntries(product.sizes.map((s) => [s.label, 0]));
}

export function comboToCounts(product: TubeProduct, combo: Combo): Counts {
  const cm = emptyCounts(product);
  combo.combo.forEach((label) => {
    cm[label] = (cm[label] || 0) + 1;
  });
  return cm;
}

export function sumCounts(product: TubeProduct, list: Counts[]): Counts {
  const total = emptyCounts(product);
  for (const cm of list) {
    for (const s of product.sizes) total[s.label] += cm[s.label] || 0;
  }
  return total;
}

export function priceFromCounts(product: TubeProduct, counts: Counts): number {
  return product.sizes.reduce((s, size) => s + (counts[size.label] || 0) * size.price, 0);
}

/** "1200mm : 2개" 줄 목록. 없으면 "없음" */
export function formatCounts(product: TubeProduct, counts: Counts): string {
  const lines = product.sizes
    .filter((s) => (counts[s.label] || 0) > 0)
    .map((s) => `${s.label}mm : ${counts[s.label]}개`)
    .join("\n");
  return lines || "없음";
}

/** "1160mm x 2, 860mm x 1" */
export function formatRealLengths(product: TubeProduct, counts: Counts): string {
  return product.sizes
    .filter((s) => counts[s.label] > 0)
    .map((s) => `${s.length}mm x ${counts[s.label]}`)
    .join(", ");
}

export function countsToCartLines(product: TubeProduct, counts: Counts): CartLine[] {
  return product.sizes
    .filter((s) => (counts[s.label] || 0) > 0)
    .map((s) => ({
      sku: `${product.skuPrefix}-${s.label}`,
      name: `${product.name} ${s.label}`,
      quantity: counts[s.label],
      unitPrice: s.price,
    }));
}

export type CalcResult =
  | { ok: true; lists: { sideId: string; title: string; combos: Combo[] }[] }
  | { ok: false; message: string };

/** 원본 onCalculate()의 검증 + 조합 생성 부분 */
export function calculate(
  product: TubeProduct,
  type: InstallType,
  lengths: (number | null)[],
): CalcResult {
  const def = INSTALL_TYPES[type];
  const invalid = def.sides.some((_, i) => {
    const v = lengths[i];
    return v == null || isNaN(v) || v <= 0;
  });
  if (invalid) {
    const message =
      type === "straight"
        ? "길이를 올바르게 입력해주세요."
        : type === "L"
          ? "두 변 길이를 올바르게 입력해주세요."
          : "4개 변 길이를 모두 올바르게 입력해주세요.";
    return { ok: false, message };
  }

  const lists = def.sides.map((side, i) => ({
    sideId: side.id,
    title: side.title,
    combos: generateCombos(product, lengths[i] as number, def.minRem, def.maxRem),
  }));

  if (lists.some((l) => !l.combos.length)) {
    const message =
      type === "straight"
        ? "50~100mm 사이로 남는 조합이 없습니다."
        : type === "L"
          ? "50~100mm 사이로 남는 조합이 없는 변이 있습니다."
          : "50~100mm(또는 설정 범위)로 남는 조합이 없는 변이 있습니다.";
    return { ok: false, message };
  }
  return { ok: true, lists };
}


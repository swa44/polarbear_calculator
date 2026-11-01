import { fmt, smpsLines, toCartLines, type BlockBarCalc, type BlockBarProduct } from "@/lib/calc/blockbar";
import type { CartLine } from "@/lib/calc/types";
import { KV, Section, SummaryCard } from "./ResultParts";

/** "권장 SMPS: 100 W (…)" → ["권장 SMPS", "100 W (…)"] */
const splitKV = (text: string) => {
  const i = text.indexOf(": ");
  return i < 0 ? null : ([text.slice(0, i), text.slice(i + 2)] as const);
};

const toItems = (lines: CartLine[], strip = "") =>
  lines.map((l) => ({
    name: strip && l.name.startsWith(strip) ? l.name.slice(strip.length) : l.name,
    qty: l.quantity,
    amount: l.quantity * l.unitPrice,
  }));

/** 블럭바 계산 결과: 품목·금액 요약 + 설치 추가정보(남는공간, 소비전력, 권장 SMPS) */
export default function BlockBarResult({
  product,
  result: r,
}: {
  product: BlockBarProduct;
  result: BlockBarCalc;
}) {
  const cart = toCartLines(product, r);
  const isBar = new RegExp(`^${product.skuPrefix}-(mid-)?\\d+$`);
  const isSmps = (sku: string) => sku.startsWith(`${product.smpsSkuPrefix}-`);
  const barLines = cart.filter((l) => isBar.test(l.sku));
  const smpsCart = cart.filter((l) => isSmps(l.sku));
  const accLines = cart.filter((l) => !isBar.test(l.sku) && !isSmps(l.sku));

  // 권장 SMPS 줄 (총 소비전력·가격 줄은 따로 표시하거나 생략)
  const smpsInfo = smpsLines(product, r).filter(
    (l) => !l.text.startsWith("총 소비전력") && !l.text.startsWith("권장 SMPS 가격"),
  );
  // 변별 길이 정보. 입력 길이 = 블럭바 설치길이 + 남는공간 (pickUsedLen 규칙)
  const lengthRows = r.sides.flatMap((side, i) => {
    const suffix = r.connection === "serial" ? "" : ` (${i === 0 ? "A" : "B"}변)`;
    return [
      { label: `입력하신 길이${suffix}`, value: side.used + side.leftover },
      { label: `블럭바 설치길이${suffix}`, value: side.used },
      { label: `남는공간${suffix}`, value: side.leftover },
    ];
  });

  return (
    <>
      <SummaryCard
        label="총 가격"
        total={r.grandTotal}
        rows={[
          { label: "계(블럭바)", amount: r.blockbarSubtotal, items: toItems(barLines, `${product.name} `), detail: "없음" },
          { label: "계(부속품)", amount: r.accSubtotal, items: toItems(accLines), detail: "없음" },
          { label: "계(SMPS)", amount: r.smpsSubtotal, items: toItems(smpsCart, `${product.smpsName} `), detail: "해당 없음" },
        ]}
      />

      <Section title="설치 추가정보">
        <div className="kv-list">
          {lengthRows.map((l) => (
            <KV key={l.label} label={l.label} value={`${fmt(l.value)} mm`} />
          ))}
          <KV label="총 소비전력" value={`${r.totalWatt.toFixed(2)} W`} />
          {smpsInfo.map((l, i) => {
            const kv = !l.muted && splitKV(l.text);
            return kv ? (
              <KV key={i} label={kv[0]} value={kv[1]} />
            ) : (
              <p key={i} className="section-note">
                {l.text}
              </p>
            );
          })}
        </div>
        {r.options.corner && (
          <p className="section-note">※ 코너각대 사용으로 기본 고정클립(피스/양면)은 포함되지 않습니다.</p>
        )}
      </Section>
    </>
  );
}

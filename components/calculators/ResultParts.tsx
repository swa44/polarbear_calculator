import type { ReactNode } from "react";
import type { CartLine } from "@/lib/calc/types";

export const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/** 결과 맨 위 검정 요약 카드: 총액 + 소계 목록 */
export function SummaryCard({
  label = "총 예상 금액",
  total,
  rows = [],
  children,
}: {
  label?: string;
  total: number;
  rows?: {
    label: string;
    amount: number;
    detail?: string;
    /** 소계 아래 품목 줄 ("1000mm × 3   ₩47,700"). 비어 있으면 detail 표시 */
    items?: { name: string; qty: number; amount: number }[];
  }[];
  children?: ReactNode;
}) {
  return (
    <div className="card summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-total" data-total={total}>
        {won(total)}
      </div>
      {rows.length > 0 && (
        <div className="summary-rows">
          {rows.map((r) => (
            <div className="summary-row" key={r.label} data-sub={r.label} data-amount={r.amount}>
              <div className="summary-row-main">
                <span>{r.label}</span>
                <span>{won(r.amount)}</span>
              </div>
              {r.items && r.items.length > 0 ? (
                <div className="summary-items">
                  {r.items.map((it) => (
                    <div className="summary-item" key={it.name} data-name={it.name} data-qty={it.qty} data-amount={it.amount}>
                      <span>
                        {it.name} × {it.qty.toLocaleString("ko-KR")}
                      </span>
                      <span>{won(it.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                r.detail && <div className="summary-detail">{r.detail}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/** 품목 묶음 카드 (제목 + 소계) */
export function Section({
  title,
  subtotal,
  badge,
  children,
}: {
  title: string;
  subtotal?: number;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="card result-section" data-subtotal={subtotal}>
      <div className="result-section-head">
        <h3>
          {title}
          {badge && <span className="head-badge">{badge}</span>}
        </h3>
        {subtotal !== undefined && <span className="result-section-sub">{won(subtotal)}</span>}
      </div>
      {children}
    </section>
  );
}

/** 품목 한 줄: 이름 / 단가 × 수량 / 금액 */
export function ItemRow({
  name,
  sub,
  quantity,
  unitPrice,
  unit = "개",
  sku,
}: {
  name: string;
  sub?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  sku?: string;
}) {
  return (
    <div className="item-row" data-sku={sku} data-qty={quantity} data-amount={unitPrice * quantity}>
      <div className="item-main">
        <div className="item-name">{name}</div>
        <div className="item-sub">
          {sub && <>{sub} · </>}
          {won(unitPrice)} × {quantity.toLocaleString("ko-KR")}
          {unit}
        </div>
      </div>
      <div className="item-amount">{won(unitPrice * quantity)}</div>
    </div>
  );
}

/** 장바구니 품목 목록. strip 으로 공통 접두어(예: "12V 블럭바 ")를 뗀다 */
export function ItemList({
  lines,
  strip,
  empty,
  unitOf,
}: {
  lines: CartLine[];
  strip?: string;
  empty?: string;
  /** 품목별 수량 단위 (기본 "개") */
  unitOf?: (sku: string) => string;
}) {
  if (!lines.length) return empty === "" ? null : <p className="item-empty">{empty ?? "없음"}</p>;
  return (
    <div className="item-list">
      {lines.map((l) => (
        <ItemRow
          key={l.sku}
          sku={l.sku}
          name={strip && l.name.startsWith(strip) ? l.name.slice(strip.length) : l.name}
          quantity={l.quantity}
          unitPrice={l.unitPrice}
          unit={unitOf?.(l.sku)}
        />
      ))}
    </div>
  );
}

/** 라벨-값 한 줄 (소비전력 등 정보 표시) */
export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="kv-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export const sumLines = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

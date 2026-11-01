"use client";

import { useEffect, useMemo, useState } from "react";
import { availableColors, buildPurchase, cartUrl, COLOR_DESC } from "@/lib/cafe24";
import type { CartLine } from "@/lib/calc/types";
import type { Cafe24Map } from "@/lib/products";
import { useScrollLock } from "./useScrollLock";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/** "구매하러 가기" 확인창: 색온도 선택 → 자사몰 장바구니로 이동 */
export default function PurchaseModal({
  lines,
  map,
  onClose,
}: {
  lines: CartLine[];
  map: Cafe24Map;
  onClose: () => void;
}) {
  useScrollLock(true);
  const colors = useMemo(() => availableColors(lines, map), [lines, map]);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [moving, setMoving] = useState(false);
  const needColor = colors.length > 0 && !color;
  const { items, missing, payload } = buildPurchase(lines, map, color);
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = () => {
    if (needColor || !payload.length) return;
    setMoving(true);
    window.location.assign(cartUrl(payload));
  };

  return (
    <div
      className="modal purchase-modal"
      role="dialog"
      aria-modal="true"
      aria-label="구매하러 가기"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3>구매하러 가기</h3>
          <button type="button" className="modal-close" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="purchase-lead">
            <strong>자사몰로 연결됩니다.</strong>
            <br />
            폴라베어마켓으로 이동해 아래 품목을 장바구니에 담아드립니다.
          </p>

          {colors.length > 0 && (
            <section className="purchase-block">
              <h4>색온도 선택</h4>
              <div className="color-options" role="radiogroup" aria-label="색온도">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    className={`color-option ${color === c ? "active" : ""}`}
                    onClick={() => setColor(c)}
                  >
                    <span className="color-name">{c}</span>
                    <span className="color-desc">{COLOR_DESC[c]}</span>
                  </button>
                ))}
              </div>
              <p className="purchase-hint">선택한 색온도가 조명 품목 전체에 적용됩니다. 부속품·SMPS는 그대로 담깁니다.</p>
            </section>
          )}

          <section className="purchase-block">
            <h4>담길 품목</h4>
            {needColor ? (
              <p className="purchase-hint">색온도를 선택하면 담길 품목이 표시됩니다.</p>
            ) : (
              <>
                <div className="purchase-items">
                  {items.map((i) => (
                    <div className="purchase-item" key={i.sku}>
                      <span>
                        {i.name}
                        {i.color && <span className="purchase-color"> · {i.color}</span>} × {i.quantity.toLocaleString("ko-KR")}
                      </span>
                      <span>{won(i.quantity * i.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="purchase-total">
                  <span>합계</span>
                  <strong>{won(total)}</strong>
                </div>
                {missing.length > 0 && (
                  <p className="purchase-warn">
                    자사몰에서 판매하지 않는 품목은 담기지 않습니다: {missing.map((m) => m.name).join(", ")}
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <div className="sheet-footer purchase-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={needColor || !payload.length || moving}
            onClick={go}
          >
            {moving ? "이동 중…" : needColor ? "색온도를 선택해주세요" : "자사몰로 이동"}
          </button>
        </div>
      </div>
    </div>
  );
}

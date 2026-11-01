"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/calc/types";
import type { Cafe24Map } from "@/lib/products";
import PurchaseModal from "./PurchaseModal";
import { useScrollLock } from "./useScrollLock";

export { useScrollLock };

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 있으면 하단에 "구매하러 가기" 버튼 (카페24 매핑이 없으면 숨김) */
  purchase?: { lines: CartLine[]; map: Cafe24Map };
};

/** 계산 결과 모달 (모바일: 아래에서 올라오는 시트, PC: 가운데 창) */
export default function ResultSheet({ open, onClose, title = "계산 결과", children, purchase }: Props) {
  useScrollLock(open);
  const [buying, setBuying] = useState(false);
  const canBuy = !!purchase && purchase.lines.length > 0 && Object.keys(purchase.map).length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // 다른 모달(조합 변경, 경고)이 위에 떠 있으면 그쪽이 먼저 닫히도록 둔다
      if (e.key === "Escape" && !document.querySelector(".modal, .bb-modal")) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-content">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        <div className={`sheet-footer ${canBuy ? "sheet-footer-split" : ""}`}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
          {canBuy && (
            <button type="button" className="btn btn-primary" onClick={() => setBuying(true)}>
              구매하러 가기
            </button>
          )}
        </div>
      </div>
      {buying && purchase && (
        <PurchaseModal lines={purchase.lines} map={purchase.map} onClose={() => setBuying(false)} />
      )}
    </div>
  );
}

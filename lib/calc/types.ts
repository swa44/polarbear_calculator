/** 모든 계산기가 내보내는 공통 결과 형식. 장바구니 연동의 기준. */
export type CartLine = {
  /** 내부 품목 코드 (예: "t5-namyoung-1200") */
  sku: string;
  /** 표시용 이름 */
  name: string;
  quantity: number;
  unitPrice: number;
};

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}


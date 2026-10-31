import { Fragment } from "react";
import {
  accSummaryText,
  countsSummaryText,
  fmt,
  partsLines,
  sideLines,
  smpsLines,
  smpsSummaryText,
  type BlockBarCalc,
  type BlockBarProduct,
} from "@/lib/calc/blockbar";

/** 줄 목록을 <br/>로 이어 붙임 (원본 lines.join('<br/>')) */
function Lines({ lines, empty }: { lines: string[]; empty: string }) {
  if (!lines.length) return <>{empty}</>;
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {l}
        </Fragment>
      ))}
    </>
  );
}

/** 블럭바 계산 결과 카드들 (원본 calculate()의 출력 HTML) */
export default function BlockBarResult({
  product,
  result: r,
}: {
  product: BlockBarProduct;
  result: BlockBarCalc;
}) {
  const sideTitles =
    r.connection === "serial" ? ["사용한 블럭바"] : ["사용한 블럭바 (A변)", "사용한 블럭바 (B변)"];

  return (
    <>
      {r.sides.map((side, i) => (
        <div className="card" key={i}>
          <div className="rank-title">{sideTitles[i]}</div>
          <div className="muted" style={{ marginBottom: 6 }}>
            설치길이 합계: {fmt(side.used)} mm / 남는공간: {fmt(side.leftover)} mm
          </div>
          <Lines lines={sideLines(product, side)} empty="사용한 블럭바 없음" />
        </div>
      ))}

      <div className="card">
        <div className="rank-title">SMPS 권장</div>
        {smpsLines(product, r).map((l, i) => (
          <div key={i} className={l.muted ? "muted" : undefined}>
            {l.text}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="rank-title">필요 부속품</div>
        <Lines lines={partsLines(product, r)} empty="추가 부속품 없음" />
        {r.options.corner && (
          <div className="muted" style={{ marginTop: 6 }}>
            ※ 코너각대 사용으로 기본 고정클립(피스/양면)은 포함되지 않습니다.
          </div>
        )}
      </div>

      <div className="card totals">
        <div>
          <strong>계(블럭바):</strong> ₩{fmt(r.blockbarSubtotal)}
        </div>
        <div className="muted">• {countsSummaryText(product, r.totalsCounts)}</div>
        <div style={{ marginTop: 6 }}>
          <strong>계(부속품):</strong> ₩{fmt(r.accSubtotal)}
        </div>
        <div className="muted">• {accSummaryText(product, r)}</div>
        <div style={{ marginTop: 6 }}>
          <strong>계(SMPS):</strong> ₩{fmt(r.smpsSubtotal)}
        </div>
        <div className="muted">• {smpsSummaryText(r)}</div>
        <div className="total-line" style={{ marginTop: 10 }}>
          <strong>총 가격:</strong> ₩{fmt(r.grandTotal)}
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculate,
  comboToCounts,
  formatCounts,
  formatRealLengths,
  INSTALL_TYPES,
  priceFromCounts,
  sumCounts,
  type CalcResult,
  type Combo,
  type InstallType,
  type TubeProduct,
} from "@/lib/calc/tube";

type Intro =
  | { kind: "youtube"; videoId: string }
  | { kind: "image"; src: string; alt: string };

type Props = {
  title: string;
  product: TubeProduct;
  intro: Intro;
  /** 타입별 측정 가이드 이미지 (basePath 포함 경로) */
  typeImages: Record<InstallType, string>;
};

const TYPE_BUTTONS: { type: InstallType; label: string }[] = [
  { type: "straight", label: "일자 간접박스" },
  { type: "L", label: "ㄱ자 간접박스" },
  { type: "square", label: "ㅁ자 간접박스(우물천장)" },
];

const won = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

/** 숫자만 남기고 천 단위 쉼표 */
function formatInput(v: string): string {
  const digits = v.replace(/[^0-9]/g, "");
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
}

export default function TubeCalculator({ title, product, intro, typeImages }: Props) {
  const [type, setType] = useState<InstallType | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [modalSide, setModalSide] = useState<string | null>(null);

  const chooseType = (t: InstallType) => {
    setType(t);
    setInputs(INSTALL_TYPES[t].sides.map(() => ""));
    setResult(null);
    setSelections({});
  };

  const goHome = () => {
    setType(null);
    setInputs([]);
    setResult(null);
    setSelections({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCalculate = () => {
    if (!type) return;
    const lengths = inputs.map((v) => {
      const n = parseInt(v.replace(/,/g, ""), 10);
      return isNaN(n) ? null : n;
    });
    const r = calculate(product, type, lengths);
    setResult(r);
    setSelections(r.ok ? Object.fromEntries(r.lists.map((l) => [l.sideId, 0])) : {});
  };

  // 선택된 조합 합산
  const totals = useMemo(() => {
    if (!result?.ok) return null;
    const counts = sumCounts(
      product,
      result.lists.map((l) => comboToCounts(product, l.combos[selections[l.sideId] ?? 0])),
    );
    return { counts, cost: priceFromCounts(product, counts) };
  }, [product, result, selections]);

  // 모달 열려 있을 때 배경 스크롤 막기
  useEffect(() => {
    if (!modalSide) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalSide]);

  const modalList = result?.ok ? result.lists.find((l) => l.sideId === modalSide) : undefined;

  return (
    <div className="wrapper">
      <h1>{title}</h1>

      {type === null ? (
        /* ▣ 타입 선택 카드 */
        <div className="card" style={{ maxWidth: 680, margin: "18px auto" }}>
          {intro.kind === "youtube" ? (
            <div className="yt-box">
              <div className="yt-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${intro.videoId}?enablejsapi=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="image-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={intro.src} alt={intro.alt} className="main-image" />
            </div>
          )}
          <div className="rank-title" style={{ fontSize: 18, marginBottom: 10 }}>
            설치 타입 선택
          </div>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            먼저 설치 타입을 선택해주세요.
          </p>
          <div className="stack-vert">
            {TYPE_BUTTONS.map((b) => (
              <button
                key={b.type}
                type="button"
                className="pickbtn"
                onClick={() => chooseType(b.type)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ▣ 본 계산부 */
        <div>
          <div className="img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="type-image" src={typeImages[type]} alt="측정 가이드" />
          </div>

          <p className="lead" style={{ marginTop: 16, marginBottom: 20 }}>
            <strong>설치할 공간의 길이를 mm 단위로 입력해주세요.</strong>
          </p>

          <div className="controls">
            <div className="full">
              {INSTALL_TYPES[type].sides.map((side, i) => (
                <div className="input-group" key={side.id}>
                  <label htmlFor={`lengthInput${i + 1}`}>{side.label} 길이 (mm)</label>
                  <input
                    type="text"
                    id={`lengthInput${i + 1}`}
                    inputMode="numeric"
                    placeholder="길이를 입력해주세요"
                    value={inputs[i] ?? ""}
                    onChange={(e) => {
                      const next = [...inputs];
                      next[i] = formatInput(e.target.value);
                      setInputs(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onCalculate();
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="full">
              <button type="button" onClick={onCalculate}>
                계산하기
              </button>
            </div>
            <div className="full">
              <button type="button" onClick={goHome}>
                처음으로
              </button>
            </div>
          </div>

          <div className="result">
            {result && !result.ok && <p className="no-data">{result.message}</p>}

            {result?.ok && (
              <>
                <div className="card" style={{ marginBottom: 16 }}>
                  <strong>
                    기본적으로 가장 저렴한 조합이 선택되어 있습니다.
                    <br />
                    아래 목록을 누르면 <br />
                    여유 치수와 비용이 다른 <br />
                    다양한 조합을 확인하실 수 있습니다.
                    <br />
                    모든 옵션은 설치가 가능합니다.
                  </strong>
                  <br />
                  <br />
                  💡 선택 팁
                  <br />• 전원선 직접 연결: 여유 치수 70mm 이상 필수
                  <br />• 커넥터 분리 후 연결: 모든 사이즈 자유 선택 가능
                </div>

                {totals && (
                  <div className="card totals" style={{ marginBottom: 16 }}>
                    <div className="rank-title">총 필요 수량 &amp; 비용 (선택 조합 합산)</div>
                    <div className="counts">{formatCounts(product, totals.counts)}</div>
                    <div style={{ marginTop: 4 }}>
                      <strong>예상 비용</strong> ₩{won(totals.cost)}
                    </div>
                  </div>
                )}

                {result.lists.map((l) => (
                  <div className="card combo-selector" key={l.sideId}>
                    <div className="rank-title" style={{ marginBottom: 10 }}>
                      {l.title}
                    </div>
                    <div className="selected-display">
                      <ComboDetail
                        product={product}
                        combo={l.combos[selections[l.sideId] ?? 0]}
                        index={selections[l.sideId] ?? 0}
                      />
                    </div>
                    <button
                      type="button"
                      className="change-btn"
                      onClick={() => setModalSide(l.sideId)}
                    >
                      변경
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* 조합 선택 모달 */}
      {modalList && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalSide(null);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalList.title}</h3>
              <button type="button" className="modal-close" onClick={() => setModalSide(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {modalList.combos.map((c, idx) => (
                <div
                  key={idx}
                  className={`modal-option ${idx === selections[modalList.sideId] ? "active" : ""}`}
                  onClick={() => {
                    setSelections((s) => ({ ...s, [modalList.sideId]: idx }));
                    setModalSide(null);
                  }}
                >
                  <ComboDetail product={product} combo={c} index={idx} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComboDetail({
  product,
  combo,
  index,
}: {
  product: TubeProduct;
  combo: Combo;
  index: number;
}) {
  const cm = comboToCounts(product, combo);
  return (
    <>
      <div className="rank-title">선택{index + 1}</div>
      <div className="counts">{formatCounts(product, cm)}</div>
      <div className="muted">(실제: {formatRealLengths(product, cm)})</div>
      <div style={{ marginTop: 6 }}>
        <span className="remaining-box">여유치수 {combo.remaining}mm</span>{" "}
        <span className="muted">/ 총 사용 {combo.used}mm</span>
      </div>
      <div style={{ marginTop: 4 }}>
        <strong>예상 비용</strong> ₩{won(priceFromCounts(product, cm))}
      </div>
    </>
  );
}


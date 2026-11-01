"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ResultSheet, { useScrollLock } from "@/components/ResultSheet";
import { ChevronRight, PageHead } from "@/components/ui";
import type { Addon, Cafe24Map } from "@/lib/products";
import { Section, SummaryCard, won } from "./ResultParts";
import {
  calculate,
  comboToCounts,
  countsToCartLines,
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
  /** 카페24 옵션 매핑 (구매하러 가기) */
  cafe24: Cafe24Map;
  /** 구매 확인창에서 고르는 추가 품목 (양방향 연결잭) */
  addons?: Addon[];
  intro: Intro;
};

const TYPE_BUTTONS: { type: InstallType; label: string }[] = [
  { type: "straight", label: "ㅡ자 간접박스" },
  { type: "L", label: "ㄱ자 간접박스" },
  { type: "square", label: "ㅁ자 간접박스(우물천장)" },
];

/** 숫자만 남기고 천 단위 쉼표 */
function formatInput(v: string): string {
  const digits = v.replace(/[^0-9]/g, "");
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
}

function TubeCalculatorInner({ title, product, intro, cafe24, addons }: Props) {
  const [type, setType] = useState<InstallType | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [modalSide, setModalSide] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    setSheetOpen(r.ok);
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

  // 조합 변경 모달 열려 있을 때 배경 스크롤 막기
  useScrollLock(modalSide !== null);

  const modalList = result?.ok ? result.lists.find((l) => l.sideId === modalSide) : undefined;

  return (
    <div className="page calc-page">
      <PageHead title={title} />

      {type === null ? (
        /* ▣ 타입 선택 */
        <section className="card">
          {intro.kind === "youtube" ? (
            <div className="media yt-embed">
              <iframe
                src={`https://www.youtube.com/embed/${intro.videoId}?enablejsapi=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={intro.src} alt={intro.alt} />
            </div>
          )}
          <h2 className="section-title">설치 타입 선택</h2>
          <p className="section-desc">먼저 설치 타입을 선택해주세요.</p>
          <div className="option-list">
            {TYPE_BUTTONS.map((b) => (
              <button key={b.type} type="button" className="option-btn" onClick={() => chooseType(b.type)}>
                {b.label}
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
      ) : (
        /* ▣ 길이 입력 */
        <section className="card">
          <div className="chip-stack">
            <span className="chip-label">설치 타입</span>
            <span className="chip">{TYPE_BUTTONS.find((b) => b.type === type)?.label}</span>
          </div>

          <h2 className="section-title" style={{ marginTop: 24 }}>설치할 공간의 길이를 mm 단위로 입력해주세요.</h2>

          <div className="fields">
            {INSTALL_TYPES[type].sides.map((side, i) => (
              <div className="field" key={side.id}>
                <label htmlFor={`lengthInput${i + 1}`} className="sr-only">
                  {side.label} 길이
                </label>
                <div className="input-wrap">
                  <input
                    type="text"
                    id={`lengthInput${i + 1}`}
                    className="input"
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
                  <span className="unit">mm</span>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={onCalculate}>
              계산하기
            </button>
            {result?.ok && !sheetOpen && (
              <button type="button" className="btn btn-secondary" onClick={() => setSheetOpen(true)}>
                계산 결과 다시 보기
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={goHome}>
              처음으로
            </button>
          </div>
        </section>
      )}

      {type !== null && result && !result.ok && <p className="no-data">{result.message}</p>}

      <ResultSheet
        open={sheetOpen && !!result?.ok}
        onClose={() => setSheetOpen(false)}
        purchase={{ lines: totals ? countsToCartLines(product, totals.counts) : [], map: cafe24, addons }}
      >
        <div className="result">
          {result?.ok && totals && (
            <>
              <SummaryCard
                label="총 필요 수량 & 비용 (선택 조합 합산)"
                total={totals.cost}
                rows={product.sizes
                  .filter((sz) => totals.counts[sz.label] > 0)
                  .map((sz) => ({
                    label: `${sz.label}mm : ${totals.counts[sz.label]}개`,
                    amount: sz.price * totals.counts[sz.label],
                  }))}
              />

              <div className="info-box">
                <p className="info-lead">
                  기본적으로 가장 저렴한 조합이 선택되어 있습니다. 아래 목록을 누르면 여유 치수와 비용이 다른 다양한
                  조합을 확인하실 수 있습니다. 모든 옵션은 설치가 가능합니다.
                </p>
                <div className="info-tip-title">💡 선택 팁</div>
                <ul className="info-tips">
                  <li>
                    <strong>전원선 직접 연결:</strong> 여유 치수 70mm 이상 필수
                  </li>
                  <li>
                    <strong>커넥터 분리 후 연결:</strong> 모든 사이즈 자유 선택 가능
                  </li>
                </ul>
              </div>

              {result.lists.map((l) => (
                <Section key={l.sideId} title={l.title}>
                  {l.fallback && (
                    <p className="section-note">
                      {INSTALL_TYPES[type!].minRem}~{INSTALL_TYPES[type!].maxRem}mm 사이로 남는 조합이 없어 가장 가까운
                      조합을 보여드립니다.
                    </p>
                  )}
                  <div className="combo-selected">
                    <ComboDetail
                      product={product}
                      combo={l.combos[selections[l.sideId] ?? 0]}
                      index={selections[l.sideId] ?? 0}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-change btn-sm mt-2"
                    onClick={() => setModalSide(l.sideId)}
                  >
                    변경
                  </button>
                </Section>
              ))}
            </>
          )}
        </div>
      </ResultSheet>

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
              <button type="button" className="modal-close" aria-label="닫기" onClick={() => setModalSide(null)}>
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
    <div className="combo">
      <div className="combo-head">
        <span className="combo-rank">선택{index + 1}</span>
        <span className="remaining-box">여유치수 {combo.remaining}mm</span>
      </div>
      <div className="combo-chips">
        {product.sizes
          .filter((sz) => cm[sz.label] > 0)
          .map((sz) => (
            <span className="combo-chip" key={sz.label}>
              {sz.label}mm : {cm[sz.label]}개
            </span>
          ))}
      </div>
      <div className="combo-meta">
        (실제: {formatRealLengths(product, cm)}) <span className="sep">/</span> 총 사용 {combo.used}mm
      </div>
      <div className="combo-foot">
        <span>예상 비용</span>
        <strong>{won(priceFromCounts(product, cm))}</strong>
      </div>
    </div>
  );
}

/**
 * 링크로 새로 들어올 때마다 처음 화면(방식 선택)부터 시작한다.
 * cacheComponents 사용 시 Next.js가 떠난 페이지의 상태를 보존하므로 bfcacheId를 key로 써서 초기화한다.
 * (브라우저 뒤로/앞으로 가기에서는 bfcacheId가 그대로라 입력하던 상태가 유지된다)
 */
export default function TubeCalculator(props: Props) {
  const { bfcacheId } = useRouter();
  return <TubeCalculatorInner key={bfcacheId} {...props} />;
}

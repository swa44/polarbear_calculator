"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { asset } from "@/lib/basePath";
import {
  calculate,
  CONNECTION_LABELS,
  fmt,
  toCartLines,
  type ConnectionType,
  type MlinePrices,
  type MlineResult,
  type Spec,
  type WireType,
} from "@/lib/calc/mline";
import ResultSheet from "@/components/ResultSheet";
import type { CartLine } from "@/lib/calc/types";
import type { Cafe24Map } from "@/lib/products";
import { KV, Section, SummaryCard } from "./ResultParts";
import { ChevronRight, PageHead } from "@/components/ui";
import { COLOR_DESC_6500 } from "@/lib/cafe24";

const SAMPLE_IMAGES: Record<ConnectionType, string> = {
  serial: asset("/mline/sample-serial.jpg"),
  parallel: asset("/mline/sample-parallel.jpg"),
  square: asset("/mline/sample-square.jpg"),
};

type Lengths = { length: string; a: string; b: string };
const EMPTY_LENGTHS: Lengths = { length: "", a: "", b: "" };

type Props = { prices: MlinePrices; cafe24: Cafe24Map };

function MlineCalculatorInner({ prices, cafe24 }: Props) {
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const [spec, setSpec] = useState<Spec | "">("");
  const [wireType, setWireType] = useState<WireType | "">("");
  const [lengths, setLengths] = useState<Lengths>(EMPTY_LENGTHS);
  const [result, setResult] = useState<MlineResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ===== 연결 방식 선택 =====
  const chooseConnection = (type: ConnectionType) => {
    setConnectionType(type);
    setSpec("");
    setWireType("");
    setLengths(EMPTY_LENGTHS);
    setResult(null);
  };

  // ===== 계산하기 =====
  const doCalculate = () => {
    const r = calculate({
      connectionType,
      spec: spec || null,
      wireType: wireType || null,
      ...lengths,
    }, prices);
    if (!r.ok) {
      // 원본: alert 후 해당 입력칸 포커스, 이전 결과는 그대로 둔다
      alert(r.message);
      const focusId =
        r.focus === "length" ? "lengthInput" : r.focus === "a" ? "lengthInputA" : r.focus === "b" ? "lengthInputB" : null;
      if (focusId) document.getElementById(focusId)?.focus();
      return;
    }
    setResult(r.result);
    setSheetOpen(true);
  };

  // 최신 doCalculate를 문서 keydown 핸들러에서 쓰기 위한 ref
  const calcRef = useRef(doCalculate);
  useEffect(() => {
    calcRef.current = doCalculate;
  });

  // 숫자 입력칸 또는 규격/전원선 select에서 Enter → 계산
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLInputElement | HTMLSelectElement | null;
      const isNumInput = !!active && active.tagName === "INPUT" && active.type === "number";
      const isSpecSelect =
        !!active &&
        active.tagName === "SELECT" &&
        (active.id === "specSelect" || active.id === "wiringSelect");
      if (e.key === "Enter" && (isNumInput || isSpecSelect)) {
        e.preventDefault();
        calcRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // ===== 처음으로 =====
  const reset = () => {
    setConnectionType(null);
    setSpec("");
    setWireType("");
    setLengths(EMPTY_LENGTHS);
    setResult(null);
    setSheetOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const disabled = !spec;
  const ph = spec
    ? "설치공간의 길이를 입력해주세요. (예: 2800) — 100단위"
    : "먼저 규격(40/60)을 선택하세요.";

  const lengthInput = (id: string, key: keyof Lengths, label: string) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          type="number"
          id={id}
          className="input"
          placeholder={ph}
          min={100}
          step={100}
          disabled={disabled}
          value={lengths[key]}
          onChange={(e) => setLengths((l) => ({ ...l, [key]: e.target.value }))}
        />
        <span className="unit">mm</span>
      </div>
    </div>
  );

  return (
    <div className="page calc-page">
      <PageHead title="매립라인조명 계산기" />

      {/* 설치 방식 선택 */}
      {connectionType === null && (
        <section className="card" id="connectChooser">
          <h2 className="section-title">설치 방식 선택</h2>
          <p className="section-desc">먼저 연결 방식을 선택해주세요.</p>
          <div className="option-list">
            <button type="button" className="option-btn" id="pickSerial" onClick={() => chooseConnection("serial")}>
              일자연결
              <ChevronRight />
            </button>
            <button type="button" className="option-btn" id="pickParallel" onClick={() => chooseConnection("parallel")}>
              ㄱ자연결
              <ChevronRight />
            </button>
            <button type="button" className="option-btn" id="pickSquare" onClick={() => chooseConnection("square")}>
              ㅁ자연결
              <ChevronRight />
            </button>
          </div>
        </section>
      )}

      {connectionType !== null && (
        <section className="card" id="lengthSection">
          <div className="chip-stack" id="connectionInfo">
            <span className="chip-label">선택한 설치 방식</span>
            <span className="chip">{CONNECTION_LABELS[connectionType]}</span>
          </div>

          {/* 1. 규격 */}
          <div className="guide-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/mline/spec-guide.jpg")} alt="규격 선택 가이드" />
          </div>
          <div className="field">
            <label htmlFor="specSelect">규격 선택</label>
            <select
              id="specSelect"
              className="input"
              value={spec}
              onChange={(e) => {
                setSpec(e.target.value as Spec | "");
                // 원본은 규격을 바꾸면 길이 입력칸을 다시 그려서 입력값이 지워진다
                setLengths(EMPTY_LENGTHS);
              }}
            >
              <option value="">선택</option>
              <option value="40">40</option>
              <option value="60">60</option>
            </select>
          </div>

          {/* 2. 전원선 */}
          <div className="guide-img" style={{ marginTop: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/mline/wire-guide.jpg")} alt="전원선 선택 가이드" />
          </div>
          <div className="field">
            <label htmlFor="wiringSelect">전원선 종류</label>
            <select
              id="wiringSelect"
              className="input"
              disabled={!spec}
              value={wireType}
              onChange={(e) => setWireType(e.target.value as WireType | "")}
            >
              <option value="">선택 (AS·시공 편의상 10구 또는 혼합형 권장)</option>
              <option value="wire1">전원선 1구(2m)</option>
              <option value="wire10">전원선 10구(10.5m)</option>
              <option value="mixed">혼합형(5개 미만은 낱개형으로 계산)</option>
            </select>
          </div>

          {/* 3. 길이 */}
          <div className="guide-img" style={{ marginTop: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE_IMAGES[connectionType]} alt="설치 방식 샘플" />
          </div>
          <div id="lengthInputsArea" className="fields" style={{ marginTop: 0 }}>
            {connectionType === "serial" && lengthInput("lengthInput", "length", "전체 길이")}
            {connectionType === "parallel" && (
              <>
                {lengthInput("lengthInputA", "a", "A변 길이")}
                {lengthInput("lengthInputB", "b", "B변 길이")}
              </>
            )}
            {connectionType === "square" && (
              <>
                {lengthInput("lengthInputA", "a", "A변 길이 - 마주보는 2개 변")}
                {lengthInput("lengthInputB", "b", "B변 길이 - 마주보는 2개 변")}
              </>
            )}
          </div>

          <div id="actionButtons" className="actions">
            <button type="button" className="btn btn-primary" onClick={doCalculate}>
              계산하기
            </button>
            {result && !sheetOpen && (
              <button type="button" className="btn btn-secondary" onClick={() => setSheetOpen(true)}>
                계산 결과 다시 보기
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={reset}>
              처음으로
            </button>
          </div>
        </section>
      )}

      {/* 결과 영역 */}
      <ResultSheet
        open={sheetOpen && !!result}
        onClose={() => setSheetOpen(false)}
        purchase={{ lines: result ? toCartLines(result, prices) : [], map: cafe24, colorDesc: COLOR_DESC_6500 }}
      >
        <div className="result">{result && <MlineResultView r={result} prices={prices} />}</div>
      </ResultSheet>
    </div>
  );
}

function NoticeBox({ desc, rows }: { desc: ReactNode; rows: ReactNode[] }) {
  return (
    <div className="notice">
      <div className="notice-title">📏 시공 안내</div>
      <p>{desc}</p>
      <div className="notice-rows">
        {rows.map((row, i) => (
          <div key={i}>{row}</div>
        ))}
      </div>
    </div>
  );
}

function Notice({ r }: { r: MlineResult }) {
  const n = r.notice;
  if (!n) return null;
  if (n.kind === "serial") {
    return (
      <NoticeBox
        desc="수월한 시공을 위해 사이드캡 공간(양쪽 5mm, 총 10mm)을 고려하여 다음과 같이 설치 공간을 마련해 주세요."
        rows={[
          <>
            입력하신 길이({fmt(n.L)}mm) + 10mm → <strong>{fmt(n.L + 10)}mm</strong>
          </>,
        ]}
      />
    );
  }
  if (n.kind === "square") {
    return (
      <NoticeBox
        desc={`수월한 시공을 위해 기역자형 길이 ${n.corner}mm를 고려하여 다음과 같이 설치 공간을 마련해 주세요.`}
        rows={[
          <>
            A변(2개): {fmt(n.A)}mm + {fmt(2 * n.corner)}mm → <strong>{fmt(n.aTot)}mm</strong> 각각
          </>,
          <>
            B변(2개): {fmt(n.B)}mm + {fmt(2 * n.corner)}mm → <strong>{fmt(n.bTot)}mm</strong> 각각
          </>,
        ]}
      />
    );
  }
  return (
    <NoticeBox
      desc={`수월한 시공을 위해 사이드캡 여유공간(각 변 5mm)과 기역자형 길이 ${n.corner}mm를 고려하여 다음과 같이 설치 공간을 마련해 주세요.`}
      rows={[
        <>
          A변: {fmt(n.A)}mm + {fmt(n.add)}mm → <strong>{fmt(n.aTot)}mm</strong>
        </>,
        <>
          B변: {fmt(n.B)}mm + {fmt(n.add)}mm → <strong>{fmt(n.bTot)}mm</strong>
        </>,
      ]}
    />
  );
}

const WIRE_TYPE_LABELS: Record<WireType, string> = {
  wire1: "전원선 1구(2m)",
  wire10: "전원선 10구(10.5m)",
  mixed: "혼합형",
};

/** 장바구니 품목 → 요약 카드 품목 줄 (공통 접두어 제거) */
const toItems = (lines: CartLine[], strip: string) =>
  lines.map((l) => ({
    name: l.name.startsWith(strip) ? l.name.slice(strip.length) : l.name,
    qty: l.quantity,
    amount: l.quantity * l.unitPrice,
  }));

/** 매립라인조명 계산 결과: 품목·금액 요약 + 시공 안내 + 설치 추가정보 */
function MlineResultView({ r, prices }: { r: MlineResult; prices: MlinePrices }) {
  const lines = toCartLines(r, prices);
  const isLine = (sku: string) => sku === `mline-${r.spec}-corner` || sku.startsWith(`mline-${r.spec}-line-`);
  const isSmps = (sku: string) => sku.startsWith("mline-smps-");
  const strip = `매립라인조명 ${r.spec} `;
  const smpsText = r.smpsCombo.items.map((it) => `${it.cap} W × ${fmt(it.count)}`).join(" + ");

  return (
    <>
      <SummaryCard
        label="총가격"
        total={r.grandTotal}
        rows={[
          { label: "계(매립라인조명)", amount: r.linesSubtotal, items: toItems(lines.filter((l) => isLine(l.sku)), strip), detail: "없음" },
          { label: "계(부속품)", amount: r.partsSubtotal, items: toItems(lines.filter((l) => !isLine(l.sku) && !isSmps(l.sku)), strip), detail: "없음" },
          { label: "계(SMPS)", amount: r.smpsSubtotal, items: toItems(lines.filter((l) => isSmps(l.sku)), "SMPS "), detail: "없음" },
        ]}
      />

      <Notice r={r} />

      <Section title="설치 추가정보">
        <div className="kv-list">
          <KV label="연결 방식" value={CONNECTION_LABELS[r.connectionType]} />
          <KV label="규격" value={r.spec} />
          <KV label="전원선 종류" value={WIRE_TYPE_LABELS[r.wireType]} />
          <KV label="총 소비전력" value={`${r.totalWatt.toFixed(0)} W`} />
          {r.smps.empty ? (
            <p className="section-note">라인조명이 없어 전원 공급 불필요</p>
          ) : (
            <KV label="권장 SMPS" value={`${smpsText} ${r.smps.overallText}`} />
          )}
        </div>
        {!r.smps.empty && r.smps.groups.length > 0 && (
          <div className="section-note">
            {r.smps.groups.map((g, gi) => (
              <Fragment key={gi}>
                {g.uses.map((u, ui) => (
                  <div key={ui}>
                    SMPS {g.title.replace(/^SMPS /, "").replace(/ × .*/, "")}
                    {g.uses.length > 1 ? ` #${ui + 1}` : ""} {u}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        )}
        {r.equalize && (
          <p className="text-warn">
            조명이 켜지는 속도, SMPS의 효율적인 시공을 위해 <strong>같은 와트수</strong>로 세팅해드립니다.
          </p>
        )}
      </Section>
    </>
  );
}

/**
 * 링크로 새로 들어올 때마다 처음 화면(방식 선택)부터 시작한다.
 * cacheComponents 사용 시 Next.js가 떠난 페이지의 상태를 보존하므로 bfcacheId를 key로 써서 초기화한다.
 * (브라우저 뒤로/앞으로 가기에서는 bfcacheId가 그대로라 입력하던 상태가 유지된다)
 */
export default function MlineCalculator(props: Props) {
  const { bfcacheId } = useRouter();
  return <MlineCalculatorInner key={bfcacheId} {...props} />;
}

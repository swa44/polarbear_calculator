"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/basePath";
import {
  calculate,
  CONNECTION_LABELS,
  fmt,
  type ConnectionType,
  type MlineResult,
  type Spec,
  type WireType,
} from "@/lib/calc/mline";
import "./mline.css";

const SAMPLE_IMAGES: Record<ConnectionType, string> = {
  serial: asset("/mline/sample-serial.jpg"),
  parallel: asset("/mline/sample-parallel.jpg"),
  square: asset("/mline/sample-square.jpg"),
};

const GUIDE_IMG_STYLE = {
  maxWidth: "100%",
  height: "auto",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
} as const;

const NOTICE_STYLE = {
  color: "red",
  fontSize: "0.9em",
  marginBottom: 16,
  padding: 12,
  background: "#fff3cd",
  borderRadius: 8,
  border: "1px solid #ffc107",
} as const;

type Lengths = { length: string; a: string; b: string };
const EMPTY_LENGTHS: Lengths = { length: "", a: "", b: "" };

export default function MlineCalculator() {
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const [spec, setSpec] = useState<Spec | "">("");
  const [wireType, setWireType] = useState<WireType | "">("");
  const [lengths, setLengths] = useState<Lengths>(EMPTY_LENGTHS);
  const [result, setResult] = useState<MlineResult | null>(null);
  /** 계산할 때마다 증가 → 결과 영역으로 스크롤 */
  const [calcSeq, setCalcSeq] = useState(0);

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
    });
    if (!r.ok) {
      // 원본: alert 후 해당 입력칸 포커스, 이전 결과는 그대로 둔다
      alert(r.message);
      const focusId =
        r.focus === "length" ? "lengthInput" : r.focus === "a" ? "lengthInputA" : r.focus === "b" ? "lengthInputB" : null;
      if (focusId) document.getElementById(focusId)?.focus();
      return;
    }
    setResult(r.result);
    setCalcSeq((n) => n + 1);
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

  useEffect(() => {
    if (calcSeq === 0) return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [calcSeq]);

  // ===== 처음으로 =====
  const reset = () => {
    setConnectionType(null);
    setSpec("");
    setWireType("");
    setLengths(EMPTY_LENGTHS);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const disabled = !spec;
  const ph = spec
    ? "설치공간의 길이를 입력해주세요. (예: 2800) — 100단위"
    : "먼저 규격(40/60)을 선택하세요.";

  const lengthInput = (id: string, key: keyof Lengths, label: string) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        type="number"
        id={id}
        placeholder={ph}
        min={100}
        step={100}
        disabled={disabled}
        value={lengths[key]}
        onChange={(e) => setLengths((l) => ({ ...l, [key]: e.target.value }))}
      />
    </>
  );

  return (
    <div className="mline page">
      <h1>매립라인조명 계산기</h1>

      {/* 설치 방식 선택 */}
      {connectionType === null && (
        <div id="connectChooser" style={{ maxWidth: 680, margin: "0 auto 24px", textAlign: "center" }}>
          <div className="rank-title" style={{ fontSize: 18, marginBottom: 10 }}>
            설치 방식 선택
          </div>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            먼저 연결 방식을 선택해주세요.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
            <button type="button" id="pickSerial" onClick={() => chooseConnection("serial")}>
              일자연결
            </button>
            <button type="button" id="pickParallel" onClick={() => chooseConnection("parallel")}>
              ㄱ자연결
            </button>
            <button type="button" id="pickSquare" onClick={() => chooseConnection("square")}>
              ㅁ자연결
            </button>
          </div>
        </div>
      )}

      {connectionType !== null && (
        <>
          {/* 선택된 방식 표시 */}
          <p id="connectionInfo" className="lead" style={{ textAlign: "center", marginBottom: 18 }}>
            <strong>선택한 설치 방식:</strong> <span>{CONNECTION_LABELS[connectionType]}</span>
          </p>

          {/* 입력 섹션 */}
          <div id="lengthSection" style={{ display: "block", maxWidth: 720, margin: "0 auto" }}>
            <div className="controls">
              {/* 규격 선택 가이드 이미지 */}
              <div className="full" style={{ textAlign: "center", margin: "16px 0 8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("/mline/spec-guide.jpg")} alt="규격 선택 가이드" style={GUIDE_IMG_STYLE} />
              </div>

              {/* 규격 선택 */}
              <label htmlFor="specSelect">규격 선택</label>
              <select
                id="specSelect"
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

              {/* 전원선 선택 가이드 이미지 */}
              <div className="full" style={{ textAlign: "center", margin: "16px 0 8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("/mline/wire-guide.jpg")} alt="전원선 선택 가이드" style={GUIDE_IMG_STYLE} />
              </div>

              {/* 전원선 선택 */}
              <label htmlFor="wiringSelect">전원선 종류</label>
              <select
                id="wiringSelect"
                disabled={!spec}
                value={wireType}
                onChange={(e) => setWireType(e.target.value as WireType | "")}
              >
                <option value="">선택 (AS·시공 편의상 10구 또는 혼합형 권장)</option>
                <option value="wire1">전원선 1구(2m)</option>
                <option value="wire10">전원선 10구(10.5m)</option>
                <option value="mixed">혼합형(5개 미만은 낱개형으로 계산)</option>
              </select>

              {/* 샘플 이미지 */}
              <div className="full" style={{ textAlign: "center", margin: "16px 0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SAMPLE_IMAGES[connectionType]} alt="설치 방식 샘플" style={GUIDE_IMG_STYLE} />
              </div>

              {/* 길이 입력칸 */}
              <div id="lengthInputsArea" className="full">
                {connectionType === "serial" && lengthInput("lengthInput", "length", "전체 길이 (mm)")}
                {connectionType === "parallel" && (
                  <>
                    {lengthInput("lengthInputA", "a", "A변 길이 (mm)")}
                    {lengthInput("lengthInputB", "b", "B변 길이 (mm)")}
                  </>
                )}
                {connectionType === "square" && (
                  <>
                    {lengthInput("lengthInputA", "a", "A변 길이 (mm) - 마주보는 2개 변")}
                    {lengthInput("lengthInputB", "b", "B변 길이 (mm) - 마주보는 2개 변")}
                  </>
                )}
              </div>

              {/* 액션 버튼 (세로 배열) */}
              <div id="actionButtons" className="full">
                <button type="button" onClick={doCalculate}>
                  계산하기
                </button>
                <button type="button" onClick={reset}>
                  처음으로
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 결과 영역 */}
      <div className="result">{result && <MlineResultView r={result} />}</div>
    </div>
  );
}

function Notice({ r }: { r: MlineResult }) {
  const n = r.notice;
  if (!n) return null;
  if (n.kind === "serial") {
    return (
      <div style={NOTICE_STYLE}>
        <strong>📏 시공 안내</strong>
        <br />
        수월한 시공을 위해 사이드캡 공간(양쪽 5mm, 총 10mm)을 고려하여 다음과 같이 설치 공간을 마련해 주세요.
        <br />
        입력하신 길이({fmt(n.L)}mm) + 10mm → <strong>{fmt(n.L + 10)}mm</strong>
      </div>
    );
  }
  if (n.kind === "square") {
    return (
      <div style={NOTICE_STYLE}>
        <strong>📏 시공 안내</strong>
        <br />
        수월한 시공을 위해 기역자형 길이 {n.corner}mm를 고려하여 다음과 같이 설치 공간을 마련해 주세요.
        <br />
        A변(2개): {fmt(n.A)}mm + {fmt(2 * n.corner)}mm → <strong>{fmt(n.aTot)}mm</strong> 각각
        <br />
        B변(2개): {fmt(n.B)}mm + {fmt(2 * n.corner)}mm → <strong>{fmt(n.bTot)}mm</strong> 각각
      </div>
    );
  }
  return (
    <div style={NOTICE_STYLE}>
      <strong>📏 시공 안내</strong>
      <br />
      수월한 시공을 위해 사이드캡 여유공간(각 변 5mm)과 기역자형 길이 {n.corner}mm를 고려하여 다음과 같이 설치
      공간을 마련해 주세요.
      <br />
      A변: {fmt(n.A)}mm + {fmt(n.add)}mm → <strong>{fmt(n.aTot)}mm</strong>
      <br />
      B변: {fmt(n.B)}mm + {fmt(n.add)}mm → <strong>{fmt(n.bTot)}mm</strong>
    </div>
  );
}

function MlineResultView({ r }: { r: MlineResult }) {
  const linesOrNone = r.linesArr.length ? r.linesArr : ["없음"];
  return (
    <>
      <Notice r={r} />

      {/* 사용한 라인조명 */}
      <div className="card">
        <div className="rank-title rank-title--plain">
          <strong>사용한 라인조명</strong>
        </div>
        <div className="list-plain">
          {linesOrNone.map((s, i) => (
            <span className="item" key={i}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 필요 부속품 */}
      <div className="card">
        <div className="rank-title rank-title--plain">
          <strong>필요 부속품</strong>
        </div>
        <div className="list-plain">
          {r.partsArr.map((s, i) => (
            <span className="item" key={i}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* SMPS 권장 */}
      <div className="card">
        <div className="rank-title">SMPS 권장</div>
        <div>{r.smps.totalWattText}</div>
        {r.smps.empty ? (
          <div className="muted">라인조명이 없어 전원 공급 불필요</div>
        ) : (
          <>
            {r.smps.groups.map((g, gi) => (
              <Fragment key={gi}>
                <div>{g.title}</div>
                {g.uses.map((u, ui) => (
                  <div className="muted" style={{ margin: "2px 0 6px" }} key={ui}>
                    {u}
                  </div>
                ))}
              </Fragment>
            ))}
            <div className="muted" style={{ marginTop: 4 }}>
              {r.smps.overallText}
            </div>
            {r.equalize && (
              <div style={{ color: "#c00", marginTop: 6, fontSize: "0.95em" }}>
                조명이 켜지는 속도, SMPS의 효율적인 시공을 위해 <strong>같은 와트수</strong>로 세팅해드립니다.
              </div>
            )}
          </>
        )}
      </div>

      {/* 합계 */}
      <div className="card totals">
        <div>계(매립라인조명): ₩{fmt(r.linesSubtotal)}</div>
        {linesOrNone.map((s, i) => (
          <div className="muted" key={i}>
            • {s}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>계(부속품): ₩{fmt(r.partsSubtotal)}</div>
        {r.partsArr.map((s, i) => (
          <div className="muted" key={i}>
            • {s}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>계(SMPS): ₩{fmt(r.smpsSubtotal)}</div>
        {r.smpsCombo.items.length > 0 ? (
          r.smpsCombo.items.map((it) => (
            <div className="muted" key={it.cap}>
              • SMPS {it.cap} W × {fmt(it.count)}개
            </div>
          ))
        ) : (
          <div className="muted">• 없음</div>
        )}

        <div className="total-line" style={{ marginTop: 10 }}>
          <strong>총가격:</strong> ₩{fmt(r.grandTotal)}
        </div>
      </div>
    </>
  );
}

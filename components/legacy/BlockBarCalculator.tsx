"use client";

import { useEffect, useState, type ReactNode } from "react";
import BlockBarResult from "./BlockBarResult";
import "./blockbar.css";
import {
  calculate,
  parseLength,
  type BlockBarCalc,
  type BlockBarProduct,
  type Connection,
} from "@/lib/calc/blockbar";

type Props = {
  /** 페이지 제목 (h1) */
  title: string;
  product: BlockBarProduct;
  /** 부속품 썸네일 (basePath 포함 경로) */
  thumbs: { mid: string; cover: string; corner: string };
  /** 하단 규격 안내문 */
  hint: ReactNode;
  /** 길이 초과 경고 모달 본문 */
  modalBody: ReactNode;
  /** 모달 하단 링크 버튼 (12V: 24V 블럭바 보러가기) */
  modalLink?: { href: string; label: string };
};

const PLACEHOLDER = "설치공간의 길이를 입력해주세요. (예: 2835)";

export default function BlockBarCalculator({
  title,
  product,
  thumbs,
  hint,
  modalBody,
  modalLink,
}: Props) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [mid, setMid] = useState(false);
  const [cover, setCover] = useState(false);
  const [corner, setCorner] = useState(false);
  const [result, setResult] = useState<BlockBarCalc | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const chooseConnection = (c: Connection) => {
    setConnection(c);
    setInputs(c === "serial" ? [""] : ["", ""]);
  };

  const onCalculate = () => {
    if (!connection) {
      alert("먼저 연결 방식을 선택해주세요. (직렬연결 또는 병렬연결)");
      return;
    }
    const r = calculate(product, connection, inputs.map(parseLength), { mid, cover, corner });
    if (!r.ok) {
      // 원본처럼 이전 결과는 그대로 둔다
      alert(r.message);
      return;
    }
    if (r.showModal) setModalOpen(true);
    setResult(r);
  };

  const goHome = () => {
    setResult(null);
    setInputs([]);
    setMid(false);
    setCover(false);
    setCorner(false);
    setModalOpen(false);
    setConnection(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ESC로 모달 닫기
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const lengthInput = (i: number, id: string, label: string) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        type="number"
        id={id}
        placeholder={PLACEHOLDER}
        min="1"
        step="1"
        value={inputs[i] ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          setInputs((prev) => prev.map((p, j) => (j === i ? v : p)));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCalculate();
          }
        }}
      />
    </>
  );

  return (
    <div className="bb">
      <div className="page">
        <h1>{title}</h1>

        {/* ===== 최초 연결 방식 선택 카드 ===== */}
        {connection === null && (
          <div
            className="card"
            style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 24px" }}
          >
            <div className="rank-title" style={{ fontSize: 18, marginBottom: 10 }}>
              설치 방식 선택
            </div>
            <p className="muted" style={{ margin: "0 0 12px" }}>
              먼저 연결 방식을 선택해주세요.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "stretch",
              }}
            >
              <button
                type="button"
                className="btn btn-primary bb-pick"
                style={{ padding: 12 }}
                onClick={() => chooseConnection("serial")}
              >
                직렬연결
              </button>
              <button
                type="button"
                className="btn bb-pick"
                style={{ padding: 12 }}
                onClick={() => chooseConnection("parallel")}
              >
                병렬연결
              </button>
            </div>
          </div>
        )}

        {connection !== null && (
          <>
            {/* 선택된 연결 방식 표시 */}
            <p className="lead" style={{ textAlign: "center", marginBottom: 30 }}>
              <strong>선택한 설치 방식:</strong>{" "}
              <span>{connection === "serial" ? "직렬연결" : "병렬연결"}</span>
            </p>

            {/* ===== 본 계산기 영역 ===== */}
            <div>
              <p style={{ textAlign: "center", marginBottom: 50 }} className="lead">
                <strong>
                  설치할 공간의 길이(mm)를 입력하고,
                  <br />
                  원하시는 부속품을 체크해 주세요.
                </strong>
              </p>

              <div className="controls">
                {/* 길이 입력(직렬: 단일 / 병렬: A,B) */}
                <div className="full">
                  {connection === "serial" ? (
                    lengthInput(0, "lengthInput", "전체 길이 (mm)")
                  ) : (
                    <>
                      {lengthInput(0, "lengthInputA", "A변 길이 (mm)")}
                      {lengthInput(1, "lengthInputB", "B변 길이 (mm)")}
                    </>
                  )}
                </div>

                {/* 부속품 체크박스 카드 */}
                <fieldset className="checkbox-group full">
                  <p
                    style={{
                      color: "red",
                      fontWeight: "bold",
                      margin: "8px 0",
                      textAlign: "left",
                    }}
                  >
                    ※ 선택하지 않을경우 기본세팅으로 계산됩니다.
                    <br />※ 필수 부속품은 자동으로 계산됩니다.
                  </p>

                  {/* 중간연결형: 체크 시 코너각대 비활성화 */}
                  <label className="checkbox-row with-thumb">
                    <span className="row-top">
                      <input
                        type="checkbox"
                        checked={mid}
                        onChange={(e) => {
                          setMid(e.target.checked);
                          if (e.target.checked) setCorner(false);
                        }}
                      />
                      <span className="label-text">
                        <strong>중간연결형</strong>
                        <span className="desc">가운데에 전원입력 가능</span>
                      </span>
                    </span>
                    <span className="acc-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbs.mid} alt="중간연결형 예시 이미지" loading="lazy" />
                    </span>
                  </label>

                  {/* 아크릴 커버 */}
                  <label className="checkbox-row with-thumb">
                    <span className="row-top">
                      <input
                        type="checkbox"
                        checked={cover}
                        onChange={(e) => setCover(e.target.checked)}
                      />
                      <span className="label-text">
                        <strong>아크릴 커버</strong>
                        <span className="desc">빛의 산란보조 및 먼지방지</span>
                      </span>
                    </span>
                    <span className="acc-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbs.cover} alt="아크릴 커버 예시 이미지" loading="lazy" />
                    </span>
                  </label>

                  {/* 코너각대 */}
                  <label className="checkbox-row with-thumb">
                    <span className="row-top">
                      <input
                        type="checkbox"
                        checked={corner}
                        disabled={mid}
                        onChange={(e) => setCorner(e.target.checked)}
                      />
                      <span className="label-text">
                        <strong>코너각대</strong>
                        <span className="desc">블럭바 45도 설치가이드</span>
                      </span>
                    </span>
                    <span className="acc-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbs.corner} alt="코너각대 예시 이미지" loading="lazy" />
                    </span>
                  </label>
                </fieldset>

                <div className="full">
                  <button type="button" onClick={onCalculate}>
                    계산하기
                  </button>
                </div>

                {/* 처음으로 버튼 */}
                <div className="full">
                  <button type="button" onClick={goHome}>
                    처음으로
                  </button>
                </div>
              </div>

              <p className="hint">{hint}</p>

              <div className="result">
                {result && <BlockBarResult product={product} result={result} />}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== 길이 초과 경고 모달 ===== */}
      {modalOpen && (
        <div className="bb-modal" role="dialog" aria-labelledby="lenModalTitle">
          <div className="modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal__dialog">
            <div className="modal__header">
              <h2 id="lenModalTitle">안내</h2>
            </div>
            <div className="modal__body">{modalBody}</div>
            <div className="modal__footer modal__footer--stack">
              {modalLink && (
                <a
                  style={{ marginTop: 10 }}
                  className="btn btn-primary btn-full"
                  href={modalLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {modalLink.label}
                </a>
              )}
              <button className="btn btn-full" type="button" onClick={() => setModalOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

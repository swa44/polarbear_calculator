"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { hideKeyboard } from "@/lib/hideKeyboard";
import ResultSheet, { useScrollLock } from "@/components/ResultSheet";
import BlockBarResult from "./BlockBarResult";
import { ChevronRight, PageHead } from "@/components/ui";
import {
  calculate,
  parseLength,
  toCartLines,
  type BlockBarCalc,
  type BlockBarProduct,
  type Connection,
} from "@/lib/calc/blockbar";
import type { Cafe24Map } from "@/lib/products";

type Props = {
  /** 페이지 제목 (h1) */
  title: string;
  product: BlockBarProduct;
  /** 카페24 옵션 매핑 (구매하러 가기) */
  cafe24: Cafe24Map;
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

function BlockBarCalculatorInner({
  title,
  product,
  thumbs,
  hint,
  modalBody,
  modalLink,
  cafe24,
}: Props) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [mid, setMid] = useState(false);
  const [cover, setCover] = useState(false);
  const [corner, setCorner] = useState(false);
  const [result, setResult] = useState<BlockBarCalc | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  useScrollLock(modalOpen);
  const [sheetOpen, setSheetOpen] = useState(false);

  const chooseConnection = (c: Connection) => {
    setConnection(c);
    setInputs(c === "serial" ? [""] : ["", ""]);
  };

  const onCalculate = () => {
    hideKeyboard();
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
    setSheetOpen(true);
  };

  const goHome = () => {
    setResult(null);
    setInputs([]);
    setMid(false);
    setCover(false);
    setCorner(false);
    setModalOpen(false);
    setSheetOpen(false);
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
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          type="number"
          id={id}
          className="input"
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
        <span className="unit">mm</span>
      </div>
    </div>
  );

  const accessory = (
    key: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    name: string,
    desc: string,
    thumb: string,
    disabled = false,
  ) => (
    <label className="option-card" key={key}>
      <span className="row-top">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="label-text">
          <strong>{name}</strong>
          <span className="desc">{desc}</span>
        </span>
      </span>
      <span className="acc-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={`${name} 예시 이미지`} loading="lazy" />
      </span>
    </label>
  );

  return (
    <div className="page calc-page">
      <PageHead title={title} />

      {/* ===== 최초 연결 방식 선택 ===== */}
      {connection === null && (
        <section className="card">
          <h2 className="section-title">설치 방식 선택</h2>
          <p className="section-desc">먼저 연결 방식을 선택해주세요.</p>
          <div className="option-list">
            <button type="button" className="option-btn" onClick={() => chooseConnection("serial")}>
              직렬연결
              <ChevronRight />
            </button>
            <button type="button" className="option-btn" onClick={() => chooseConnection("parallel")}>
              병렬연결
              <ChevronRight />
            </button>
          </div>
        </section>
      )}

      {connection !== null && (
        <>
          <section className="card">
            <div className="chip-stack">
              <span className="chip-label">선택한 설치 방식</span>
              <span className="chip">{connection === "serial" ? "직렬연결" : "병렬연결"}</span>
            </div>

            <h2 className="section-title" style={{ marginTop: 16 }}>
              설치할 공간의 길이(mm)를 입력하고, 원하시는 부속품을 체크해 주세요.
            </h2>

            {/* 길이 입력(직렬: 단일 / 병렬: A,B) */}
            <div className="fields">
              {connection === "serial" ? (
                lengthInput(0, "lengthInput", "전체 길이")
              ) : (
                <>
                  {lengthInput(0, "lengthInputA", "A변 길이")}
                  {lengthInput(1, "lengthInputB", "B변 길이")}
                </>
              )}
            </div>

            {/* 부속품 체크 카드 */}
            <fieldset className="option-group checkbox-group">
              <p className="note">
                ※ 선택하지 않을경우 기본세팅으로 계산됩니다.
                <br />※ 필수 부속품은 자동으로 계산됩니다.
              </p>
              {/* 중간연결형: 체크 시 코너각대 비활성화 */}
              {accessory(
                "mid",
                mid,
                (v) => {
                  setMid(v);
                  if (v) setCorner(false);
                },
                "중간연결형",
                "가운데에 전원입력 가능",
                thumbs.mid,
              )}
              {accessory("cover", cover, setCover, "아크릴 커버", "빛의 산란보조 및 먼지방지", thumbs.cover)}
              {accessory("corner", corner, setCorner, "코너각대", "블럭바 45도 설치가이드", thumbs.corner, mid)}
            </fieldset>

            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={onCalculate}>
                계산하기
              </button>
              {result && !sheetOpen && (
                <button type="button" className="btn btn-secondary" onClick={() => setSheetOpen(true)}>
                  계산 결과 다시 보기
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={goHome}>
                처음으로
              </button>
            </div>
          </section>

          <p className="hint">{hint}</p>

          <ResultSheet
            open={sheetOpen && !!result}
            onClose={() => setSheetOpen(false)}
            purchase={{ lines: result ? toCartLines(product, result) : [], map: cafe24 }}
          >
            <div className="result">{result && <BlockBarResult product={product} result={result} />}</div>
          </ResultSheet>
        </>
      )}

      {/* ===== 길이 초과 경고 모달 ===== */}
      {modalOpen && (
        <div className="bb-modal" role="dialog" aria-labelledby="lenModalTitle">
          <div className="modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal__dialog">
            <div className="modal__header">
              <h2 id="lenModalTitle">안내</h2>
            </div>
            <div className="modal__body">{modalBody}</div>
            <div className="modal__footer">
              {modalLink && (
                <a className="btn btn-primary" href={modalLink.href} target="_blank" rel="noopener noreferrer">
                  {modalLink.label}
                </a>
              )}
              <button className="btn btn-secondary" type="button" onClick={() => setModalOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 링크로 새로 들어올 때마다 처음 화면(방식 선택)부터 시작한다.
 * cacheComponents 사용 시 Next.js가 떠난 페이지의 상태를 보존하므로 bfcacheId를 key로 써서 초기화한다.
 * (브라우저 뒤로/앞으로 가기에서는 bfcacheId가 그대로라 입력하던 상태가 유지된다)
 */
export default function BlockBarCalculator(props: Props) {
  const { bfcacheId } = useRouter();
  return <BlockBarCalculatorInner key={bfcacheId} {...props} />;
}

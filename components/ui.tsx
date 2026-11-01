/** 오른쪽 화살표 (버튼 접근성 이름에 포함되지 않도록 aria-hidden) */
export function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 5 5 5-5 5" />
    </svg>
  );
}

export function PageHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </header>
  );
}

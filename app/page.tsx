import Link from "next/link";
import { CALCULATORS } from "@/lib/calculators";

export default function Home() {
  return (
    <div className="wrapper">
      <h1>폴라베어 자동계산기</h1>
      <div className="card" style={{ maxWidth: 680, margin: "18px auto" }}>
        <div className="rank-title" style={{ fontSize: 18, marginBottom: 10 }}>
          계산기 선택
        </div>
        <div className="stack-vert">
          {CALCULATORS.map((c) =>
            c.ready ? (
              <Link key={c.slug} href={`/${c.slug}`} className="pickbtn" style={{ textAlign: "center", textDecoration: "none" }}>
                {c.name}
              </Link>
            ) : (
              <span key={c.slug} className="pickbtn" style={{ textAlign: "center", opacity: 0.4, cursor: "default" }}>
                {c.name} (준비 중)
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

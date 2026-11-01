import Link from "next/link";
import { ChevronRight } from "@/components/ui";
import { CALCULATORS } from "@/lib/calculators";

const GROUPS = [...new Set(CALCULATORS.map((c) => c.group))];

export default function Home() {
  return (
    <div className="page page-wide">
      <section className="hero">
        <h1>인테리어 조명 자동계산기</h1>
        <p>설치할 공간의 길이만 입력하면 필요한 수량과 예상 비용을 바로 계산해 드립니다.</p>
      </section>

      {GROUPS.map((group) => (
        <section className="calc-group" key={group}>
          <h2>{group}</h2>
          <div className="calc-grid">
            {CALCULATORS.filter((c) => c.group === group).map((c) => {
              const body = (
                <>
                  <span className="calc-badge">{c.badge}</span>
                  <span className="body">
                    <span className="name block">{c.ready ? c.name : `${c.name} (준비 중)`}</span>
                    <span className="desc block">{c.desc}</span>
                  </span>
                  <ChevronRight />
                </>
              );
              return c.ready ? (
                <Link key={c.slug} href={`/${c.slug}`} className="calc-card">
                  {body}
                </Link>
              ) : (
                <div key={c.slug} className="calc-card disabled">
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

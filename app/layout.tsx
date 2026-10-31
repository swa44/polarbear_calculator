import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "@/components/legacy/legacy.css";

export const metadata: Metadata = {
  title: {
    default: "폴라베어 자동계산기",
    template: "%s | 폴라베어 자동계산기",
  },
  description: "주식회사 폴라베어 제작 및 배포",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="legacy min-h-screen">
        {/* 공통 헤더 */}
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "1rem",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 800,
              fontSize: "1.4rem",
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            POLARBEAR Calculator
          </Link>
        </header>

        <main>{children}</main>

        {/* 공통 푸터 */}
        <footer
          style={{
            marginTop: 40,
            padding: "30px 20px",
            textAlign: "center",
            background: "#f9fafb",
            color: "#888",
            borderTop: "1px solid #eee",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ marginBottom: 8 }}>&copy; 2024 (주)폴라베어. All rights reserved.</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            본 계산 결과는 참고용이며 실제 시공 환경에 따라 다를 수 있습니다.
          </p>
        </footer>
      </body>
    </html>
  );
}

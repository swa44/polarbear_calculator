import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { asset } from "@/lib/basePath";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "폴라베어 자동계산기",
    template: "%s | 폴라베어 자동계산기",
  },
  description: "주식회사 폴라베어 제작 및 배포",
  applicationName: "폴라베어 자동계산기",
  appleWebApp: { capable: true, title: "폴라베어 계산기", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/logo.png")} alt="폴라베어" />
              <span>
                폴라베어 <span className="brand-sub">자동계산기</span>
              </span>
            </Link>
            <Link href="/" className="header-link">
              전체 계산기
            </Link>
          </div>
        </header>

        <main className="site-main flex-1">{children}</main>

        <footer className="site-footer">
          <p>&copy; (주)폴라베어. All rights reserved.</p>
          <p>본 계산 결과는 참고용이며 실제 시공 환경에 따라 다를 수 있습니다.</p>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}

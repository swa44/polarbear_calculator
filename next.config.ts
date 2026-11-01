import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/basePath";

const nextConfig: NextConfig = {
  // 최종 주소: 계산기.폴라베어.kr/... (BASE_PATH 비어 있음)
  basePath: BASE_PATH,
  // 개발 서버를 같은 와이파이의 폰/다른 PC에서 IP로 열 때 JS가 차단되지 않도록 허용
  allowedDevOrigins: ["192.168.*.*"],
  cacheComponents: true,
  // 서비스 워커는 항상 최신본을 받도록 브라우저 캐시 금지
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

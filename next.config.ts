import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/basePath";

const nextConfig: NextConfig = {
  // 최종 주소: 계산기.폴라베어.kr/... (BASE_PATH 비어 있음)
  basePath: BASE_PATH,
  // 개발 서버를 같은 와이파이의 폰/다른 PC에서 IP로 열 때 JS가 차단되지 않도록 허용
  allowedDevOrigins: ["192.168.*.*"],
  cacheComponents: true,
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

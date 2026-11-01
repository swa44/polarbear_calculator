import type { MetadataRoute } from "next";
import { asset } from "@/lib/basePath";

/** 홈 화면에 추가(PWA) 정보 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "폴라베어 자동계산기",
    short_name: "폴라베어 계산기",
    description: "T5·T3·블럭바·매립라인조명 필요 수량과 비용을 자동으로 계산합니다.",
    lang: "ko",
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: asset("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

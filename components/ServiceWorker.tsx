"use client";

import { useEffect } from "react";
import { asset } from "@/lib/basePath";

/** 서비스 워커 등록 (배포 환경에서만. 개발 중에는 캐시 때문에 헷갈리지 않도록 끈다) */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/"), updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t3 } from "@/lib/calc/t3";
import { applyTubePrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "T3 자동계산기",
  openGraph: { title: "폴라베어 T3 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [product, cafe24] = await Promise.all([
    getPrices("t3").then((prices) => applyTubePrices(t3, prices)),
    getCafe24Map("t3"),
  ]);

  return (
    <TubeCalculator
      title="T3 자동계산기"
      product={product}
      cafe24={cafe24}
      intro={{ kind: "image", src: asset("/t3/t3main.webp"), alt: "T3 설명 이미지" }}
    />
  );
}


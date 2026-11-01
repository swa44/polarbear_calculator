import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5nu } from "@/lib/calc/t5nu";
import { applyTubePrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "누빔 T5 자동계산기",
  openGraph: { title: "폴라베어 누빔 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [product, cafe24] = await Promise.all([
    getPrices("t5nu").then((prices) => applyTubePrices(t5nu, prices)),
    getCafe24Map("t5nu"),
  ]);

  return (
    <TubeCalculator
      title="누빔T5 자동계산기"
      product={product}
      cafe24={cafe24}
      intro={{ kind: "image", src: asset("/t5nu/t5numain.webp"), alt: "누빔 T5 설명 이미지" }}
    />
  );
}


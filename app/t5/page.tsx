import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5 } from "@/lib/calc/t5";
import { applyTubePrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "남영 디밍 T5 자동계산기",
  openGraph: { title: "폴라베어 남영 디밍 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [product, cafe24] = await Promise.all([
    getPrices("t5").then((prices) => applyTubePrices(t5, prices)),
    getCafe24Map("t5"),
  ]);

  return (
    <TubeCalculator
      title="남영 디밍T5 자동계산기"
      product={product}
      cafe24={cafe24}
      intro={{ kind: "image", src: asset("/t5/t5nammain.webp"), alt: "남영 디밍 T5 설명 이미지" }}
    />
  );
}


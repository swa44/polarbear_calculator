import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5 } from "@/lib/calc/t5";
import { addonsFrom, applyTubePrices, getCafe24Map, getPrices } from "@/lib/products";

const JACKS = [
  { sku: "t5-namyoung-jack-30", name: "양방향 연결잭 30cm" },
  { sku: "t5-namyoung-jack-60", name: "양방향 연결잭 60cm" },
  { sku: "t5-namyoung-jack-120", name: "양방향 연결잭 1.2M" },
];

export const metadata: Metadata = {
  title: "남영 디밍 T5 자동계산기",
  openGraph: { title: "폴라베어 남영 디밍 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [prices, cafe24] = await Promise.all([getPrices("t5"), getCafe24Map("t5")]);
  const product = applyTubePrices(t5, prices);

  return (
    <TubeCalculator
      title="남영 디밍T5 자동계산기"
      product={product}
      cafe24={cafe24}
      addons={addonsFrom(prices, JACKS)}
      intro={{ kind: "image", src: asset("/t5/t5nammain.webp"), alt: "남영 디밍 T5 설명 이미지" }}
    />
  );
}


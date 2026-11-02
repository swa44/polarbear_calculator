import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t3 } from "@/lib/calc/t3";
import { addonsFrom, applyTubePrices, getCafe24Map, getPrices, SENSOR_GROUP, tubeAddonDefs } from "@/lib/products";

export const metadata: Metadata = {
  title: "T3 자동계산기",
  openGraph: { title: "폴라베어 T3 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [prices, cafe24] = await Promise.all([getPrices("t3"), getCafe24Map("t3")]);
  const product = applyTubePrices(t3, prices);

  return (
    <TubeCalculator
      title="T3 자동계산기"
      product={product}
      cafe24={cafe24}
      addons={addonsFrom(prices, [
        ...tubeAddonDefs("t3"),
        { sku: "t3-sensor-mw", name: "마이크로파센서", group: SENSOR_GROUP },
      ])}
      intro={{ kind: "image", src: asset("/t3/t3main.webp"), alt: "T3 설명 이미지" }}
    />
  );
}


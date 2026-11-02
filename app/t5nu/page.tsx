import type { Metadata } from "next";
import TubeCalculator from "@/components/calculators/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5nu } from "@/lib/calc/t5nu";
import { addonsFrom, applyTubePrices, getCafe24Map, getPrices, SENSOR_GROUP, tubeAddonDefs } from "@/lib/products";

export const metadata: Metadata = {
  title: "누빔 T5 자동계산기",
  openGraph: { title: "폴라베어 누빔 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [prices, cafe24] = await Promise.all([getPrices("t5nu"), getCafe24Map("t5nu")]);
  const product = applyTubePrices(t5nu, prices);

  return (
    <TubeCalculator
      title="누빔T5 자동계산기"
      product={product}
      cafe24={cafe24}
      addons={addonsFrom(prices, [
        ...tubeAddonDefs("t5-nubim"),
        { sku: "t5-nubim-switch", name: "전원스위치", group: SENSOR_GROUP },
        { sku: "t5-nubim-sensor", name: "동작감지센서", group: SENSOR_GROUP },
      ])}
      intro={{ kind: "image", src: asset("/t5nu/t5numain.webp"), alt: "누빔 T5 설명 이미지" }}
    />
  );
}


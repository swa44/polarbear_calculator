import type { Metadata } from "next";
import TubeCalculator from "@/components/legacy/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t3 } from "@/lib/calc/t3";

export const metadata: Metadata = {
  title: "T3 자동계산기",
  openGraph: { title: "폴라베어 T3 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default function Page() {
  return (
    <TubeCalculator
      title="폴라베어 T3 자동계산기"
      product={t3}
      intro={{ kind: "youtube", videoId: "61PrLZLHEvY" }}
      typeImages={{
        straight: asset("/t3/t3measure_D.jpg"),
        L: asset("/t3/t3measure_R.jpg"),
        square: asset("/t3/t3measure_M.jpg"),
      }}
    />
  );
}

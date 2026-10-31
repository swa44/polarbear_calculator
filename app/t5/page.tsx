import type { Metadata } from "next";
import TubeCalculator from "@/components/legacy/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5 } from "@/lib/calc/t5";

export const metadata: Metadata = {
  title: "남영 T5 자동계산기",
  openGraph: { title: "폴라베어 남영 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default function Page() {
  return (
    <TubeCalculator
      title="폴라베어 남영T5 자동계산기"
      product={t5}
      intro={{ kind: "youtube", videoId: "61PrLZLHEvY" }}
      typeImages={{
        straight: asset("/t5/t5measure_D.jpg"),
        L: asset("/t5/t5measure_R.jpg"),
        square: asset("/t5/t5measure_M.jpg"),
      }}
    />
  );
}


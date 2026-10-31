import type { Metadata } from "next";
import TubeCalculator from "@/components/legacy/TubeCalculator";
import { asset } from "@/lib/basePath";
import { t5nu } from "@/lib/calc/t5nu";

export const metadata: Metadata = {
  title: "누빔 T5 자동계산기",
  openGraph: { title: "폴라베어 누빔 T5 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default function Page() {
  return (
    <TubeCalculator
      title="폴라베어 누빔T5 자동계산기"
      product={t5nu}
      intro={{ kind: "image", src: asset("/t5nu/t5numain.jpg"), alt: "누빔 T5 설명 이미지" }}
      typeImages={{
        straight: asset("/t5nu/t5measure_D.jpg"),
        L: asset("/t5nu/t5measure_R.jpg"),
        square: asset("/t5nu/t5measure_M.jpg"),
      }}
    />
  );
}


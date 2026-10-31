import type { Metadata } from "next";
import MlineCalculator from "@/components/legacy/MlineCalculator";

export const metadata: Metadata = {
  title: "매립라인조명 자동계산기",
  openGraph: { title: "폴라베어 매립라인조명 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default function Page() {
  return <MlineCalculator />;
}

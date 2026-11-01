import type { Metadata } from "next";
import MlineCalculator from "@/components/calculators/MlineCalculator";
import { applyMlinePrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "매립라인조명 자동계산기",
  openGraph: { title: "폴라베어 매립라인조명 자동계산기", description: "주식회사 폴라베어 제작 및 배포" },
};

export default async function Page() {
  const [prices, cafe24] = await Promise.all([getPrices("mline").then(applyMlinePrices), getCafe24Map("mline")]);
  return <MlineCalculator prices={prices} cafe24={cafe24} />;
}

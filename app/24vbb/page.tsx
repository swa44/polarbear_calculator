import type { Metadata } from "next";
import BlockBarCalculator from "@/components/calculators/BlockBarCalculator";
import { asset } from "@/lib/basePath";
import { bb24 } from "@/lib/calc/bb24";
import { applyBlockBarPrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "24V블럭바 자동계산기",
  openGraph: {
    title: "폴라베어 24V블럭바 자동계산기",
    description: "주식회사 폴라베어 제작 및 배포",
  },
};

export default async function Page() {
  const [product, cafe24] = await Promise.all([
    getPrices("24vbb").then((prices) => applyBlockBarPrices(bb24, prices)),
    getCafe24Map("24vbb"),
  ]);

  return (
    <BlockBarCalculator
      title="블럭바 24V 계산기"
      product={product}
      cafe24={cafe24}
      thumbs={{
        mid: asset("/24vbb/thumb_n1.png"),
        cover: asset("/24vbb/thumb_2.png"),
        corner: asset("/24vbb/thumb_3.png"),
      }}
      hint={
        <>
          ※ 규격: 100, 200, 300, 400, 500, 1000mm (무제한 사용, 50mm 제외)
          <br />※ 남는 공간은 기본적으로 <strong>40~99mm</strong>가 되도록 우선 맞추며, 불가능한
          경우 <strong>100~140mm</strong> 범위로 맞춥니다.
        </>
      }
      modalBody={
        <>
          <p style={{ margin: "0 0 10px" }}>
            <strong>5M 이상 직렬 연결은 빛 흐려짐 등의 이유로 권장하지 않습니다.</strong>
          </p>
          <p style={{ margin: 0 }}>병렬 연결을 고려해 주세요.</p>
        </>
      }
    />
  );
}

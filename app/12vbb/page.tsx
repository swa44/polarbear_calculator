import type { Metadata } from "next";
import BlockBarCalculator from "@/components/calculators/BlockBarCalculator";
import { asset } from "@/lib/basePath";
import { bb12 } from "@/lib/calc/bb12";
import { applyBlockBarPrices, getCafe24Map, getPrices } from "@/lib/products";

export const metadata: Metadata = {
  title: "12V블럭바 자동계산기",
  openGraph: {
    title: "폴라베어 12V블럭바 자동계산기",
    description: "주식회사 폴라베어 제작 및 배포",
  },
};

export default async function Page() {
  const [product, cafe24] = await Promise.all([
    getPrices("12vbb").then((prices) => applyBlockBarPrices(bb12, prices)),
    getCafe24Map("12vbb"),
  ]);

  return (
    <BlockBarCalculator
      title="블럭바 12V 계산기"
      product={product}
      cafe24={cafe24}
      thumbs={{
        mid: asset("/12vbb/thumb_n1.png"),
        cover: asset("/12vbb/thumb_2.png"),
        corner: asset("/12vbb/thumb_3.png"),
      }}
      hint={
        <>
          ※ 규격: 50, 100, 200, 300, 400, 500, 1000mm (무제한 사용)
          <br />※ 남는 공간은 규격 특성상 <strong>항상 50~99mm</strong>가 됩니다.
        </>
      }
      modalBody={
        <>
          <p style={{ margin: "0 0 10px" }}>
            <strong>3M이상 직렬연결은 12V 특성상 빛 흐려짐으로 인해 권장하지 않습니다.</strong>
          </p>
          <p style={{ margin: 0 }}>
            병렬연결 하시거나, <strong>24V 제품</strong>을 이용해주세요.
          </p>
        </>
      }
      modalLink={{
        href: "https://mkt.shopping.naver.com/link/686e1fe1f8b0c76a553b55c0",
        label: "24V 블럭바 보러가기",
      }}
    />
  );
}

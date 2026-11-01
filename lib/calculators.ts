/** 계산기 목록. 아직 이식 안 된 계산기는 ready: false */
export const CALCULATORS = [
  { slug: "t5", name: "남영 디밍 T5 자동계산기", badge: "T5", group: "T5 · T3 간접조명", desc: "일자·ㄱ자·ㅁ자 간접박스 조합 계산", ready: true },
  { slug: "t5nu", name: "누빔 T5 자동계산기", badge: "T5", group: "T5 · T3 간접조명", desc: "1500mm 규격 포함 조합 계산", ready: true },
  { slug: "t3", name: "T3 자동계산기", badge: "T3", group: "T5 · T3 간접조명", desc: "슬림 T3 간접조명 조합 계산", ready: true },
  { slug: "12vbb", name: "12V 블럭바 자동계산기", badge: "12V", group: "블럭바", desc: "블럭바·SMPS·부속품 자동 계산", ready: true },
  { slug: "24vbb", name: "24V 블럭바 자동계산기", badge: "24V", group: "블럭바", desc: "긴 구간 직렬 설치에 적합", ready: true },
  { slug: "mline", name: "매립 라인조명 자동계산기", badge: "LINE", group: "라인조명", desc: "40/60 규격, 커버·전원선·SMPS 포함", ready: true },
] as const;

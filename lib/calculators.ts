/** 계산기 목록. 아직 이식 안 된 계산기는 ready: false */
export const CALCULATORS = [
  { slug: "t5", name: "남영 T5 자동계산기", ready: true },
  { slug: "t5nu", name: "누빔 T5 자동계산기", ready: true },
  { slug: "t3", name: "T3 자동계산기", ready: false },
  { slug: "12vbb", name: "12V 블럭바 자동계산기", ready: false },
  { slug: "24vbb", name: "24V 블럭바 자동계산기", ready: false },
  { slug: "mline", name: "매립 라인조명 자동계산기", ready: false },
] as const;


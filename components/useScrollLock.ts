"use client";

import { useEffect } from "react";

let lockCount = 0;

/** 배경 스크롤 잠금. 모달이 겹쳐 열려도 마지막 모달이 닫힐 때만 풀린다. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = "";
    };
  }, [locked]);
}

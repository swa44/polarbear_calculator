"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedY = 0;

/**
 * 배경 스크롤 잠금. 모달이 겹쳐 열려도 마지막 모달이 닫힐 때만 풀린다.
 * iOS 사파리는 body overflow:hidden 만으로는 뒤가 스크롤되므로 body 를 고정하고 위치를 되돌린다.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (lockCount++ === 0) {
      savedY = window.scrollY;
      const b = document.body.style;
      b.position = "fixed";
      b.top = `-${savedY}px`;
      b.left = "0";
      b.right = "0";
      b.overflow = "hidden";
    }
    return () => {
      if (--lockCount > 0) return;
      const b = document.body.style;
      b.position = b.top = b.left = b.right = b.overflow = "";
      window.scrollTo(0, savedY);
    };
  }, [locked]);
}

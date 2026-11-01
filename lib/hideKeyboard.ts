/** 입력칸 포커스를 빼서 모바일 키패드를 내린다 (계산하기·키패드 이동/완료 버튼) */
export function hideKeyboard() {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.blur();
}

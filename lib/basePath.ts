/** 하위 경로에 배포할 때만 설정 (예: "/calculator"). 계산기.폴라베어.kr 은 루트에 배포하므로 비워둔다 */
export const BASE_PATH = "";

/** public/ 폴더 파일 경로에 basePath를 붙인다. (<img>, next/image 등은 자동으로 붙지 않음) */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}


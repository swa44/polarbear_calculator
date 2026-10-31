export const BASE_PATH = "/calculator";

/** public/ 폴더 파일 경로에 basePath를 붙인다. (<img>, next/image 등은 자동으로 붙지 않음) */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}


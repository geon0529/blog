import { redirect } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
/**
 * 인코딩된 메시지를 쿼리 파라미터로 포함하여 지정된 경로로 리다이렉트합니다.
 * @param {('error' | 'success')} type - 메시지 타입, 'error' 또는 'success' 중 하나.
 * @param {string} path - 리다이렉트할 경로.
 * @param {string} message - 인코딩되어 쿼리 파라미터로 추가될 메시지.
 * @returns {never} 이 함수는 리다이렉트를 발생시키므로 반환값이 없습니다.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

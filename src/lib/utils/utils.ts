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
export const encodedRedirect = (
  type: "error" | "success",
  path: string,
  message: string
) => {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/**
 * @description 전달받은 인수들에 대해 AND 연산을 수행
 * 첫 번째 falsy 값을 만나면 해당 값을 반환하고, 모든 값이 truthy면 마지막 값을 반환
 * @param {...any} args - AND 연산을 수행할 값들
 * @returns {any} 첫 번째 falsy 값 또는 마지막 값
 * @example
 * andPipe(1, 'test', true, [], {}) // {} (모든 값이 truthy이므로 마지막 값)
 * andPipe(1, 0, true) // 0 (첫 번째 falsy 값)
 * andPipe(true, false, 'hello') // false (첫 번째 falsy 값)
 */
export const andPipe = (...args: any[]) => {
  return args.reduce((acc, current) => acc && current);
};

/**
 * @description 전달받은 인수들에 대해 OR 연산을 수행
 * 첫 번째 truthy 값을 만나면 해당 값을 반환하고, 모든 값이 falsy면 마지막 값을 반환
 * @param {...any} args - OR 연산을 수행할 값들
 * @returns {any} 첫 번째 truthy 값 또는 마지막 값
 * @example
 * orPipe(0, '', 'hello', true) // 'hello' (첫 번째 truthy 값)
 * orPipe(false, 0, null, undefined) // undefined (모든 값이 falsy이므로 마지막 값)
 * orPipe('first', 'second') // 'first' (첫 번째 truthy 값)
 */
export const orPipe = (...args: any[]) => {
  return args.reduce((acc, current) => acc || current);
};

/**
 * @description 세션이 있어야 진입 가능한 라우트 목록
 */
export const protectedRoutes = ["/protected"];

/**
 * @description 세션이 없어야 진입 가능한 라우트 목록
 */
export const guestOnlyRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

/**
 * @description 로그인 한 유저만 접근 가능한 주소인지 여부를 반환
 * @param {string} url 검사할 url
 * @returns {boolean}
 */
export const isProtectedRoutes = (url: string) => {
  return protectedRoutes.some((route) => url.startsWith(route));
};

/**
 * @description guest만 접근 가능한 주소인지 여부를 반환
 * @param {string} url 검사할 url
 * @returns {boolean}
 */
export const isGuestOnlyRoutes = (url: string) => {
  return guestOnlyRoutes.some((route) => url.startsWith(route));
};

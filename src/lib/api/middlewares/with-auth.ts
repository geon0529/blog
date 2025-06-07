import { NextResponse } from "next/server";

/**
 * 인증이 필요한 API 핸들러를 위한 미들웨어
 * 자동으로 사용자 인증을 확인하고 user 객체를 첫 번째 파라미터로 주입
 */
export function withAuthMiddleware<T extends any[]>(
  handler: (user: any, ...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    // 동적 import를 사용하여 순환 참조 방지
    const { CommonService } = await import("@/services/common/server");

    // 현재 사용자 인증 확인
    const user = await CommonService.getCurrentUser();

    // user 객체를 첫 번째 파라미터로 주입하여 핸들러 실행
    return handler(user, ...args);
  };
}

/**
 * 에러 처리 + 인증을 모두 적용하는 편의 함수
 * withAuthMiddleware와 동일하지만 더 명확한 이름
 */
export const withAuth = withAuthMiddleware;

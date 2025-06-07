// lib/api/error-handler.ts
import {
  ApiError,
  errorToResponse,
  handleDomainError,
  zodErrorToResponse,
} from "@/lib/api/errors/error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * 통합 에러 처리 함수
 * 모든 API에서 공통으로 사용되는 에러 처리 로직을 하나로 통합
 */
export function handleApiError(error: unknown): NextResponse {
  // 1. Api 정의 에러 error.ts
  if (error instanceof ApiError) {
    return errorToResponse(error);
  }

  // 2. Zod 검증 에러 처리
  if (error instanceof z.ZodError) {
    return zodErrorToResponse(error);
  }

  // 3. 도메인 에러를 API 에러로 변환 후 응답
  try {
    handleDomainError(error);
  } catch (apiError) {
    return errorToResponse(apiError as ApiError);
  }
}

/**
 * API 핸들러를 감싸는 래퍼 함수
 * try-catch를 자동으로 처리하고 에러를 통합 핸들러로 전달
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

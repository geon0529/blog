// ================================================================
// 서버 특화 에러 클래스들 (데이터베이스 관련)
// ================================================================

import { DatabaseError, NotFoundError } from "@/lib/api/errors/domain-error";
import { NextResponse } from "next/server";
import z from "zod";

/**
 * API에서 반환되는 에러 응답 타입
 */
export interface ApiErrorResponse {
  error: string; // 에러 메시지
  details?: string; // 추가 상세 정보
  code?: ErrorCode; // 에러 코드 (VALIDATION_ERROR, NOT_FOUND 등)
  field?: string; // 유효성 검증 실패한 필드명
  timestamp?: string; // 에러 발생 시간
}

/**
 * 유효성 검증 에러 (여러 필드)
 */
export interface ValidationErrorResponse {
  error: string;
  code: "VALIDATION_ERROR";
  details: {
    field: string;
    message: string;
  }[];
}

/**
 * 에러 코드
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "RATE_LIMIT"
  | "UNKNOWN_ERROR";

/**
 * 커스텀 에러 클래스 - API 에러 정보를 포함
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: ErrorCode;
  public readonly field?: string;
  public readonly details?: string;

  constructor(
    message: string,
    status: number,
    code?: ErrorCode,
    field?: string,
    details?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
    this.details = details;
  }

  /**
   * API 응답에서 ApiError 생성
   */
  static fromResponse(
    errorResponse: ApiErrorResponse,
    status: number
  ): ApiError {
    return new ApiError(
      errorResponse.error,
      status,
      errorResponse.code,
      errorResponse.field,
      errorResponse.details
    );
  }
}

// ================================================================
// 에러 핸들링 헬퍼 함수들
// ================================================================

/**
 * 개선된 에러 처리 헬퍼 함수
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    // JSON 파싱 실패시 기본 에러
    errorData = {
      error: `HTTP ${response.status}: ${response.statusText}`,
      code: "UNKNOWN_ERROR",
    };
  }

  throw ApiError.fromResponse(errorData, response.status);
}

/**
 * 에러 타입 가드
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ApiError {
  return isApiError(error) && error.code === "VALIDATION_ERROR";
}

/**
 * 일반적인 API 에러 응답들
 */
export const CommonErrors = {
  VALIDATION_ERROR: (field: string, message: string): ApiErrorResponse => ({
    error: message,
    code: "VALIDATION_ERROR",
    field,
  }),

  NOT_FOUND: (resource: string = "리소스"): ApiErrorResponse => ({
    error: `${resource}를 찾을 수 없습니다.`,
    code: "NOT_FOUND",
  }),

  UNAUTHORIZED: (): ApiErrorResponse => ({
    error: "인증이 필요합니다.",
    code: "UNAUTHORIZED",
  }),

  FORBIDDEN: (): ApiErrorResponse => ({
    error: "권한이 없습니다.",
    code: "FORBIDDEN",
  }),

  INTERNAL_ERROR: (): ApiErrorResponse => ({
    error: "서버 내부 오류가 발생했습니다.",
    code: "INTERNAL_ERROR",
  }),

  RATE_LIMIT: (): ApiErrorResponse => ({
    error: "요청 제한을 초과했습니다.",
    code: "RATE_LIMIT",
  }),
} as const;

/**
 * 도메인 에러를 API 에러로 변환
 */
export function handleDomainError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new ApiError(error.message, 404, "NOT_FOUND");
  }

  if (error instanceof DatabaseError) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR");
  }

  // 예상치 못한 에러는 내부 서버 오류로 처리
  console.error("Unexpected error:", error);
  throw new ApiError("서버 내부 오류가 발생했습니다.", 500, "INTERNAL_ERROR");
}

/**
 * API 에러를 HTTP 응답으로 변환
 */
export function errorToResponse(error: ApiError): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: error.message,
    code: error.code,
    field: error.field,
    details: error.details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(errorResponse, { status: error.status });
}

/**
 * Zod 에러를 ValidationErrorResponse로 변환
 */
export function zodErrorToResponse(zodError: z.ZodError): NextResponse {
  const errorResponse: ValidationErrorResponse = {
    error: "요청 데이터가 올바르지 않습니다.",
    code: "VALIDATION_ERROR",
    details: zodError.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    })),
  };

  return NextResponse.json(errorResponse, { status: 400 });
}

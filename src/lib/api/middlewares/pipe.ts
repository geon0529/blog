// lib/api/pipe.ts
import { NextResponse } from "next/server";

/**
 * API 핸들러 타입
 */
type ApiHandler<T extends any[] = any[]> = (
  ...args: T
) => Promise<NextResponse>;

/**
 * 미들웨어 타입
 */
type Middleware<T extends any[] = any[]> = (
  handler: ApiHandler<T>
) => ApiHandler<T>;

/**
 * 여러 미들웨어를 순서대로 조합하는 파이프 함수
 * 첫 번째부터 마지막까지 순서대로 적용됨 (왼쪽에서 오른쪽으로)
 */
export default function pipe<T extends any[]>(
  ...middlewares: Middleware<T>[]
): Middleware<T> {
  return (handler: ApiHandler<T>) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), handler);
  };
}
// 사용 예시:
// const pipeline = pipe(middleware1, middleware2, middleware3);
// export const GET = pipeline(async (request) => { ... });

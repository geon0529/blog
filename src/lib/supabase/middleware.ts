import { isGuestOnlyRoutes, isProtectedRoutes } from "@/lib/routerGuard";
import { andPipe, orPipe } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Supabase 세션을 업데이트하고 라우터 가드를 수행하는 미들웨어 함수
 * @param request - Next.js 요청 객체
 * @returns NextResponse - 리다이렉트 또는 정상 진행 응답
 */ export const updateSession = async (request: NextRequest) => {
  try {
    let requestHeaders = request.headers;
    requestHeaders = new Headers(request.headers);
    requestHeaders.set("Lang", "kr");

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // 1단계: 요청 객체에 새로운 쿠키들을 설정
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );

            // 2단계: 업데이트된 요청으로 새로운 응답 객체 생성
            response = NextResponse.next({
              request: {
                ...request,
                headers: requestHeaders,
              },
            });

            // 3단계: 응답 객체에도 쿠키들을 설정
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const isLoggedIn = andPipe(!error, user);
    const isNotLoggedIn = orPipe(error, !user);
    const pathName = request.nextUrl.pathname;

    if (andPipe(isProtectedRoutes(pathName), isNotLoggedIn)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (andPipe(isGuestOnlyRoutes(pathName), isLoggedIn)) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    return response;
  } catch (e) {
    // API 요청인 경우 예외 상황에서도 Lang 헤더 추가
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    let requestHeaders = request.headers;

    if (isApiRoute) {
      requestHeaders = new Headers(request.headers);
      requestHeaders.set("Lang", "kr");
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
};

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // 이 `try/catch` 블록은 대화형 튜토리얼을 위한 것입니다.
  // Supabase 연결이 완료되면 자유롭게 제거하셔도 됩니다.
  try {
    // 수정되지 않은 응답 생성
    let response = NextResponse.next({
      request: {
        headers: request.headers,
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 세션이 만료된 경우 새로고침합니다 - Server Components에 필수
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();

    // 보호된 라우트
    if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (request.nextUrl.pathname === "/" && !user.error) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    return response;
  } catch (e) {
    // 여기에 도달했다면 Supabase 클라이언트를 생성할 수 없습니다!
    // 환경 변수가 설정되지 않았을 가능성이 높습니다.
    // Next Steps는 http://localhost:3000 에서 확인하세요.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

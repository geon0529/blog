import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // `/auth/callback` 라우트는 SSR 패키지에서 구현된 서버사이드 인증 플로우에 필요합니다.
  // 인증 코드를 사용자 세션으로 교환합니다.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // 회원가입 프로세스 완료 후 리다이렉트할 URL
  return NextResponse.redirect(`${origin}/protected`);
}

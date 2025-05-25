import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청 경로와 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp (이미지 파일들)
     * 더 많은 경로를 포함하려면 이 패턴을 자유롭게 수정하세요.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

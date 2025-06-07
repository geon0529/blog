// app/api/profile/[userId]/route.ts - 유저 프로필 조회
import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/db/queries/profiles";
import { profileIdSchema } from "@/lib/db/schemas/profiles";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";

/**
 * GET /api/profile/[userId] - 특정 유저의 프로필 조회
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: { userId: string } }
  ): Promise<NextResponse> => {
    // 파라미터 검증
    const { id: userId } = profileIdSchema.parse({ id: params.userId });

    // 프로필 조회
    const profile = await getProfileById(userId);

    if (!profile) {
      return NextResponse.json(
        {
          error: "프로필을 찾을 수 없습니다.",
          message: "존재하지 않는 사용자입니다.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      message: "프로필을 성공적으로 조회했습니다.",
    });
  }
);

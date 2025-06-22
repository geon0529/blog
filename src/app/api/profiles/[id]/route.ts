// app/api/profile/[userId]/route.ts - 유저 프로필 조회
import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/db/queries/profiles";
import { profileIdSchema } from "@/lib/db/schemas/profiles";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { ApiError } from "@/lib/api/errors/error";

/**
 * GET /api/profile/[id] - 특정 유저의 프로필 조회
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> => {
    const resolvedParams = await params;
    console.log("하이킥 resolvedParams", resolvedParams);

    // 파라미터 검증
    const { id: userId } = profileIdSchema.parse({ id: resolvedParams.id });

    // 프로필 조회
    const profile = await getProfileById(userId);

    if (!profile) {
      throw new ApiError("프로필을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return NextResponse.json(profile);
  }
);

// app/api/profile/route.ts - 유저 프로필 업데이트
import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/db/queries/profiles";
import { updateProfileSchema } from "@/lib/db/schemas/profiles";
import { withAuth } from "@/lib/api/middlewares/with-auth";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { flow } from "lodash";

/**
 * PUT /api/profile - 유저 프로필 업데이트
 */
export const PUT = flow(
  withAuth,
  withErrorHandler
)(async (user: any, request: NextRequest): Promise<NextResponse> => {
  const requestData = await request.json();

  // 요청 데이터 검증
  const validatedData = updateProfileSchema.parse(requestData);

  // 프로필 업데이트
  const updatedProfile = await updateProfile(user.id, validatedData);

  return NextResponse.json({
    profile: updatedProfile,
    message: "프로필이 성공적으로 업데이트되었습니다.",
  });
});

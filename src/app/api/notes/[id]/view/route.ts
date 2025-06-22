import { NextRequest, NextResponse } from "next/server";
import { NotesService } from "@/services/notes/server";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { ApiError } from "@/lib/api/errors/error";
import { incrementNoteViewCount } from "@/lib/db/queries";

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    if (!id) {
      throw new ApiError("노트 ID가 필요합니다.", 400, "VALIDATION_ERROR");
    }

    // 노트 조회수 증가
    await incrementNoteViewCount(id);

    return NextResponse.json(
      { message: "조회수가 증가되었습니다." },
      { status: 200 }
    );
  }
);

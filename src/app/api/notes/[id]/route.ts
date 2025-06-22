// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getNoteById,
  updateNote,
  deleteNote,
  isNoteOwner,
} from "@/lib/db/queries";
import { ApiError } from "@/lib/api/errors/error";
import { updateNoteSchema, noteIdSchema } from "@/lib/db/schemas";
import { z } from "zod";
import { revalidateNotes } from "@/services/notes/revalidate";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { withAuth } from "@/lib/api/middlewares/with-auth";
import { flow } from "lodash";
import { NotesService } from "@/services/notes/server";
/**
 * 노트 ID 검증 헬퍼
 */
async function validateNoteId(id: string): Promise<string> {
  try {
    const { id: validatedId } = noteIdSchema.parse({ id });
    return validatedId;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        "유효하지 않은 노트 ID 형식입니다.",
        400,
        "VALIDATION_ERROR",
        "id"
      );
    }
    throw error;
  }
}

/**
 * 노트 소유권 확인 헬퍼
 */
async function checkNoteOwnership(
  noteId: string,
  userId: string
): Promise<void> {
  const isOwner = await isNoteOwner(noteId, userId);

  if (!isOwner) {
    throw new ApiError(
      "이 노트를 수정/삭제할 권한이 없습니다.",
      403,
      "FORBIDDEN"
    );
  }
}

/**
 * GET /api/notes/[id] - 개별 노트 조회
 * 공개 API - 에러 처리만 적용
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> => {
    const resolvedParams = await params;

    // 노트 ID 검증
    const noteId = await validateNoteId(resolvedParams.id);

    // 노트 조회
    const note = await getNoteById(noteId);

    if (!note) {
      throw new ApiError("노트를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return NextResponse.json(note);
  }
);

/**
 * PUT /api/notes/[id] - 노트 수정
 * 인증 + 에러 처리 적용
 */
export const PUT = flow(
  withAuth, // 1. 인증 먼저
  withErrorHandler // 2. 에러 처리 (가장 바깥)
)(async (
  user: any,
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const resolvedParams = await params;

  // 노트 ID 검증
  const noteId = await validateNoteId(resolvedParams.id);

  // 노트 소유권 확인
  await checkNoteOwnership(noteId, user.id);

  // 요청 본문 검증
  const body = await request.json();
  const validatedData = updateNoteSchema.parse(body);

  // 수정할 내용이 있는지 확인
  const hasUpdateFields = Object.keys(validatedData).some(
    (key) => validatedData[key as keyof typeof validatedData] !== undefined
  );

  if (!hasUpdateFields) {
    throw new ApiError(
      "수정할 내용이 없습니다. title 또는 content가 필요합니다.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // 도메인 로직 실행
  const updatedNote = await updateNote(noteId, validatedData);

  // 캐시 파괴
  revalidateNotes();

  return NextResponse.json(updatedNote);
});

/**
 * DELETE /api/notes/[id] - 노트 삭제
 * 인증 + 에러 처리 적용
 */
export const DELETE = flow(
  withAuth, // 1. 인증 먼저
  withErrorHandler // 2. 에러 처리 (가장 바깥)
)(async (
  user: any,
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const resolvedParams = await params;

  // 노트 ID 검증
  const noteId = await validateNoteId(resolvedParams.id);

  // 노트 소유권 확인
  await checkNoteOwnership(noteId, user.id);

  // 도메인 로직 실행
  const success = await deleteNote(noteId);

  if (!success) {
    throw new ApiError("노트 삭제에 실패했습니다.", 500, "INTERNAL_ERROR");
  }

  // 캐시 파괴
  revalidateNotes();

  return NextResponse.json({
    success: true,
    message: "노트가 성공적으로 삭제되었습니다.",
  });
});

/**
 * PATCH /api/notes/[id] - 노트 부분 수정
 * 인증 + 에러 처리 적용
 */
export const PATCH = flow(
  withAuth, // 1. 인증 먼저
  withErrorHandler // 2. 에러 처리 (가장 바깥)
)(async (
  user: any,
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const resolvedParams = await params;

  // 노트 ID 검증
  const noteId = await validateNoteId(resolvedParams.id);

  // 노트 소유권 확인
  await checkNoteOwnership(noteId, user.id);

  const body = await request.json();

  // 부분 업데이트 스키마 (더 유연한 검증)
  const patchSchema = z
    .object({
      title: z
        .string()
        .min(1, "제목은 최소 1글자 이상이어야 합니다.")
        .max(200, "제목은 최대 200글자까지 가능합니다.")
        .optional(),
      content: z
        .string()
        .min(1, "내용은 최소 1글자 이상이어야 합니다.")
        .optional(),
    })
    .refine((data) => data.title !== undefined || data.content !== undefined, {
      message: "title 또는 content 중 하나 이상이 필요합니다.",
    });

  const validatedData = patchSchema.parse(body);

  // 도메인 로직 실행
  const updatedNote = await updateNote(noteId, validatedData);

  // 캐시 파괴
  revalidateNotes();

  return NextResponse.json(updatedNote);
});

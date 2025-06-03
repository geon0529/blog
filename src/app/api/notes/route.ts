// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getNotesWithPagination,
  createNote,
  searchNotes,
} from "@/lib/db/queries";
import { createNoteSchema } from "@/lib/db/schema";
import { z } from "zod";

// 페이지네이션 파라미터 검증 스키마
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱 및 검증
    const params = paginationSchema.parse({
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      search: searchParams.get("search") || undefined,
    });

    let result;

    // 검색어가 있으면 검색, 없으면 전체 조회
    if (params.search) {
      const searchResults = await searchNotes(params.search);

      // 검색 결과에 대해 수동 페이지네이션 적용
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      result = {
        notes: paginatedResults,
        pagination: {
          currentPage: params.page,
          totalPages: Math.ceil(searchResults.length / params.limit),
          totalCount: searchResults.length,
          hasNextPage: endIndex < searchResults.length,
          hasPreviousPage: params.page > 1,
        },
        search: params.search,
      };
    } else {
      result = await getNotesWithPagination(params.page, params.limit);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 데이터 검증
    const validatedData = createNoteSchema.parse(body);

    const note = await createNote(validatedData);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

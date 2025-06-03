// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNoteById, updateNote, deleteNote } from "@/lib/db/queries";
import { updateNoteSchema, noteIdSchema } from "@/lib/db/schema";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // UUID 유효성 검사
    const { id } = noteIdSchema.parse({ id: params.id });

    const note = await getNoteById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }

    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // UUID 유효성 검사
    const { id } = noteIdSchema.parse({ id: params.id });

    // 요청 본문 검증
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // 빈 객체인 경우 체크
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: "At least one field must be provided for update" },
        { status: 400 }
      );
    }

    const note = await updateNote(id, validatedData);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
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

    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // UUID 유효성 검사
    const { id } = noteIdSchema.parse({ id: params.id });

    const success = await deleteNote(id);
    if (!success) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }

    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notes/[id] - 특정 노트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: note, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error(`GET /api/notes/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/notes/[id] - 노트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title, content } = body;

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be less than 200 characters" },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "Content must be less than 10,000 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: note, error } = await supabase
      .from("notes")
      .update({
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error(`PUT /api/notes/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - 노트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(`DELETE /api/notes/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notes - 노트 목록 조회 (검색, 필터링, 페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const supabase = await createClient();

    // 검색 쿼리 구성
    let query = supabase.from("notes").select("*", { count: "exact" });

    // 검색어가 있으면 title이나 content에서 검색
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: notes, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: page * limit < (count || 0),
      },
      filters: {
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notes - 새 노트 생성
export async function POST(request: NextRequest) {
  try {
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
      .insert([{ title: title.trim(), content: content.trim() }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

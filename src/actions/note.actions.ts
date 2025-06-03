// app/lib/notes-actions.ts
"use server";

import { API_BASE_URL } from "@/lib/constants";
import { Note } from "@/lib/db/schema";
import { PaginationInfo } from "@/types/common.type";
import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface NotesResponse {
  notes: Note[];
  pagination: PaginationInfo;
  search?: string;
}

/**
 * note 전체 조회 (서버 액션)
 * 서버와 클라이언트 양쪽에서 사용 가능, 캐싱 적용
 */
export async function fetchNotes(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<NotesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  try {
    // ✅ 서버에서 실행되므로 next 옵션 적용됨
    const response = await fetch(`${API_BASE_URL}/api/notes?${params}`, {
      next: {
        tags: [
          "notes",
          `notes-page-${page}`,
          search ? `notes-search-${search}` : "notes-all",
        ],
        revalidate: 300, // 5분간 캐싱
      },
    });

    if (!response.ok) {
      throw new Error("노트를 불러오는데 실패했습니다.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("fetchNotes error:", error);
    throw new Error(
      error instanceof Error ? error.message : "노트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * id 기반 특정 노트 조회 (서버 액션)
 * 서버와 클라이언트 양쪽에서 사용 가능, 캐싱 적용
 */
export async function fetchNote(id: string): Promise<Note> {
  try {
    // ✅ 개별 노트 캐싱
    const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
      next: {
        tags: ["notes", `note-${id}`],
        revalidate: 600, // 10분간 캐싱 (개별 노트는 더 길게)
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch note");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchNote error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch note"
    );
  }
}

/**
 * 노트 생성 (서버 액션) - 문자열 인자 버전
 * 클라이언트에서 직접 호출할 때 사용
 */
export async function createNote(
  title: string,
  content: string
): Promise<Note> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create note");
    }

    const newNote = await response.json();

    // ✅ 캐시 무효화 (서버에서만 가능)
    revalidateTag("notes");
    revalidateTag("notes-all");
    console.log("🔄 Cache invalidated: notes, notes-all");

    return newNote;
  } catch (error) {
    console.error("createNote error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create note"
    );
  }
}

/**
 * 노트 생성 (서버 액션) - FormData 버전
 * 폼에서 직접 action으로 사용할 때
 */
export async function createNoteFromForm(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title?.trim() || !content?.trim()) {
    throw new Error("제목과 내용은 필수입니다.");
  }

  try {
    await createNote(title.trim(), content.trim());

    // ✅ 폼 제출 후 리디렉션
    revalidatePath("/notes");
  } catch (error) {
    console.error("createNoteFromForm error:", error);
    throw error;
  }

  redirect("/notes");
}

/**
 * 노트 업데이트 (서버 액션)
 * 서버와 클라이언트 양쪽에서 사용 가능
 */
export async function updateNote(
  id: string,
  updates: { title?: string; content?: string }
): Promise<Note> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update note");
    }

    const updatedNote = await response.json();

    // ✅ 관련 캐시 무효화
    revalidateTag("notes");
    revalidateTag(`note-${id}`);
    revalidateTag("notes-all");
    console.log(`🔄 Cache invalidated: notes, note-${id}, notes-all`);

    return updatedNote;
  } catch (error) {
    console.error("updateNote error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update note"
    );
  }
}

/**
 * 노트 업데이트 (서버 액션) - FormData 버전
 */
export async function updateNoteFromForm(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const updates: { title?: string; content?: string } = {};
  if (title?.trim()) updates.title = title.trim();
  if (content?.trim()) updates.content = content.trim();

  if (Object.keys(updates).length === 0) {
    throw new Error("수정할 내용이 없습니다.");
  }

  try {
    await updateNote(id, updates);
    revalidatePath(`/notes/${id}`);
    revalidatePath("/notes");
  } catch (error) {
    console.error("updateNoteFromForm error:", error);
    throw error;
  }

  redirect(`/notes/${id}`);
}

/**
 * 노트 삭제 (서버 액션)
 * 서버와 클라이언트 양쪽에서 사용 가능
 */
export async function deleteNote(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete note");
    }

    const result = await response.json();

    // ✅ 관련 캐시 무효화
    revalidateTag("notes");
    revalidateTag(`note-${id}`);
    revalidateTag("notes-all");
    console.log(`🔄 Cache invalidated: notes, note-${id}, notes-all`);

    return result;
  } catch (error) {
    console.error("deleteNote error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete note"
    );
  }
}

/**
 * 노트 삭제 (서버 액션) - 리디렉션 포함 버전
 */
export async function deleteNoteWithRedirect(id: string) {
  try {
    await deleteNote(id);
    revalidatePath("/notes");
  } catch (error) {
    console.error("deleteNoteWithRedirect error:", error);
    throw error;
  }

  redirect("/notes");
}

/**
 * 검색 전용 함수 (서버 액션)
 */
export async function searchNotes(
  searchQuery: string,
  page: number = 1
): Promise<NotesResponse> {
  return fetchNotes(page, 10, searchQuery);
}

/**
 * 캐시 수동 무효화 (서버 액션)
 * 관리자용 또는 디버깅용
 */
export async function revalidateNotesCache(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    revalidateTag("notes");
    revalidateTag("notes-all");
    revalidatePath("/notes");

    console.log("🔄 Manual cache invalidation completed");

    return {
      success: true,
      message: "캐시가 성공적으로 무효화되었습니다.",
    };
  } catch (error) {
    console.error("revalidateNotesCache error:", error);
    throw new Error("캐시 무효화에 실패했습니다.");
  }
}

// =====================================
// 사용 예제 (클라이언트 컴포넌트에서)
// =====================================

/*
"use client";

import { 
  fetchNotes, 
  fetchNote, 
  createNote, 
  updateNote, 
  deleteNote,
  revalidateNotesCache 
} from '@/lib/notes-actions';
import { useTransition } from 'react';

export function NotesClient() {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState([]);

  // ✅ 클라이언트에서 서버 액션 호출 (캐싱 적용됨)
  const loadNotes = async () => {
    try {
      const data = await fetchNotes(1, 10);
      setNotes(data.notes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  // ✅ 노트 생성
  const handleCreate = async (title: string, content: string) => {
    startTransition(async () => {
      try {
        await createNote(title, content);
        await loadNotes(); // 새로고침
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    });
  };

  // ✅ 노트 삭제
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteNote(id);
        await loadNotes(); // 새로고침
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    });
  };

  // ✅ 수동 캐시 새로고침
  const handleRefresh = async () => {
    startTransition(async () => {
      try {
        await revalidateNotesCache();
        await loadNotes();
      } catch (error) {
        console.error('Failed to refresh cache:', error);
      }
    });
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={isPending}>
        {isPending ? '새로고침 중...' : '캐시 새로고침'}
      </button>
      
      <!-- 폼에서 직접 서버 액션 사용 -->
      <form action={createNoteFromForm}>
        <input name="title" placeholder="제목" required />
        <textarea name="content" placeholder="내용" required />
        <button type="submit">폼으로 생성</button>
      </form>
      
      <!-- 노트 목록 렌더링 -->
    </div>
  );
}
*/

// =====================================
// 사용 예제 (서버 컴포넌트에서)
// =====================================

/*
// app/notes/page.tsx
import { fetchNotes } from '@/lib/notes-actions';

export default async function NotesPage() {
  // ✅ 서버 컴포넌트에서 직접 호출 (캐싱 적용)
  const initialData = await fetchNotes(1, 10);
  
  return (
    <div>
      <h1>노트 목록</h1>
      <p>총 {initialData.pagination.totalCount}개의 노트</p>
      <NotesClient initialData={initialData} />
    </div>
  );
}

// app/notes/[id]/page.tsx
import { fetchNote } from '@/lib/notes-actions';

export default async function NotePage({ params }: { params: { id: string } }) {
  // ✅ 개별 노트 서버에서 페칭 (캐싱 적용)
  const note = await fetchNote(params.id);
  
  return (
    <div>
      <h1>{note.title}</h1>
      <p>{note.content}</p>
      
      <!-- 수정/삭제 폼 -->
      <form action={updateNoteFromForm.bind(null, params.id)}>
        <input name="title" defaultValue={note.title} />
        <textarea name="content" defaultValue={note.content} />
        <button type="submit">수정</button>
      </form>
      
      <form action={deleteNoteWithRedirect.bind(null, params.id)}>
        <button type="submit">삭제</button>
      </form>
    </div>
  );
}
*/

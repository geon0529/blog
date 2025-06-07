// lib/services/notes/client.ts - 클라이언트 전용
import { API_BASE_URL } from "@/lib/constants";
import { Note } from "@/lib/db/schemas";
import { ApiError, handleApiError, isApiError } from "@/lib/api/errors/error";
import { NotesResponse } from "@/services/notes";

/**
 * 클라이언트 컴포넌트용 API 호출 서비스
 * 클라이언트에서만 사용 가능!
 */
export const NotesService = {
  /**
   * note 전체 조회 (클라이언트용)
   */
  async fetchNotes(
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
      const response = await fetch(`${API_BASE_URL}/api/notes?${params}`);

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "노트를 불러오는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },

  /**
   * 노트 생성 (클라이언트용)
   */
  async createNote(title: string, content: string): Promise<Note> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        await handleApiError(response);
      }
      const newNote = await response.json();
      return newNote;
    } catch (error) {
      console.log("Debug - ", error);
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "노트를 생성하는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },

  /**
   * 노트 업데이트 (클라이언트용)
   */
  async updateNote(
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
        await handleApiError(response);
      }
      const updatedNote = await response.json();
      return updatedNote;
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "노트를 수정하는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },

  /**
   * 노트 삭제 (클라이언트용)
   */
  async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: "DELETE",
      });

      console.log("하이킥 response", response);

      if (!response.ok) {
        await handleApiError(response);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "노트를 삭제하는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },

  /**
   * id 기반 특정 노트 조회 (클라이언트용)
   */
  async fetchNote(id: string): Promise<Note> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`);

      if (!response.ok) {
        await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "노트를 불러오는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },

  /**
   * 검색 전용 함수 (클라이언트용)
   */
  async searchNotes(
    searchQuery: string,
    page: number = 1
  ): Promise<NotesResponse> {
    return this.fetchNotes(page, 10, searchQuery);
  },
} as const;

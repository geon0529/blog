// lib/services/notes/server.ts - 서버 전용
import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import {
  getNotesWithPagination,
  getNoteById,
  searchNotes as dbSearchNotes,
} from "@/lib/db/queries/notes";
import { Note } from "@/lib/db/schemas";
import { NotFoundError } from "@/lib/errors/domain-error";
import { CACHE_KEYS } from "@/types/common.types";
import { CACHE_TAGS, NotesResponse } from "@/services/notes";

/**
 * 서버 컴포넌트용 데이터베이스 직접 접근 서비스
 */
export const service = {
  /**
   * note 전체 조회 (서버용)
   */
  async fetchNotes(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<NotesResponse> {
    try {
      let result;

      if (search && search.trim()) {
        // 검색이 있는 경우 - 페이지네이션 직접 구현
        const notes = await dbSearchNotes(search);
        const offset = (page - 1) * limit;
        const paginatedNotes = notes.slice(offset, offset + limit);

        result = {
          notes: paginatedNotes,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(notes.length / limit),
            totalCount: notes.length,
            hasNextPage: page * limit < notes.length,
            hasPreviousPage: page > 1,
          },
        };
      } else {
        // 일반 조회
        result = await getNotesWithPagination(page, limit);
        result = {
          notes: result.notes,
          pagination: result.pagination,
        };
      }

      return {
        ...result,
        search,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * id 기반 특정 노트 조회 (서버용)
   */
  async fetchNote(id: string): Promise<Note> {
    try {
      const note = await getNoteById(id);
      if (!note) {
        throw new NotFoundError("노트");
      }
      return note;
    } catch (error) {
      throw error;
    }
  },
} as const;

/**
 * 캐시된 노트 조회 (서버용)
 * 별도로 정의하여 unstable_cache가 올바르게 작동하도록 함
 */
export const fetchNotesWithCache = unstable_cache(
  async (page: number = 1, limit: number = 10, search?: string) => {
    return service.fetchNotes(page, limit, search);
  },
  [CACHE_KEYS.NOTES],
  {
    tags: [CACHE_TAGS.NOTES],
    revalidate: 300, // 5분
  }
);

/**
 * 캐시된 개별 노트 조회 (서버용)
 * 별도로 정의하여 unstable_cache가 올바르게 작동하도록 함
 */
export const fetchNoteWithCache = unstable_cache(
  async (id: string) => {
    return service.fetchNote(id);
  },
  [CACHE_KEYS.NOTE],
  {
    tags: [CACHE_TAGS.NOTES],
    revalidate: 300,
  }
);

// 캐시된 함수들을 service에 추가하는 확장된 버전
export const NotesService = {
  ...service,
  fetchNotesWithCache,
  fetchNoteWithCache,
} as const;

// lib/services/notes/server.ts - 서버 전용
import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import {
  getNotesWithPagination,
  getNoteById,
  searchNotes as dbSearchNotes,
  searchNotesByTags as dbSearchNotesByTags,
  getNoteByIdReadOnly,
  incrementNoteViewCount,
  deleteNote as dbDeleteNote,
  Note,
} from "@/lib/db/queries/notes";
import { NotFoundError } from "@/lib/api/errors/domain-error";
import { CACHE_KEYS } from "@/types/common.types";
import { CACHE_TAGS } from "@/services/notes";

/**
 * 서버 컴포넌트용 데이터베이스 직접 접근 서비스
 */
export const service = {
  /**
   * id 기반 특정 노트 조회 (서버용) - 캐시 적용
   */
  async fetchNote(id: string): Promise<Note> {
    return unstable_cache(
      async (noteId: string) => {
        try {
          const note = await getNoteByIdReadOnly(noteId);
          if (!note) {
            throw new NotFoundError("노트");
          }
          await incrementNoteViewCount(noteId);
          return note;
        } catch (error) {
          throw error;
        }
      },
      [`${CACHE_KEYS.NOTE}-${id}`],
      {
        tags: [CACHE_TAGS.NOTES, `${CACHE_TAGS.NOTE_DETAIL}-${id}`],
        revalidate: 300, // 5분
      }
    )(id);
  },

  async incrementViewCount(id: string): Promise<void> {
    try {
      await incrementNoteViewCount(id);
    } catch (error) {
      throw error;
    }
  },
} as const;

// 캐시된 함수들을 service에 추가하는 확장된 버전
export const NotesService = {
  ...service,
} as const;

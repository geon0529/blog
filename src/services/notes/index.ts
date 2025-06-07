import { Note } from "@/lib/db/queries";
import { PaginationInfo } from "@/types/common.types";

/**
 * 노트 조회시 response
 */
export interface NotesResponse {
  notes: Note[];
  pagination: PaginationInfo;
  search?: string;
}

/**
 * 캐시 태그 상수
 */
export const CACHE_TAGS = {
  NOTES: "notes",
  NOTES_LIST: "notes-list",
  NOTE_DETAIL: "note-detail",
} as const;

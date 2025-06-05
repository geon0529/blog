import { Note } from "@/lib/db/schemas";
import { PaginationInfo } from "@/types/common.types";

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

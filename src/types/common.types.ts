export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 캐시 충돌 방지용 캐시 키
 */
export enum CACHE_KEYS {
  NOTE = "NOTE",
  NOTES = "NOTES",
  PROFILE = "PROFILE",
}

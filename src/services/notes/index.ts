import { ClientNotesService } from "./client";
import { ServerNotesServiceWithCache } from "./server";

/**
 * 통합된 Notes 서비스
 * 클라이언트와 서버 서비스를 하나의 네임스페이스로 통합
 */
export const notesService = {
  /**
   * 클라이언트 컴포넌트용 서비스 (API 호출)
   */
  client: ClientNotesService,

  /**
   * 서버 컴포넌트용 서비스 (DB 직접 접근 + 캐시)
   */
  server: ServerNotesServiceWithCache,
} as const;

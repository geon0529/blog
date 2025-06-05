// ================================================================
// 도메인 특화 에러 클래스들 (데이터베이스 관련)
// ================================================================

export class NotFoundError extends Error {
  constructor(resource: string = "리소스") {
    super(`${resource}를 찾을 수 없습니다.`);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string = "데이터베이스 오류가 발생했습니다.",
    public operation?: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

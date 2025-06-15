const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const execAsync = promisify(exec);

// 환경 변수 검증
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  console.error("Supabase 프로젝트 설정에서 DATABASE_URL을 확인하세요.");
  process.exit(1);
}

// 백업 설정
const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUP_FILES = 10; // 최대 보관할 백업 파일 수

// 백업 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 백업 디렉토리 생성: ${BACKUP_DIR}`);
}

// 백업 타입 정의
const BACKUP_TYPES = {
  DATA_ONLY: "data-only", // 데이터만
  SCHEMA_ONLY: "schema-only", // 스키마만 (테이블 구조, 함수, RLS 등)
  FULL: "full", // 스키마 + 데이터
};

/**
 * 오래된 백업 파일 정리
 */
function cleanupOldBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith("backup-") && file.endsWith(".sql"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime); // 최신순 정렬

    if (files.length > MAX_BACKUP_FILES) {
      const filesToDelete = files.slice(MAX_BACKUP_FILES);
      filesToDelete.forEach((file) => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  오래된 백업 파일 삭제: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn("⚠️  백업 파일 정리 중 오류:", error.message);
  }
}

/**
 * 데이터베이스 백업 실행
 */
async function backupDatabase(backupType = BACKUP_TYPES.FULL) {
  try {
    // 백업 파일명 생성
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, -5); // 밀리초 제거

    const typePrefix = backupType === BACKUP_TYPES.FULL ? "" : `${backupType}_`;
    const backupFileName = `backup-${typePrefix}${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    console.log(`🚀 Supabase 데이터베이스 백업 시작 (${backupType})...`);
    console.log(`📄 백업 파일: ${backupFileName}`);

    // pg_dump 명령어 구성
    let pgDumpOptions = [
      "--verbose", // 상세 로그
      "--no-password", // .pgpass 또는 환경변수 사용
      "--format=plain", // SQL 텍스트 형태
      "--encoding=UTF8", // UTF-8 인코딩
      "--no-privileges", // 권한 정보 제외 (Supabase에서는 불필요)
      "--no-owner", // 소유자 정보 제외
      "--quote-all-identifiers", // 모든 식별자를 따옴표로 감싸기
    ];

    // 백업 타입에 따른 옵션 추가
    switch (backupType) {
      case BACKUP_TYPES.DATA_ONLY:
        pgDumpOptions.push("--data-only");
        break;
      case BACKUP_TYPES.SCHEMA_ONLY:
        pgDumpOptions.push("--schema-only");
        break;
      case BACKUP_TYPES.FULL:
        // 기본값: 스키마 + 데이터 모두 포함
        break;
    }

    // Supabase 특정 스키마와 테이블 제외 (시스템 스키마)
    const excludeSchemas = [
      "information_schema",
      "pg_catalog",
      "pg_toast",
      "pg_temp_1",
      "pg_toast_temp_1",
      "auth", // Supabase Auth 스키마
      "storage", // Supabase Storage 스키마
      "realtime", // Supabase Realtime 스키마
      "supabase_functions", // Supabase Edge Functions 스키마
      "vault", // Supabase Vault 스키마
    ];

    excludeSchemas.forEach((schema) => {
      pgDumpOptions.push(`--exclude-schema=${schema}`);
    });

    // 특정 시스템 테이블 제외
    const excludeTables = [
      "secrets", // Supabase secrets 테이블
      "decrypted_secrets", // 복호화된 secrets
      "key", // 암호화 키
      "auth.users", // 사용자 정보 (민감한 데이터)
      "auth.identities", // 사용자 인증 정보
      "__drizzle_migrations", // Drizzle 마이그레이션 테이블 (drizzle-kit에서 관리)
    ];

    excludeTables.forEach((table) => {
      pgDumpOptions.push(`--exclude-table=${table}`);
    });

    // 명령어 구성
    const command = `pg_dump "${DATABASE_URL}" ${pgDumpOptions.join(" ")} > "${backupPath}"`;

    // Windows 인코딩 문제 해결을 위한 환경변수 설정
    const env = {
      ...process.env,
      PGCLIENTENCODING: "UTF8",
      LANG: "en_US.UTF-8",
    };

    // 백업 실행
    await execAsync(command, { env });

    // 백업 파일 크기 확인
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ 백업 완료!`);
    console.log(`📊 파일 크기: ${fileSizeInMB}MB`);
    console.log(`📍 저장 위치: ${backupPath}`);

    // 오래된 백업 정리
    cleanupOldBackups();

    return backupPath;
  } catch (error) {
    console.error("❌ 백업 중 오류 발생:", error.message);

    // 일반적인 오류 해결 방법 제시
    if (error.message.includes("pg_dump: command not found")) {
      console.error("💡 해결방법: PostgreSQL 클라이언트 도구를 설치하세요:");
      console.error("   - macOS: brew install postgresql");
      console.error("   - Ubuntu: sudo apt-get install postgresql-client");
      console.error("   - Windows: PostgreSQL 공식 사이트에서 다운로드");
    } else if (error.message.includes("authentication failed")) {
      console.error(
        "💡 해결방법: DATABASE_URL의 사용자명과 비밀번호를 확인하세요."
      );
    } else if (error.message.includes("could not connect")) {
      console.error("💡 해결방법: 네트워크 연결과 DATABASE_URL을 확인하세요.");
    }

    process.exit(1);
  }
}

// 명령행 인자 처리
const args = process.argv.slice(2);
const backupType = args[0] || BACKUP_TYPES.FULL;

// 유효한 백업 타입인지 확인
if (!Object.values(BACKUP_TYPES).includes(backupType)) {
  console.error("❌ 유효하지 않은 백업 타입입니다.");
  console.error("사용 가능한 옵션:");
  console.error(`  - ${BACKUP_TYPES.FULL} (기본값): 스키마 + 데이터`);
  console.error(`  - ${BACKUP_TYPES.SCHEMA_ONLY}: 스키마만`);
  console.error(`  - ${BACKUP_TYPES.DATA_ONLY}: 데이터만`);
  console.error("\n사용법: node backup.js [backup-type]");
  process.exit(1);
}

// 백업 실행
console.log("🔧 Supabase 데이터베이스 백업 도구");
console.log("================================");
backupDatabase(backupType);

const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

// dotenv 로드
require("dotenv").config();

const execAsync = promisify(exec);

// 환경 변수 검증
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  console.error("Supabase 프로젝트 설정에서 DATABASE_URL을 확인하세요.");
  process.exit(1);
}

const BACKUP_DIR = path.join(process.cwd(), "backups");

/**
 * 사용자 확인 입력 받기
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * 사용 가능한 백업 파일 목록 표시
 */
function listBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error("❌ 백업 디렉토리가 존재하지 않습니다:", BACKUP_DIR);
    return [];
  }

  const backupFiles = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith("backup-") && file.endsWith(".sql"))
    .map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        name: file,
        path: filePath,
        size: sizeInMB,
        mtime: stats.mtime,
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // 최신순 정렬

  if (backupFiles.length === 0) {
    console.error("❌ 사용 가능한 백업 파일이 없습니다.");
    return [];
  }

  console.log("\n📋 사용 가능한 백업 파일:");
  console.log("================================");
  backupFiles.forEach((file, index) => {
    const timeStr = file.mtime.toLocaleString("ko-KR");
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   크기: ${file.size}MB | 생성일: ${timeStr}`);
    console.log("");
  });

  return backupFiles;
}

/**
 * 데이터베이스 복원 실행
 */
async function restoreDatabase(backupFilePath) {
  try {
    // 백업 파일 존재 확인
    if (!fs.existsSync(backupFilePath)) {
      console.error("❌ 백업 파일이 존재하지 않습니다:", backupFilePath);
      process.exit(1);
    }

    console.log(`🚀 Supabase 데이터베이스 복원 시작...`);
    console.log(`📄 복원 파일: ${path.basename(backupFilePath)}`);

    // 경고 메시지
    console.log("\n⚠️  주의사항:");
    console.log("- 복원 작업은 기존 데이터를 덮어쓸 수 있습니다.");
    console.log("- 복원 전에 현재 데이터베이스를 백업하는 것을 권장합니다.");
    console.log("- 복원 중에는 애플리케이션 사용을 중단하세요.");

    // 사용자 확인
    const confirmed = await askConfirmation("\n계속하시겠습니까? (y/N): ");
    if (!confirmed) {
      console.log("복원 작업이 취소되었습니다.");
      process.exit(0);
    }

    // 복원 방식 선택
    console.log("\n🎯 복원 방식을 선택하세요:");
    console.log("1. 기존 데이터 유지 + 새 데이터 추가 (충돌 가능성 있음)");
    console.log("2. 기존 데이터 삭제 + 완전 복원 (권장)");

    const cleanRestore = await askConfirmation(
      "기존 데이터를 삭제하고 완전 복원하시겠습니까? (y/N): "
    );

    // Windows 인코딩 문제 해결을 위한 환경변수 설정
    const env = {
      ...process.env,
      PGCLIENTENCODING: "UTF8",
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
    };

    if (cleanRestore) {
      console.log("\n🧹 기존 데이터 정리 중...");

      // 사용자 정의 테이블만 정리 (시스템 테이블 제외)
      const cleanupSQL = `
        -- 사용자 정의 테이블 데이터만 삭제 (CASCADE로 관련 데이터도 함께)
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            -- public 스키마의 모든 테이블 찾기 (시스템 테이블 제외)
            FOR r IN (SELECT tablename FROM pg_tables 
                     WHERE schemaname = 'public' 
                     AND tablename NOT LIKE 'pg_%'
                     AND tablename NOT LIKE '__drizzle_%'
                     AND tablename NOT IN ('secrets', 'key', 'decrypted_secrets'))
            LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
      `;

      // 임시 SQL 파일 생성
      const tempCleanupFile = path.join(
        process.cwd(),
        "backups",
        "temp_cleanup.sql"
      );
      fs.writeFileSync(tempCleanupFile, cleanupSQL);

      try {
        // 정리 실행
        const cleanupCommand = `psql "${DATABASE_URL}" --quiet --no-password --file "${tempCleanupFile}"`;
        await execAsync(cleanupCommand, { env });
        console.log("✅ 기존 데이터 정리 완료");

        // 임시 파일 삭제
        fs.unlinkSync(tempCleanupFile);
      } catch (cleanupError) {
        console.warn(
          "⚠️  데이터 정리 중 일부 오류 발생 (무시하고 계속):",
          cleanupError.message
        );
        // 임시 파일 삭제 시도
        try {
          fs.unlinkSync(tempCleanupFile);
        } catch (deleteError) {
          // 파일 삭제 실패해도 무시
        }
      }
    }

    // psql 옵션 설정
    const psqlOptions = [
      "--quiet", // 불필요한 출력 최소화
      "--no-password", // .pgpass 또는 환경변수 사용
      "--single-transaction", // 모든 명령을 하나의 트랜잭션으로 실행
      "--set ON_ERROR_STOP=on", // 오류 발생시 즉시 중단
      "--set AUTOCOMMIT=off", // 자동 커밋 비활성화
      "--file", // 파일에서 SQL 명령 읽기
    ];

    // 복원 명령어 구성
    const command = `psql "${DATABASE_URL}" ${psqlOptions.join(" ")} "${backupFilePath}"`;

    console.log("\n🔄 복원 진행 중...");
    console.log(
      `📝 실행 방식: ${cleanRestore ? "완전 복원 (기존 데이터 삭제)" : "증분 복원 (데이터 추가)"}`
    );

    // 복원 실행
    const startTime = Date.now();
    await execAsync(command, { env });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ 복원 완료!`);
    console.log(`⏱️  소요 시간: ${duration}초`);
    console.log("\n💡 복원 후 확인사항:");
    console.log("- 애플리케이션이 정상 작동하는지 확인하세요");
    console.log("- 데이터 무결성을 검증하세요");
    console.log("- 필요시 Supabase Dashboard에서 RLS 정책을 확인하세요");
  } catch (error) {
    console.error("\n❌ 복원 중 오류 발생:", error.message);

    // 일반적인 오류 해결 방법 제시
    if (error.message.includes("psql: command not found")) {
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
    } else if (
      error.message.includes("relation") &&
      error.message.includes("already exists")
    ) {
      console.error(
        "💡 해결방법: 데이터베이스에 이미 동일한 테이블이 존재합니다."
      );
      console.error(
        "   스키마만 복원하거나, 기존 테이블을 삭제 후 다시 시도하세요."
      );
    } else if (error.message.includes("duplicate key")) {
      console.error("💡 해결방법: 기존 데이터와 충돌이 발생했습니다.");
      console.error(
        "   '완전 복원' 옵션을 선택하여 기존 데이터를 정리 후 복원하세요."
      );
      console.error(
        "   또는 Supabase Dashboard에서 해당 테이블을 비운 후 다시 시도하세요."
      );
    }

    console.error("\n🔧 복원이 실패했습니다. 데이터베이스 상태를 확인하세요.");
    process.exit(1);
  }
}

/**
 * 대화형 파일 선택
 */
async function selectBackupFile() {
  const backupFiles = listBackupFiles();

  if (backupFiles.length === 0) {
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("\n복원할 백업 파일 번호를 입력하세요: ", (answer) => {
      rl.close();

      const fileIndex = parseInt(answer) - 1;
      if (fileIndex >= 0 && fileIndex < backupFiles.length) {
        resolve(backupFiles[fileIndex].path);
      } else {
        console.error("❌ 유효하지 않은 번호입니다.");
        process.exit(1);
      }
    });
  });
}

// 메인 실행 로직
async function main() {
  console.log("🔧 Supabase 데이터베이스 복원 도구");
  console.log("================================");

  const backupFilePath = process.argv[2];

  if (backupFilePath) {
    // 명령행 인자로 파일 경로가 제공된 경우
    let fullPath = backupFilePath;

    // 상대 경로인 경우 백업 디렉토리 기준으로 변환
    if (!path.isAbsolute(backupFilePath)) {
      // 파일명만 제공된 경우
      if (!backupFilePath.includes("/") && !backupFilePath.includes("\\")) {
        fullPath = path.join(BACKUP_DIR, backupFilePath);
      } else {
        fullPath = path.resolve(backupFilePath);
      }
    }

    await restoreDatabase(fullPath);
  } else {
    // 대화형 파일 선택
    const selectedFile = await selectBackupFile();
    await restoreDatabase(selectedFile);
  }
}

// 예외 처리
process.on("SIGINT", () => {
  console.log("\n\n작업이 중단되었습니다.");
  process.exit(0);
});

// 스크립트 실행
main().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});

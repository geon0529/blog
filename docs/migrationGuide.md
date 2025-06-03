# Drizzle ORM 마이그레이션 완벽 가이드

## 1. 초기 설정 및 첫 마이그레이션

### 1.1 환경 확인

```bash
# 필요한 패키지가 설치되어 있는지 확인
npm list drizzle-orm drizzle-kit postgres

# 환경 변수 확인
echo $DATABASE_URL
```

### 1.2 Drizzle 설정 파일 확인

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### 1.3 첫 마이그레이션 실행

```bash
# 1단계: 마이그레이션 파일 생성
npm run db:generate

# 2단계: 생성된 마이그레이션 파일 확인
ls -la drizzle/

# 3단계: 데이터베이스에 적용
npm run db:migrate
```

## 2. 개발 환경 vs 프로덕션 환경

### 2.1 개발 환경 (권장)

```bash
# 빠른 프로토타이핑용 - 마이그레이션 파일 없이 바로 적용
npm run db:push

# 장점: 빠름, 단순함
# 단점: 마이그레이션 히스토리 없음, 프로덕션 부적합
```

### 2.2 프로덕션 환경 (필수)

```bash
# 1단계: 마이그레이션 파일 생성
npm run db:generate

# 2단계: 마이그레이션 파일 검토
cat drizzle/0001_*.sql

# 3단계: 마이그레이션 실행
npm run db:migrate
```

## 3. 스키마 변경 시나리오별 가이드

### 3.1 새 테이블 추가

```typescript
// schema.ts에 새 테이블 추가
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

```bash
# 마이그레이션 생성 및 적용
npm run db:generate
npm run db:migrate
```

### 3.2 기존 테이블에 컬럼 추가

```typescript
// notes 테이블에 새 컬럼 추가
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  // 새로 추가된 컬럼들
  isPublic: boolean("is_public").default(false).notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 3.3 컬럼 타입 변경 (주의 필요)

```typescript
// 기존: text("content")
// 변경: text("content").notNull()  // NOT NULL 제약 추가

// 주의: 기존 데이터가 null인 경우 마이그레이션 실패할 수 있음
```

### 3.4 테이블명 변경

```typescript
// 기존
export const notes = pgTable("notes", { ... });

// 변경
export const articles = pgTable("articles", { ... });
```

## 4. 안전한 마이그레이션 절차

### 4.1 백업 생성 (중요!)

```bash
# PostgreSQL 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 또는 Supabase CLI 사용
supabase db dump --db-url $DATABASE_URL --file backup.sql
```

### 4.2 마이그레이션 미리보기

```bash
# 생성될 SQL 확인
npm run db:generate

# 생성된 마이그레이션 파일 검토
cat drizzle/meta/_journal.json
cat drizzle/0001_*.sql
```

### 4.3 단계별 마이그레이션 적용

```bash
# 1단계: 개발 환경에서 테스트
npm run db:push  # 개발용

# 2단계: 스테이징 환경에서 테스트
DATABASE_URL=$STAGING_DATABASE_URL npm run db:migrate

# 3단계: 프로덕션 적용
DATABASE_URL=$PRODUCTION_DATABASE_URL npm run db:migrate
```

## 5. 마이그레이션 문제 해결

### 5.1 일반적인 오류와 해결책

#### 연결 오류

```bash
# 에러: connection refused
# 해결: DATABASE_URL 확인
echo $DATABASE_URL

# 에러: authentication failed
# 해결: 비밀번호 및 권한 확인
```

#### 스키마 충돌

```bash
# 에러: relation already exists
# 해결 1: 기존 테이블 삭제 (개발환경만!)
DROP TABLE IF EXISTS notes;

# 해결 2: 마이그레이션 파일 수정
# drizzle/0001_*.sql 파일에서 CREATE TABLE을 CREATE TABLE IF NOT EXISTS로 변경
```

#### 데이터 손실 방지

```sql
-- 컬럼 삭제 전 데이터 백업
CREATE TABLE notes_backup AS SELECT * FROM notes;

-- 안전한 컬럼 삭제
ALTER TABLE notes DROP COLUMN old_column;
```

### 5.2 롤백 방법

```bash
# 방법 1: 백업에서 복원
psql $DATABASE_URL < backup_20241203_120000.sql

# 방법 2: 역방향 마이그레이션 (수동)
# drizzle/0001_*.sql의 역순으로 SQL 실행
```

## 6. 고급 마이그레이션 시나리오

### 6.1 데이터 변환이 필요한 마이그레이션

```sql
-- 생성된 마이그레이션 파일 수정 예시
-- drizzle/0001_add_slug_column.sql

-- 1. 새 컬럼 추가
ALTER TABLE notes ADD COLUMN slug text;

-- 2. 기존 데이터 변환
UPDATE notes SET slug = LOWER(REPLACE(title, ' ', '-')) WHERE slug IS NULL;

-- 3. NOT NULL 제약 추가
ALTER TABLE notes ALTER COLUMN slug SET NOT NULL;

-- 4. UNIQUE 제약 추가
ALTER TABLE notes ADD CONSTRAINT notes_slug_unique UNIQUE (slug);
```

### 6.2 인덱스 추가

```typescript
// schema.ts에 인덱스 정의
export const notes = pgTable(
  "notes",
  {
    // ... 기존 컬럼들
  },
  (table) => ({
    titleIdx: index("title_idx").on(table.title),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    titleContentIdx: index("title_content_idx").on(table.title, table.content),
  })
);
```

### 6.3 외래키 관계 추가

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  // 외래키 추가
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## 7. 마이그레이션 모니터링 및 검증

### 7.1 마이그레이션 상태 확인

```sql
-- Drizzle 마이그레이션 테이블 확인
SELECT * FROM __drizzle_migrations ORDER BY created_at DESC;

-- 테이블 구조 확인
\d notes

-- 인덱스 확인
\d+ notes
```

### 7.2 데이터 검증

```sql
-- 데이터 손실 확인
SELECT COUNT(*) FROM notes;

-- 제약조건 확인
SELECT
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass;
```

## 8. CI/CD 환경에서의 마이그레이션

### 8.1 GitHub Actions 예시

```yaml
# .github/workflows/deploy.yml
name: Deploy with Migration

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy application
        run: npm run deploy
```

### 8.2 Docker 환경에서의 마이그레이션

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# 마이그레이션 실행
RUN npm run db:generate
CMD ["sh", "-c", "npm run db:migrate && npm start"]
```

## 9. 마이그레이션 베스트 프랙티스

### ✅ 해야 할 것들

- **항상 백업 생성**: 마이그레이션 전 데이터베이스 백업
- **단계별 테스트**: 개발 → 스테이징 → 프로덕션 순서
- **마이그레이션 파일 검토**: 생성된 SQL 파일 반드시 확인
- **롤백 계획 수립**: 문제 발생 시 복구 방법 준비
- **버전 관리**: 마이그레이션 파일을 Git에 커밋

### ❌ 하지 말아야 할 것들

- **프로덕션에서 db:push 사용**: 마이그레이션 히스토리 없어짐
- **마이그레이션 파일 직접 수정**: 이미 적용된 파일은 수정 금지
- **백업 없이 마이그레이션**: 데이터 손실 위험
- **대용량 데이터 변환**: 한 번에 모든 데이터 변환하지 말고 배치 처리

## 10. 문제 상황별 체크리스트

### 🔧 마이그레이션 실패 시

1. ☑️ 에러 메시지 확인
2. ☑️ DATABASE_URL 연결 테스트
3. ☑️ 스키마 파일 문법 검사
4. ☑️ 기존 테이블/컬럼과 충돌 확인
5. ☑️ 백업에서 복원 고려

### 🔧 성능 문제 시

1. ☑️ 인덱스 추가 검토
2. ☑️ 쿼리 실행 계획 분석
3. ☑️ 데이터베이스 커넥션 풀 설정
4. ☑️ 대용량 데이터 처리 최적화

이제 안전하고 체계적인 마이그레이션이 가능합니다! 🚀

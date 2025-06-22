import { notFound } from "next/navigation";
import { NotesService } from "@/services/notes/server";
import { ProfilesService } from "@/services/profiles/server";
import {
  formatDate,
  formatDateConditional,
  formatDateKorean,
} from "@/lib/utils/date";

interface NoteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}
// 빌드 시 미리 생성할 경로들 지정
export async function generateStaticParams() {
  // 빈 배열이라도 ISR 동작에는 문제없음
  return [];

  // 또는 일부 인기 노트들만 미리 생성
  // return [
  //   { id: '1' },
  //   { id: '2' },
  // ];
}

// ISR 설정: 5분마다 재검증
export const revalidate = 300;
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  try {
    const { id } = await params;

    // 1. 조회수 증가 없이 노트 조회 (ISR 캐싱됨)
    const note = await NotesService.fetchNote(id);

    // 2. 조회수 증가를 비동기로 처리 (캐시에 영향 없음)
    NotesService.incrementViewCount(id).catch((err) =>
      console.error("조회수 업데이트 실패:", err)
    );

    // 날짜 문자열을 Date 객체로 변환
    const createdAt = new Date(note.createdAt);
    const updatedAt = note.updatedAt ? new Date(note.updatedAt) : null;

    // 작성자 프로필 정보 가져오기
    let authorEmail = note.authorId;
    try {
      const profile = await ProfilesService.getProfileById(note.authorId);
      authorEmail = profile.email || note.authorId;
    } catch (profileError) {
      // 프로필 조회 실패 시 authorId를 그대로 사용
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-lg max-w-none">
          {/* 헤더 섹션 */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {note.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <time dateTime={createdAt.toISOString()}>
                작성일: {formatDateConditional(createdAt)}
              </time>
              {updatedAt && updatedAt.getTime() !== createdAt.getTime() && (
                <time dateTime={updatedAt.toISOString()}>
                  수정일: {formatDateConditional(updatedAt)}
                </time>
              )}
            </div>

            {/* 조회수 표시 - 현재 조회 반영 */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              조회수: {note.viewCount + 1}
            </div>
          </header>

          {/* 본문 내용 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {note.content ? (
              <div
                className="text-gray-800 dark:text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                내용이 없습니다.
              </p>
            )}
          </div>

          {/* 메타 정보 */}
          <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>작성자: {authorEmail}</div>
              <div>노트 ID: {note.id}</div>
            </div>
          </footer>
        </article>
      </div>
    );
  } catch (error) {
    console.error("노트 조회 실패:", error);
    notFound();
  }
}

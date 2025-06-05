import NotesTable from "@/components/features/notes/notes-table";
import { notesService } from "@/services/notes";

interface NotesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

// ✅ 서버 컴포넌트 - 캐싱 적용됨
export default async function NotesPage(props: NotesPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search;
  const noteData = await notesService.server.fetchNotesWithCache(
    page,
    10,
    search
  );

  return (
    <div className="w-full max-w-6xl p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">노트 목록</h1>
            <p className="text-gray-600 mt-1">
              총 {noteData.pagination.totalCount}개의 노트
              {search && (
                <span className="ml-2 text-blue-600">
                  ('{search}' 검색 결과)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 노트 테이블 */}
        <NotesTable
          noteData={noteData}
          page={page}
          searchString={search || ""}
        />
      </div>
    </div>
  );
}

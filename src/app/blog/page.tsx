import NotesList from "@/components/features/notes/notes-list";
import { NotesService } from "@/services/notes/server";

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
  const noteData = await NotesService.fetchNotesWithCache(page, 10, search);
  console.log("하이킥 noteData", noteData);
  return (
    <div className="w-full max-w-6xl p-6">
      {/* 노트 카드 리스트 */}
      <NotesList noteData={noteData} />
    </div>
  );
}

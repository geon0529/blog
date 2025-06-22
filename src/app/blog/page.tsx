import NotesList from "@/components/features/notes/notes-list";
import { NotesService } from "@/services/notes/server";

export const revalidate = 300;

export default async function NotesPage() {
  console.log("🔍 페이지 렌더링 시간:", new Date().toISOString());
  const noteData = await NotesService.fetchNotesWithCache(1, 10, "");

  return (
    <div className="w-full max-w-6xl p-6">
      <NotesList noteData={noteData} />
    </div>
  );
}

import NotesList from "@/components/features/notes/notes-list";

export const revalidate = 300;

export default async function NotesPage() {
  return (
    <div className="w-full max-w-6xl p-6">
      <NotesList />
    </div>
  );
}

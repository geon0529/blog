import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NotesResponse } from "@/services/notes";
import NoteCard from "./note-card";
import Link from "next/link";

interface NotesListProps {
  noteData: NotesResponse;
}

export default function NotesList({ noteData }: NotesListProps) {
  return (
    <div className="w-full max-w-5xl p-6 mx-auto">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">노트 목록</h2>
        <Link href="/blog/create">
          <Button variant="default" className="gap-2">
            <Plus className="w-4 h-4" /> 노트 생성
          </Button>
        </Link>
      </div>
      {/* 노트 카드 리스트 */}
      <div className="grid grid-cols-1 gap-6">
        {noteData.notes.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-500">
            아직 작성된 노트가 없습니다.
          </div>
        ) : (
          noteData.notes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </div>
    </div>
  );
}

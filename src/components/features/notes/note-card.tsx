import React from "react";
import { Badge } from "@/components/ui/badge";
import { Note } from "@/lib/db/queries/notes";
import parse from "html-react-parser";

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
      {/* 날짜 */}
      <span className="text-xs text-muted-foreground mb-1">
        {new Date(note.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </span>
      {/* 제목 */}
      <h3 className="text-xl font-extrabold leading-tight mb-2 text-white">
        {note.title}
      </h3>
      {/* 태그 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {note.tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-xs font-bold tracking-wide"
          >
            {tag.name}
          </Badge>
        ))}
      </div>
      {/* 내용 */}
      <div className="text-base text-muted-foreground line-clamp-3">
        {parse(note.content)}
      </div>
    </div>
  );
}

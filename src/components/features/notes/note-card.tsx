import React from "react";
import { Badge } from "@/components/ui/badge";
import { Note } from "@/lib/db/queries/notes";
import parse from "html-react-parser";
import { formatDateKorean } from "@/lib/utils/date";
import Link from "next/link";

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
      {/* 날짜 */}
      <span className="text-xs text-muted-foreground mb-1">
        {formatDateKorean(note.createdAt)}
      </span>
      {/* 제목 */}
      <Link href={`/blog/${note.id}`}>
        <h3 className="text-xl font-extrabold leading-tight mb-2 text-white hover:text-primary transition-colors cursor-pointer">
          {note.title}
        </h3>
      </Link>
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

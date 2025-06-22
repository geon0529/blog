"use client";

import { useEffect, useState } from "react";
import { ProfilesService } from "@/services/profiles/client";
import { Note } from "@/lib/db/queries";

export default function NoteDetailFooter({ note }: { note: Note }) {
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorEmail = async () => {
      const profile = await ProfilesService.getProfileById(note.authorId);
      setAuthorEmail(profile.email || note.authorId);
    };
    fetchAuthorEmail();
  }, [note.authorId]);

  return (
    <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>작성자: {authorEmail}</div>
        <div>노트 ID: {note.id}</div>
      </div>
    </footer>
  );
}

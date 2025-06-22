"use client";

import NoteEditor from "@/components/features/notes/note-editor";
import { NotesService } from "@/services/notes/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateNotePage() {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createNote, isPending } = useMutation({
    mutationFn: (data: { title: string; content: string; tags?: string[] }) =>
      NotesService.createNote(data.title, data.content, data.tags),
    onSuccess: () => {
      toast.success("노트가 생성되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push("/blog");
    },
    onError: () => {
      toast.error("노트 생성에 실패했습니다.");
    },
  });

  const handleConfirm = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    createNote({ title, content, tags });
  };

  return (
    <div className="w-full mt-20">
      <NoteEditor
        title={title}
        content={content}
        tags={tags}
        setTitle={setTitle}
        setTags={setTags}
        setContent={setContent}
        onConfirm={handleConfirm}
        isLoading={isPending}
      />
    </div>
  );
}

"use client";

import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NoteEditorProps {
  title: string;
  content: string;
  tags: string[];
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setTags: (tags: string[]) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function NoteEditor({
  title,
  content,
  tags,
  setTitle,
  setContent,
  setTags,
  onConfirm,
  isLoading,
}: NoteEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const MAX_TAGS = 10;

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();

      if (!newTag) return;

      if (tags.length >= MAX_TAGS) {
        toast.error(`태그는 최대 ${MAX_TAGS}개까지 등록할 수 있습니다.`);
        return;
      }

      if (tags.includes(newTag)) {
        toast.error("이미 등록된 태그입니다.");
        return;
      }

      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="w-full space-y-6">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="h-16 px-6 py-4 text-3xl font-bold bg-background text-foreground"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground"
            >
              {tag}
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 p-0 hover:bg-transparent hover:text-destructive"
                onClick={() => removeTag(tag)}
              >
                <X className="w-3 h-3" />
                <span className="sr-only">태그 삭제</span>
              </Button>
            </Badge>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={`Tag`}
            className="bg-transparent border border-input rounded-md min-w-[50px] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:outline-none px-2 py-1"
            style={{ width: `${Math.max(50, tagInput.length * 8 + 20)}px` }}
            disabled={tags.length >= MAX_TAGS}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {tags.length}/{MAX_TAGS} 태그
        </p>
      </div>

      <MinimalTiptapEditor
        value={content as string}
        onChange={(content) => setContent(content as string)}
        className="w-full"
        editorContentClassName="p-5"
        output="html"
        placeholder="내용을 입력하세요..."
        autofocus={true}
        editable={true}
        editorClassName="focus:outline-hidden"
      />

      <div className="flex justify-end pt-4">
        <Button onClick={onConfirm} className="px-8" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            "확인"
          )}
        </Button>
      </div>
    </div>
  );
}

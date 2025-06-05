"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { NotesService } from "@/services/notes/client";

interface CreateNoteDialogProps {
  onNoteCreated?: () => void; // 노트 생성 후 콜백
}

export default function CreateNoteDialog({
  onNoteCreated,
}: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 리셋
  const resetForm = () => {
    setTitle("");
    setContent("");
    setError(null);
  };

  // 다이얼로그 닫기
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  // 노트 생성 핸들러
  const handleCreateNote = async () => {
    // 유효성 검사
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await NotesService.createNote(title.trim(), content.trim());
      handleClose();
      onNoteCreated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "노트 생성에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 엔터키 처리 (제목 필드에서 엔터시 내용 필드로 포커스)
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const contentTextarea = document.getElementById(
        "note-content"
      ) as HTMLTextAreaElement;
      contentTextarea?.focus();
    }
  };

  // Ctrl+Enter로 저장
  const handleContentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreateNote();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />새 노트 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 노트 작성</DialogTitle>
          <DialogDescription>
            새로운 노트를 작성하세요. Ctrl+Enter로 빠르게 저장할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 제목 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="note-title">제목</Label>
            <Input
              id="note-title"
              placeholder="노트 제목을 입력하세요..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleTitleKeyPress}
              disabled={loading}
              className="text-base"
            />
          </div>

          {/* 내용 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="note-content">내용</Label>
            <Textarea
              id="note-content"
              placeholder="노트 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyPress={handleContentKeyPress}
              disabled={loading}
              className="min-h-[200px] text-base resize-none"
            />
            <p className="text-xs text-gray-500">
              팁: Ctrl+Enter를 눌러 빠르게 저장할 수 있습니다.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading} onClick={resetForm}>
              취소
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreateNote}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              "노트 저장"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

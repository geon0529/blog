"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Note } from "@/lib/db/queries/notes";
import { formatDateConditional } from "@/lib/utils/date";
import { NotesService } from "@/services/notes/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NoteDetailHeaderProps {
  note: Note;
  isOwner: boolean;
}

export default function NoteDetailHeader({
  note,
  isOwner,
}: NoteDetailHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // 날짜 문자열을 Date 객체로 변환
  const createdAt = new Date(note.createdAt);
  const updatedAt = note.updatedAt ? new Date(note.updatedAt) : null;

  const { mutate: deleteNote, isPending: isDeleting } = useMutation({
    mutationFn: () => {
      return NotesService.deleteNote(note.id);
    },
    onSuccess: async (data) => {
      // 성공 응답 확인
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        toast.success("노트가 삭제되었습니다.");
        setIsDeleteDialogOpen(false);
        router.push("/blog");
      } else {
        toast.error("노트 삭제에 실패했습니다.");
      }
    },
    onError: (error) => {
      console.error("노트 삭제 오류:", error);
      toast.error("노트 삭제에 실패했습니다.");
    },
  });

  // 수정 버튼용 더미 mutation (실제 수정 기능은 아직 구현되지 않음)
  const { mutate: editNote, isPending: isEditing } = useMutation({
    mutationFn: () => {
      // TODO: 실제 수정 기능 구현
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success("수정 기능은 준비 중입니다.");
    },
    onError: () => {
      toast.error("수정에 실패했습니다.");
    },
  });

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteNote();
  };

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {note.title}
          </h1>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isDeleting || isEditing}
                    onClick={() => editNote()}
                  >
                    {isEditing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="py-1">
                  <div>{isEditing ? "수정 중..." : "수정"}</div>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                    onClick={handleDeleteClick}
                    disabled={isDeleting || isEditing}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="py-1">
                  <div>삭제</div>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <time dateTime={createdAt.toISOString()}>
            작성일: {formatDateConditional(createdAt)}
          </time>
          {updatedAt && updatedAt.getTime() !== createdAt.getTime() && (
            <time dateTime={updatedAt.toISOString()}>
              수정일: {formatDateConditional(updatedAt)}
            </time>
          )}
        </div>

        {/* 조회수 표시 - 현재 조회 반영 */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          조회수: {note.viewCount + 1}
        </div>
      </header>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              "{note.title}" 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "네, 삭제합니다"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

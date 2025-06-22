"use client";
import React, { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Loader2 } from "lucide-react";
import { NotesResponse } from "@/services/notes";
import NoteCard from "./note-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotesService } from "@/services/notes/client";
import { revalidateNotes } from "@/services/notes/revalidate";
import { Note } from "@/lib/db/queries";
import { useUserInfo } from "@/hooks/useUserInfo";
import { isApiError } from "@/lib/api/errors/error";

export default function NotesList() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUserInfo();
  const currentUserId = user?.id;
  const currentUserEmail = user?.email;

  const {
    data: noteData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notes"],
    queryFn: () => NotesService.searchNotes("", 1),
  });

  // noteData가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    if (noteData?.notes) {
      setLocalNotes(noteData.notes);
    }
  }, [noteData?.notes]);

  // 좋아요 토글 mutation
  const likeMutation = useMutation({
    mutationFn: (noteId: string) => NotesService.toggleNoteLike(noteId),
    onSuccess: (data, noteId) => {
      setError(null);
      // 캐시 무효화하여 최신 데이터를 가져오도록 함
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error, noteId) => {
      // 실패 시 낙관적 업데이트를 롤백
      setLocalNotes((prevNotes) =>
        prevNotes.map((note) => {
          if (note.id === noteId) {
            const wasLiked = note.likes.users.some(
              (user) => user.id === currentUserId
            );
            return {
              ...note,
              likes: {
                ...note.likes,
                count: wasLiked ? note.likes.count + 1 : note.likes.count - 1,
                users: wasLiked
                  ? [
                      ...note.likes.users,
                      { id: currentUserId!, email: currentUserEmail! },
                    ]
                  : note.likes.users.filter(
                      (user) => user.id !== currentUserId
                    ),
              },
            };
          }
          return note;
        })
      );

      if (isApiError(error)) {
        setError(error.message);
      } else {
        setError("좋아요 처리에 실패했습니다.");
      }
    },
  });

  // 현재 유저가 해당 노트에 좋아요했는지 확인
  const isLikedByCurrentUser = (note: Note): boolean => {
    if (!currentUserId) return false;
    return note.likes.users.some((user) => user.id === currentUserId);
  };

  // 좋아요 토글 처리 (낙관적 업데이트)
  const handleLikeToggle = async (noteId: string) => {
    if (!currentUserId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setError(null);

    // 현재 좋아요 상태 확인
    const currentNote = localNotes.find((note) => note.id === noteId);
    if (!currentNote) return;

    const isCurrentlyLiked = isLikedByCurrentUser(currentNote);

    // 즉시 UI 업데이트 (낙관적 업데이트)
    setLocalNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            likes: {
              ...note.likes,
              count: isCurrentlyLiked
                ? note.likes.count - 1
                : note.likes.count + 1,
              users: isCurrentlyLiked
                ? note.likes.users.filter((user) => user.id !== currentUserId)
                : [
                    ...note.likes.users,
                    { id: currentUserId, email: currentUserEmail! },
                  ],
            },
          };
        }
        return note;
      })
    );
    likeMutation.mutate(noteId);
  };

  // 수동 캐시 새로고침
  const handleRefresh = async () => {
    setError(null);
    await revalidateNotes();
    await queryClient.invalidateQueries({ queryKey: ["notes"] });
    await refetch();
  };

  return (
    <div className="w-full max-w-5xl p-6 mx-auto">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">노트 목록</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <Loader2
              className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>
          <Link href="/blog/create">
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" /> 노트 생성
            </Button>
          </Link>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline hover:no-underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* 노트 카드 리스트 */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="col-span-1 py-12 text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            노트를 불러오는 중...
          </div>
        ) : localNotes.length === 0 ? (
          <div className="col-span-1 py-12 text-center text-gray-500">
            아직 작성된 노트가 없습니다.
          </div>
        ) : (
          localNotes.map((note) => (
            <div key={note.id} className="relative">
              <NoteCard note={note} />
              {/* 좋아요 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!currentUserId}
                onClick={() => handleLikeToggle(note.id)}
                className={`absolute top-4 right-4 h-8 w-8 p-0 transition-all duration-200 hover:bg-transparent hover:scale-110 ${
                  isLikedByCurrentUser(note)
                    ? "text-destructive hover:text-destructive/80"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                title={
                  currentUserId
                    ? isLikedByCurrentUser(note)
                      ? "좋아요 취소"
                      : "좋아요"
                    : "로그인 필요"
                }
              >
                <div className="flex items-center gap-1">
                  <Heart
                    className={`h-4 w-4 transition-all duration-200 ${
                      isLikedByCurrentUser(note)
                        ? "fill-current scale-110"
                        : "hover:scale-110"
                    }`}
                  />
                  <span
                    className={`text-sm transition-colors duration-200 ${
                      isLikedByCurrentUser(note)
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {note.likes.count}
                  </span>
                </div>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, Search, RefreshCw, Heart } from "lucide-react";
import CreateNoteDialog from "@/components/features/notes/create-note-dialog";
import Paginator from "@/components/ui/paginator";
import ConfirmDialog from "@/components/dialogs/confirm-dialog";
import { formatDateConditional } from "@/lib/utils/date";
import { NotesService } from "@/services/notes/client";
import { revalidateNotes } from "@/services/notes/revalidate";
import { NotesResponse } from "@/services/notes";
import { Note } from "@/lib/db/queries";
import { useUserInfo } from "@/hooks/useUserInfo";
import { isApiError } from "@/lib/api/errors/error";

interface NotesTableProps {
  noteData: NotesResponse;
  page: number;
  searchString: string;
}

export default function NotesTable({
  noteData,
  page,
  searchString,
}: NotesTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>(searchString);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || page;
  const { data: user } = useUserInfo();
  const currentUserId = user?.id;

  // 좋아요 토글 mutation
  const likeMutation = useMutation({
    mutationFn: (noteId: string) => NotesService.toggleNoteLike(noteId),
    onSuccess: (data, noteId) => {
      console.log("좋아요 성공:", data);
      setError(null);
      startTransition(() => {
        router.refresh();
      });
    },
    onError: (error, noteId) => {
      console.error("좋아요 실패:", error);
      if (isApiError(error)) {
        setError(error.message);
      } else {
        setError("좋아요 처리에 실패했습니다.");
      }
    },
  });

  // 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => NotesService.deleteNote(noteId),
    onSuccess: (data, noteId) => {
      console.log("삭제 성공:", data);
      setError(null);

      startTransition(() => {
        // 마지막 페이지에서 마지막 노트를 삭제하는 경우 이전 페이지로 이동
        const shouldGoToPreviousPage =
          noteData.notes.length === 1 && currentPage > 1;

        if (shouldGoToPreviousPage) {
          const newPage = currentPage - 1;
          const params = new URLSearchParams(searchParams);
          params.set("page", newPage.toString());
          router.push(`/notes?${params.toString()}`);
        } else {
          router.refresh();
        }
      });
    },
    onError: (error, noteId) => {
      console.error("삭제 실패:", error);
      if (isApiError(error)) {
        setError(error.message);
      } else {
        setError("삭제에 실패했습니다.");
      }
    },
  });

  // 현재 유저가 해당 노트에 좋아요했는지 확인
  const isLikedByCurrentUser = (note: Note): boolean => {
    if (!currentUserId) return false;
    return note.likes.users.some((user) => user.id === currentUserId);
  };

  // 좋아요 토글 처리
  const handleLikeToggle = async (noteId: string) => {
    if (!currentUserId) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (likeMutation.isPending) {
      return; // 이미 처리 중
    }

    setError(null);
    likeMutation.mutate(noteId);
  };

  // 삭제 처리
  const handleDelete = async (noteId: string) => {
    if (deleteMutation.isPending) {
      return; // 이미 처리 중
    }

    setError(null);
    deleteMutation.mutate(noteId);
  };

  // 검색 처리 - useTransition 활용
  const handleSearch = () => {
    setError(null);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      router.push(`/notes?${params.toString()}`);
    });
  };

  // 페이지 변경 - useTransition 활용
  const handlePageChange = (page: number) => {
    setError(null);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.push(`/notes?${params.toString()}`);
    });
  };

  // 수동 캐시 새로고침 - useTransition 활용
  const handleRefresh = async () => {
    setError(null);
    await revalidateNotes();
    startTransition(() => {
      router.refresh();
    });
  };

  // Enter 키 검색 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 내용 미리보기
  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  // 노트 상태 판단
  const getNoteBadge = (note: Note) => {
    const now = new Date();
    const createdAt = new Date(note.createdAt);
    const updatedAt = new Date(note.updatedAt);

    const daysDiff = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isRecentlyUpdated =
      updatedAt.getTime() !== createdAt.getTime() &&
      Math.floor(
        (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      ) <= 1;

    if (daysDiff <= 1) {
      return (
        <Badge variant="default" className="text-xs text-nowrap">
          새 노트
        </Badge>
      );
    } else if (isRecentlyUpdated) {
      return (
        <Badge variant="secondary" className="text-xs">
          최근 수정
        </Badge>
      );
    } else if (note.content.length > 200) {
      return (
        <Badge variant="outline" className="text-xs">
          긴 글
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* 상단 액션 바 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* 검색 */}
          <Input
            placeholder="노트 제목 또는 내용으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-80"
            disabled={isPending}
          />
          <Button onClick={handleSearch} variant="outline" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>

          <CreateNoteDialog onNoteCreated={handleRefresh} />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* shadcn Table */}
      <div
        className={`w-full border rounded-lg transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        <Table>
          <TableCaption className="w-full m-0">
            <Paginator
              pagination={noteData.pagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              disabled={isPending}
              className="mt-4 mb-4"
            />
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[8%]">ID</TableHead>
              <TableHead className="w-[12%]">제목</TableHead>
              <TableHead className="w-[20%]">내용 미리보기</TableHead>
              <TableHead className="w-[8%]">상태</TableHead>
              <TableHead className="w-[8%]">좋아요</TableHead>
              <TableHead className="w-[17%]">생성일</TableHead>
              <TableHead className="w-[17%]">수정일</TableHead>
              <TableHead className="w-[10%]">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noteData.notes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 py-8"
                >
                  {searchQuery
                    ? "검색 결과가 없습니다."
                    : "아직 작성된 노트가 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              noteData.notes.map((note) => (
                <TableRow key={note.id} className="hover:bg-accent">
                  <TableCell className="font-mono text-xs text-gray-500">
                    {note.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/notes/${note.id}`}
                      className="font-medium text-primary hover:text-primary-foreground hover:underline"
                    >
                      {note.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {truncateContent(note.content)}
                  </TableCell>
                  <TableCell>{getNoteBadge(note)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Heart
                        className={`h-4 w-4 ${
                          isLikedByCurrentUser(note)
                            ? "text-red-500 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {note.likes.count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateConditional(note.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateConditional(note.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* 좋아요 버튼 */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          likeMutation.isPending || isPending || !currentUserId
                        }
                        onClick={() => handleLikeToggle(note.id)}
                        className={`h-8 w-8 p-0 transition-colors ${
                          isLikedByCurrentUser(note)
                            ? "text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                            : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                        title={
                          currentUserId
                            ? isLikedByCurrentUser(note)
                              ? "좋아요 취소"
                              : "좋아요"
                            : "로그인 필요"
                        }
                      >
                        {likeMutation.isPending &&
                        likeMutation.variables === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-4 w-4 ${
                              isLikedByCurrentUser(note) ? "fill-current" : ""
                            }`}
                          />
                        )}
                      </Button>

                      {/* 삭제 버튼 */}
                      <ConfirmDialog
                        title={`${note.title} 노트를 정말 삭제하시겠습니까?`}
                        description="이 작업은 되돌릴 수 없습니다. 노트가 영구적으로 삭제되며 서버에서 모든 데이터가 제거됩니다."
                        onConfirm={async () => await handleDelete(note.id)}
                        loading={
                          (deleteMutation.isPending &&
                            deleteMutation.variables === note.id) ||
                          isPending
                        }
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteMutation.isPending || isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleteMutation.isPending &&
                            deleteMutation.variables === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

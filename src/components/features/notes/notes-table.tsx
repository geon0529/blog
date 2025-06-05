"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Trash2, Loader2, Search, RefreshCw } from "lucide-react";
import CreateNoteDialog from "@/components/features/notes/create-note-dialog";
import Paginator from "@/components/ui/paginator";
import { Note } from "@/lib/db/schemas";
import { PaginationInfo } from "@/types/common.types";
import ConfirmDialog from "@/components/dialogs/confirm-dialog";
import {
  formatDateConditional,
  formatDateDetailed,
  formatDateKorean,
} from "@/lib/utils/date";
import { notesService } from "@/services/notes";

interface NotesResponse {
  notes: Note[];
  pagination: PaginationInfo;
  search?: string;
}

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || page;

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await notesService.client.deleteNote(id);
      startTransition(async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
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
  const handleRefresh = () => {
    setError(null);
    router.refresh();
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
              <TableHead className="w-[10%]">ID</TableHead>
              <TableHead className="w-[10%]">제목</TableHead>
              <TableHead className="w-[20%]">내용 미리보기</TableHead>
              <TableHead className="w-[10%]">상태</TableHead>
              <TableHead className="w-[20%]">생성일</TableHead>
              <TableHead className="w-[20%]">수정일</TableHead>
              <TableHead className="w-[10%]">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noteData.notes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                  <TableCell className="text-sm text-gray-500">
                    {formatDateConditional(note.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateConditional(note.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <ConfirmDialog
                      title={`${note.title} 노트를 정말 삭제하시겠습니까?`}
                      description="이 작업은 되돌릴 수 없습니다. 계정이 영구적으로 삭제되며 서버에서 모든 데이터가 제거됩니다."
                      onConfirm={() => handleDelete(note.id)}
                      loading={deleting === note.id}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleting === note.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-accent"
                        >
                          {deleting === note.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      }
                    ></ConfirmDialog>
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

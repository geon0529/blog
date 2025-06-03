import React from "react";
import { Button } from "@/components/ui/button";
import { PaginationInfo } from "@/types/common.type";

interface PaginatorProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function Paginator({
  pagination,
  currentPage,
  onPageChange,
  disabled = false,
  className = "",
}: PaginatorProps) {
  // 페이지네이션이 필요 없는 경우 렌더링하지 않음
  if (pagination.totalPages <= 1) {
    return null;
  }

  // 페이지 번호 배열 생성 (최대 5개)
  const generatePageNumbers = () => {
    const totalPages = pagination.totalPages;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하인 경우
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      // 현재 페이지가 앞쪽에 있는 경우
      return Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
    }

    if (currentPage >= totalPages - 2) {
      // 현재 페이지가 뒤쪽에 있는 경우
      return Array.from(
        { length: maxVisiblePages },
        (_, i) => totalPages - maxVisiblePages + 1 + i
      );
    }

    // 현재 페이지가 중간에 있는 경우
    return Array.from(
      { length: maxVisiblePages },
      (_, i) => currentPage - 2 + i
    );
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      {/* 처음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!pagination.hasPreviousPage || disabled}
        aria-label="첫 페이지로 이동"
      >
        처음
      </Button>

      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!pagination.hasPreviousPage || disabled}
        aria-label="이전 페이지로 이동"
      >
        이전
      </Button>

      {/* 페이지 번호들 */}
      <div className="flex gap-1">
        {pageNumbers.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="w-8"
            disabled={disabled}
            aria-label={`${pageNum}페이지로 이동`}
            aria-current={currentPage === pageNum ? "page" : undefined}
          >
            {pageNum}
          </Button>
        ))}
      </div>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!pagination.hasNextPage || disabled}
        aria-label="다음 페이지로 이동"
      >
        다음
      </Button>

      {/* 마지막 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.totalPages)}
        disabled={!pagination.hasNextPage || disabled}
        aria-label="마지막 페이지로 이동"
      >
        마지막
      </Button>
    </div>
  );
}

import { useState, useCallback } from "react";

// 타입 정의
export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse {
  notes: Note[];
  pagination: Pagination;
  filters: {
    search: string;
    sortBy: string;
    sortOrder: string;
  };
}

export interface UseNotesParams {
  initialLimit?: number;
}

export interface UseNotesReturn {
  // 상태
  notes: Note[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;

  // 액션
  fetchNotes: (
    page?: number,
    search?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ) => Promise<void>;
  createNote: (title: string, content: string) => Promise<boolean>;
  updateNote: (id: number, title: string, content: string) => Promise<boolean>;
  deleteNote: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useNotes = ({
  initialLimit = 5,
}: UseNotesParams = {}): UseNotesReturn => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchNotes = useCallback(
    async (
      page = 1,
      search = "",
      sortBy = "createdAt",
      sortOrder: "asc" | "desc" = "desc"
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/notes?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data: ApiResponse = await response.json();

        setNotes(data.notes);
        setPagination(data.pagination);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch notes";
        setError(errorMessage);
        console.error("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  const createNote = useCallback(
    async (title: string, content: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create note");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create note";
        setError(errorMessage);
        console.error("Error creating note:", err);
        return false;
      }
    },
    []
  );

  const updateNote = useCallback(
    async (id: number, title: string, content: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update note");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update note";
        setError(errorMessage);
        console.error("Error updating note:", err);
        return false;
      }
    },
    []
  );

  const deleteNote = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete note");
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete note";
      setError(errorMessage);
      console.error("Error deleting note:", err);
      return false;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    pagination,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    clearError,
  };
};

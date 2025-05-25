"use client";

import { useState, useEffect, useCallback } from "react";

// 타입 정의
interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ApiResponse {
  notes: Note[];
  pagination: Pagination;
  filters: {
    search: string;
    sortBy: string;
    sortOrder: string;
  };
}

export default function NotesPage() {
  // 상태 관리
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // 필터링 상태
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 폼 상태
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  // 노트 목록 조회
  const fetchNotes = useCallback(
    async (page = 1, searchQuery = search) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: searchQuery,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/notes?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        setNotes(data.notes);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch notes");
        console.error("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, sortBy, sortOrder, pagination.limit]
  );

  // 초기 로드
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 검색 핸들러 (디바운싱)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchNotes(1, search);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search, fetchNotes]);

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // 노트 생성
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create note");
      }

      setFormData({ title: "", content: "" });
      setIsCreating(false);
      fetchNotes(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setSubmitting(false);
    }
  };

  // 노트 수정
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingNote || !formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update note");
      }

      setEditingNote(null);
      setFormData({ title: "", content: "" });
      fetchNotes(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setSubmitting(false);
    }
  };

  // 노트 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete note");
      }

      fetchNotes(); // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  // 편집 시작
  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsCreating(false);
  };

  // 생성 시작
  const startCreate = () => {
    setIsCreating(true);
    setEditingNote(null);
    setFormData({ title: "", content: "" });
  };

  // 모달 닫기
  const closeModal = () => {
    setIsCreating(false);
    setEditingNote(null);
    setFormData({ title: "", content: "" });
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notes Manager</h1>
        <button
          onClick={startCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create Note
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border rounded-md hover:bg-gray-100"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {pagination.total} notes found
          {search && ` • Searching for "${search}"`}
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading notes...</p>
        </div>
      ) : (
        <>
          {/* 노트 목록 */}
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search
                ? `No notes found for "${search}"`
                : "No notes yet. Create your first note!"}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                      {note.title}
                    </h3>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {note.content}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
                    {note.updatedAt !== note.createdAt && (
                      <p>
                        Updated: {new Date(note.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => fetchNotes(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => fetchNotes(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* 생성/편집 모달 */}
      {(isCreating || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingNote ? "Edit Note" : "Create New Note"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={editingNote ? handleUpdate : handleCreate}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter note title"
                    maxLength={200}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/200 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter note content"
                    rows={8}
                    maxLength={10000}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData?.content?.length}/10,000 characters
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Saving..."
                      : editingNote
                        ? "Update"
                        : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

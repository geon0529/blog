/**
 * note 전체 조회
 * @param {number} page
 * @param {number} limit
 * @param {string?} search
 */
export async function fetchNotes(page = 1, limit = 10, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await fetch(`/api/notes?${params}`);
  const data = await response.json();

  return data;
  /* 응답 형태:
  {
    notes: Note[],
    pagination: {
      currentPage: number,
      totalPages: number,
      totalCount: number,
      hasNextPage: boolean,
      hasPreviousPage: boolean
    },
    search?: string
  }
  */
}

/**
 * id 기반 특정 노트 조회
 * @param {string} id
 */
export async function fetchNote(id: string) {
  const response = await fetch(`/api/notes/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch note");
  }

  return await response.json();
}

/**
 * 노트 생성
 * @param {string} title
 * @param {string} content
 */
export async function createNote(title: string, content: string) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create note");
  }

  return await response.json();
}

/**
 * 노트 업데이트
 * @param {string} id
 * @param {string?} updates.title
 * @param {string?} updates.content
 */
export async function updateNote(
  id: string,
  updates: { title?: string; content?: string }
) {
  const response = await fetch(`/api/notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update note");
  }

  return await response.json();
}

/**
 * 노트 삭제
 * @param {string} id
 */
export async function deleteNote(id: string) {
  const response = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete note");
  }

  return await response.json();
}

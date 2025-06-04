// app/lib/posts-actions.ts
"use server";

import { API_BASE_URL } from "@/lib/constants";
import { Post, PostWithLikeCount } from "@/lib/db/schema";
import { PaginationInfo } from "@/types/common.type";
import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface PostsResponse {
  posts: PostWithLikeCount[];
  pagination: PaginationInfo;
  search?: string;
}

interface PopularPostsResponse {
  posts: PostWithLikeCount[];
}

interface TagsResponse {
  tags: string[];
}

/**
 * post 전체 조회 (서버 액션)
 * 서버와 클라이언트 양쪽에서 사용 가능, 캐싱 적용
 */
export async function fetchPosts(
  page: number = 1,
  limit: number = 10,
  search?: string,
  userId?: string
): Promise<PostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  if (userId) {
    params.append("userId", userId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/posts?${params}`, {
      next: {
        tags: [
          "posts",
          `posts-page-${page}`,
          search ? `posts-search-${search}` : "posts-all",
        ],
        revalidate: 300, // 5분간 캐싱
      },
    });

    if (!response.ok) {
      throw new Error("포스트를 불러오는데 실패했습니다.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("fetchPosts error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "포스트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * id 기반 특정 포스트 조회 (서버 액션)
 */
export async function fetchPost(
  id: string,
  userId?: string
): Promise<PostWithLikeCount> {
  try {
    const params = userId ? `?userId=${userId}` : "";
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}${params}`, {
      next: {
        tags: ["posts", `post-${id}`],
        revalidate: 300, // 5분간 캐싱 (조회수 때문에 shorter)
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch post");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchPost error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch post"
    );
  }
}

/**
 * 포스트 생성 (서버 액션) - 객체 인자 버전
 */
export async function createPost(data: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<Post> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create post");
    }

    const newPost = await response.json();

    // 캐시 무효화
    revalidateTag("posts");
    revalidateTag("posts-all");
    console.log("🔄 Cache invalidated: posts, posts-all");

    return newPost;
  } catch (error) {
    console.error("createPost error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create post"
    );
  }
}

/**
 * 포스트 생성 (서버 액션) - FormData 버전
 */
export async function createPostFromForm(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tagsString = formData.get("tags") as string;

  if (!title?.trim() || !content?.trim()) {
    throw new Error("제목과 내용은 필수입니다.");
  }

  const tags = tagsString
    ? tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  try {
    await createPost({
      title: title.trim(),
      content: content.trim(),
      tags,
    });

    revalidatePath("/posts");
  } catch (error) {
    console.error("createPostFromForm error:", error);
    throw error;
  }

  redirect("/posts");
}

/**
 * 포스트 업데이트 (서버 액션)
 */
export async function updatePost(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<Post> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update post");
    }

    const updatedPost = await response.json();

    // 관련 캐시 무효화
    revalidateTag("posts");
    revalidateTag(`post-${id}`);
    revalidateTag("posts-all");
    console.log(`🔄 Cache invalidated: posts, post-${id}, posts-all`);

    return updatedPost;
  } catch (error) {
    console.error("updatePost error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update post"
    );
  }
}

/**
 * 포스트 업데이트 (서버 액션) - FormData 버전
 */
export async function updatePostFromForm(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tagsString = formData.get("tags") as string;

  const updates: { title?: string; content?: string; tags?: string[] } = {};
  if (title?.trim()) updates.title = title.trim();
  if (content?.trim()) updates.content = content.trim();
  if (tagsString !== null) {
    updates.tags = tagsString
      ? tagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("수정할 내용이 없습니다.");
  }

  try {
    await updatePost(id, updates);
    revalidatePath(`/posts/${id}`);
    revalidatePath("/posts");
  } catch (error) {
    console.error("updatePostFromForm error:", error);
    throw error;
  }

  redirect(`/posts/${id}`);
}

/**
 * 포스트 삭제 (서버 액션)
 */
export async function deletePost(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete post");
    }

    const result = await response.json();

    // 관련 캐시 무효화
    revalidateTag("posts");
    revalidateTag(`post-${id}`);
    revalidateTag("posts-all");
    console.log(`🔄 Cache invalidated: posts, post-${id}, posts-all`);

    return result;
  } catch (error) {
    console.error("deletePost error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete post"
    );
  }
}

/**
 * 포스트 삭제 (서버 액션) - 리디렉션 포함 버전
 */
export async function deletePostWithRedirect(id: string) {
  try {
    await deletePost(id);
    revalidatePath("/posts");
  } catch (error) {
    console.error("deletePostWithRedirect error:", error);
    throw error;
  }

  redirect("/posts");
}

/**
 * 포스트 조회수 증가 (서버 액션)
 */
export async function incrementPostViews(id: string): Promise<Post> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}/views`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to increment views");
    }

    const updatedPost = await response.json();

    // 포스트 캐시만 무효화 (목록은 그대로 둠)
    revalidateTag(`post-${id}`);

    return updatedPost;
  } catch (error) {
    console.error("incrementPostViews error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to increment views"
    );
  }
}

/**
 * 포스트 좋아요 토글 (서버 액션)
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<Post> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to toggle like");
    }

    const updatedPost = await response.json();

    // 관련 캐시 무효화
    revalidateTag("posts");
    revalidateTag(`post-${postId}`);
    revalidateTag("posts-all");

    return updatedPost;
  } catch (error) {
    console.error("togglePostLike error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to toggle like"
    );
  }
}

/**
 * 태그별 포스트 조회 (서버 액션)
 */
export async function fetchPostsByTag(
  tag: string,
  page: number = 1,
  limit: number = 10,
  userId?: string
): Promise<PostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    tag,
  });

  if (userId) {
    params.append("userId", userId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/by-tag?${params}`, {
      next: {
        tags: ["posts", `posts-tag-${tag}`, `posts-tag-${tag}-page-${page}`],
        revalidate: 300,
      },
    });

    if (!response.ok) {
      throw new Error("태그별 포스트를 불러오는데 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchPostsByTag error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "태그별 포스트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * 인기 포스트 조회 (좋아요 수 기준)
 */
export async function fetchPopularPosts(
  limit: number = 10,
  userId?: string
): Promise<PopularPostsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (userId) {
    params.append("userId", userId);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/posts/popular?${params}`,
      {
        next: {
          tags: ["posts", "posts-popular"],
          revalidate: 600, // 10분간 캐싱
        },
      }
    );

    if (!response.ok) {
      throw new Error("인기 포스트를 불러오는데 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchPopularPosts error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "인기 포스트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * 조회수 기준 인기 포스트 조회
 */
export async function fetchMostViewedPosts(
  limit: number = 10,
  userId?: string
): Promise<PopularPostsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (userId) {
    params.append("userId", userId);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/posts/most-viewed?${params}`,
      {
        next: {
          tags: ["posts", "posts-most-viewed"],
          revalidate: 600,
        },
      }
    );

    if (!response.ok) {
      throw new Error("조회수 기준 인기 포스트를 불러오는데 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchMostViewedPosts error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "조회수 기준 인기 포스트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * 모든 태그 조회 (서버 액션)
 */
export async function fetchAllTags(): Promise<TagsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/tags`, {
      next: {
        tags: ["posts", "posts-tags"],
        revalidate: 1800, // 30분간 캐싱 (태그는 자주 바뀌지 않음)
      },
    });

    if (!response.ok) {
      throw new Error("태그를 불러오는데 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchAllTags error:", error);
    throw new Error(
      error instanceof Error ? error.message : "태그를 불러오는데 실패했습니다."
    );
  }
}

/**
 * 사용자가 좋아요한 포스트들 조회
 */
export async function fetchLikedPostsByUser(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    userId,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/liked?${params}`, {
      next: {
        tags: [
          "posts",
          `posts-liked-${userId}`,
          `posts-liked-${userId}-page-${page}`,
        ],
        revalidate: 300,
      },
    });

    if (!response.ok) {
      throw new Error("좋아요한 포스트를 불러오는데 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchLikedPostsByUser error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "좋아요한 포스트를 불러오는데 실패했습니다."
    );
  }
}

/**
 * 검색 전용 함수 (서버 액션)
 */
export async function searchPosts(
  searchQuery: string,
  page: number = 1,
  userId?: string
): Promise<PostsResponse> {
  return fetchPosts(page, 10, searchQuery, userId);
}

/**
 * 캐시 수동 무효화 (서버 액션)
 */
export async function revalidatePostsCache(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    revalidateTag("posts");
    revalidateTag("posts-all");
    revalidateTag("posts-popular");
    revalidateTag("posts-most-viewed");
    revalidateTag("posts-tags");
    revalidatePath("/posts");

    console.log("🔄 Manual cache invalidation completed for posts");

    return {
      success: true,
      message: "포스트 캐시가 성공적으로 무효화되었습니다.",
    };
  } catch (error) {
    console.error("revalidatePostsCache error:", error);
    throw new Error("캐시 무효화에 실패했습니다.");
  }
}

// =====================================
// 사용 예제 (클라이언트 컴포넌트에서)
// =====================================

/*
"use client";

import { 
  fetchPosts, 
  fetchPost, 
  createPost, 
  updatePost, 
  deletePost,
  togglePostLike,
  incrementPostViews,
  fetchPostsByTag,
  fetchPopularPosts,
  revalidatePostsCache 
} from '@/lib/posts-actions';
import { useTransition } from 'react';

export function PostsClient({ userId }: { userId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState([]);

  // 포스트 목록 로드
  const loadPosts = async () => {
    try {
      const data = await fetchPosts(1, 10, undefined, userId);
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  // 포스트 생성
  const handleCreate = async (title: string, content: string, tags: string[]) => {
    startTransition(async () => {
      try {
        await createPost({ title, content, tags });
        await loadPosts();
      } catch (error) {
        console.error('Failed to create post:', error);
      }
    });
  };

  // 좋아요 토글
  const handleLike = async (postId: string) => {
    if (!userId) return;
    
    startTransition(async () => {
      try {
        await togglePostLike(postId, userId);
        await loadPosts();
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    });
  };

  // 조회수 증가
  const handleViewPost = async (postId: string) => {
    try {
      await incrementPostViews(postId);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleLike('post-id')} disabled={isPending}>
        {isPending ? '처리 중...' : '좋아요'}
      </button>
      
      <!-- 폼에서 직접 서버 액션 사용 -->
      <form action={createPostFromForm}>
        <input name="title" placeholder="제목" required />
        <textarea name="content" placeholder="내용" required />
        <input name="tags" placeholder="태그 (쉼표로 구분)" />
        <button type="submit">포스트 작성</button>
      </form>
    </div>
  );
}
*/

// =====================================
// 사용 예제 (서버 컴포넌트에서)
// =====================================

/*
// app/posts/page.tsx
import { fetchPosts, fetchPopularPosts } from '@/lib/posts-actions';

export default async function PostsPage() {
  const [posts, popularPosts] = await Promise.all([
    fetchPosts(1, 10),
    fetchPopularPosts(5)
  ]);
  
  return (
    <div>
      <h1>포스트 목록</h1>
      <p>총 {posts.pagination.totalCount}개의 포스트</p>
      
      <section>
        <h2>인기 포스트</h2>
        {popularPosts.posts.map(post => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>좋아요: {post.likeCount}, 조회수: {post.views}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// app/posts/[id]/page.tsx
import { fetchPost, incrementPostViews } from '@/lib/posts-actions';

export default async function PostPage({ params }: { params: { id: string } }) {
  // 조회수 증가와 포스트 조회를 동시에
  const [_, post] = await Promise.all([
    incrementPostViews(params.id),
    fetchPost(params.id)
  ]);
  
  return (
    <div>
      <h1>{post.title}</h1>
      <div>조회수: {post.views} | 좋아요: {post.likeCount}</div>
      <div>태그: {post.tags.join(', ')}</div>
      <p>{post.content}</p>
      
      <!-- 수정/삭제 폼 -->
      <form action={updatePostFromForm.bind(null, params.id)}>
        <input name="title" defaultValue={post.title} />
        <textarea name="content" defaultValue={post.content} />
        <input name="tags" defaultValue={post.tags.join(', ')} />
        <button type="submit">수정</button>
      </form>
    </div>
  );
}
*/

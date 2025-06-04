import { db } from "../index";
import {
  posts,
  type Post,
  type CreatePost,
  type UpdatePost,
  type PostWithLikeCount,
} from "../schema";
import { eq, desc, ilike, or, count, arrayContains, sql } from "drizzle-orm";

/**
 * 모든 포스트 조회
 * @returns
 */
export async function getAllPosts(): Promise<Post[]> {
  return await db.select().from(posts).orderBy(desc(posts.createdAt));
}

/**
 * ID로 포스트 조회 (UUID 사용)
 * @returns
 */
export async function getPostById(id: string): Promise<Post | undefined> {
  const result = await db.select().from(posts).where(eq(posts.id, id));
  return result[0];
}

/**
 * 좋아요 수를 포함한 포스트 조회
 * @returns
 */
export async function getPostWithLikeCount(
  id: string,
  currentUserId?: string
): Promise<PostWithLikeCount | undefined> {
  const post = await getPostById(id);
  if (!post) return undefined;

  return {
    ...post,
    likeCount: post.likedUserIds.length,
    isLikedByUser: currentUserId
      ? post.likedUserIds.includes(currentUserId)
      : false,
  };
}

/**
 * 모든 포스트를 좋아요 수와 함께 조회
 * @returns
 */
export async function getAllPostsWithLikeCount(
  currentUserId?: string
): Promise<PostWithLikeCount[]> {
  const allPosts = await getAllPosts();

  return allPosts.map((post) => ({
    ...post,
    likeCount: post.likedUserIds.length,
    isLikedByUser: currentUserId
      ? post.likedUserIds.includes(currentUserId)
      : false,
  }));
}

/**
 * 포스트 생성
 * @returns
 */
export async function createPost(data: CreatePost): Promise<Post> {
  const result = await db
    .insert(posts)
    .values({
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      // views, likedUserIds, createdAt, updatedAt은 기본값으로 설정됨
    })
    .returning();
  return result[0];
}

/**
 * 포스트 업데이트 (중요: updatedAt 수동 설정)
 * @returns
 */
export async function updatePost(
  id: string,
  data: UpdatePost
): Promise<Post | undefined> {
  const result = await db
    .update(posts)
    .set({
      ...data,
      updatedAt: new Date() /**
       * ⚠️ 중요: 수동으로 설정해야 함
       * @returns
       */,
    })
    .where(eq(posts.id, id))
    .returning();
  return result[0];
}

/**
 * 포스트 삭제
 * @returns
 */
export async function deletePost(id: string): Promise<boolean> {
  const result = await db.delete(posts).where(eq(posts.id, id)).returning();
  return result.length > 0;
}

/**
 * 조회수 증가
 * @returns
 */
export async function incrementPostViews(
  id: string
): Promise<Post | undefined> {
  const result = await db
    .update(posts)
    .set({
      views: sql`${posts.views} + 1`,
    })
    .where(eq(posts.id, id))
    .returning();
  return result[0];
}

/**
 * 좋아요 토글
 * @returns
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<Post | undefined> {
  const post = await getPostById(postId);
  if (!post) return undefined;

  const isLiked = post.likedUserIds.includes(userId);
  let updatedLikedUserIds: string[];

  if (isLiked) {
    // 좋아요 취소
    updatedLikedUserIds = post.likedUserIds.filter((id) => id !== userId);
  } else {
    // 좋아요 추가
    updatedLikedUserIds = [...post.likedUserIds, userId];
  }

  const result = await db
    .update(posts)
    .set({
      likedUserIds: updatedLikedUserIds,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId))
    .returning();

  return result[0];
}

/**
 * 검색 (제목, 내용, 태그에서)
 * @returns
 */
export async function searchPosts(query: string): Promise<Post[]> {
  return await db
    .select()
    .from(posts)
    .where(
      or(
        ilike(posts.title, `%${query}%`),
        ilike(posts.content, `%${query}%`),
        arrayContains(posts.tags, [query.toLowerCase()])
      )
    )
    .orderBy(desc(posts.createdAt));
}

/**
 * 태그로 포스트 검색
 * @returns
 */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  return await db
    .select()
    .from(posts)
    .where(arrayContains(posts.tags, [tag.toLowerCase()]))
    .orderBy(desc(posts.createdAt));
}

/**
 * 인기 포스트 조회 (좋아요 수 기준)
 * @returns
 */
export async function getPopularPosts(
  limit: number = 10
): Promise<PostWithLikeCount[]> {
  const allPosts = await db.select().from(posts);

  return allPosts
    .map((post) => ({
      ...post,
      likeCount: post.likedUserIds.length,
    }))
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, limit);
}

/**
 * 조회수 기준 인기 포스트
 * @returns
 */
export async function getMostViewedPosts(limit: number = 10): Promise<Post[]> {
  return await db.select().from(posts).orderBy(desc(posts.views)).limit(limit);
}

/**
 * 모든 태그 조회 (중복 제거)
 * @returns
 */
export async function getAllTags(): Promise<string[]> {
  const result = await db.select({ tags: posts.tags }).from(posts);

  const allTags = result.flatMap((row) => row.tags);
  return Array.from(new Set(allTags)).sort();
}

/**
 * 페이지네이션된 포스트 조회
 * @returns
 */
export async function getPostsWithPagination(
  page: number = 1,
  limit: number = 10,
  currentUserId?: string
): Promise<{
  posts: PostWithLikeCount[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  const offset = (page - 1) * limit;

  /**
   * 포스트와 총 개수를 병렬로 조회
   * @returns
   */
  const [postsResult, totalResult] = await Promise.all([
    db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(posts),
  ]);

  const totalCount = totalResult[0].count as number;
  const totalPages = Math.ceil(totalCount / limit);

  /**
   * 좋아요 수와 사용자 좋아요 여부 추가
   * @returns
   */
  const postsWithLikeCount = postsResult.map((post) => ({
    ...post,
    likeCount: post.likedUserIds.length,
    isLikedByUser: currentUserId
      ? post.likedUserIds.includes(currentUserId)
      : false,
  }));

  return {
    posts: postsWithLikeCount,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * 특정 사용자가 좋아요한 포스트들 조회
 * @returns
 */
export async function getLikedPostsByUser(userId: string): Promise<Post[]> {
  return await db
    .select()
    .from(posts)
    .where(arrayContains(posts.likedUserIds, [userId]))
    .orderBy(desc(posts.createdAt));
}

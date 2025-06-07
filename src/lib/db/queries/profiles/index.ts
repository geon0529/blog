import { DatabaseError, NotFoundError } from "@/lib/api/errors/domain-error";
import { db } from "../../index";
import {
  profiles,
  type Profile,
  type UpdateProfile,
} from "../../schemas/profiles";
import { eq, ne } from "drizzle-orm";

/**
 * ID로 프로필 조회
 */
export async function getProfileById(id: string): Promise<Profile | undefined> {
  try {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  } catch (error) {
    console.error("Database error in getProfileById:", error);
    throw new DatabaseError(
      "프로필을 불러오는 중 오류가 발생했습니다.",
      "getProfileById"
    );
  }
}

/**
 * 이메일로 프로필 조회
 */
export async function getProfileByEmail(
  email: string
): Promise<Profile | undefined> {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email));
    return result[0];
  } catch (error) {
    console.error("Database error in getProfileByEmail:", error);
    throw new DatabaseError(
      "프로필을 불러오는 중 오류가 발생했습니다.",
      "getProfileByEmail"
    );
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(
  id: string,
  data: UpdateProfile
): Promise<Profile> {
  try {
    const result = await db
      .update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("프로필");
    }

    return result[0];
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Database error in updateProfile:", error);
    throw new DatabaseError(
      "프로필 수정 중 데이터베이스 오류가 발생했습니다.",
      "updateProfile"
    );
  }
}

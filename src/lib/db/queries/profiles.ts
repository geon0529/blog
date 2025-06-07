import { DatabaseError, NotFoundError } from "@/lib/errors/domain-error";
import { db } from "../index";
import { profiles, type Profile } from "../schemas/profiles";
import { eq } from "drizzle-orm";

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

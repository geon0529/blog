import { ApiError } from "@/lib/errors/error";
import { createClient } from "@/lib/supabase/server";

export const CommonService = {
  async getCurrentUser() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
    }

    return user;
  },
};

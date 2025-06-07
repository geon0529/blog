import { ApiError } from "@/lib/api/errors/error";
import { createClient } from "@/lib/supabase/client";

export const CommonService = {
  async getCurrentUser() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
    }

    return user;
  },
};

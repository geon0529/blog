import { ApiError } from "@/lib/api/errors/error";
import { createClient } from "@/lib/supabase/client";

export const CommonService = {
  async getCurrentUser(catchError: boolean = true) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && catchError) {
      throw new ApiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
    }

    return user;
  },
};

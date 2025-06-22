import { API_BASE_URL } from "@/lib/constants";
import { ApiError, handleApiError, isApiError } from "@/lib/api/errors/error";

export const ProfilesService = {
  async getProfileById(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${id}`);
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }
      throw new ApiError(
        "프로필을 불러오는데 실패했습니다.",
        500,
        "INTERNAL_ERROR"
      );
    }
  },
};

import API from "../../api/apiUtils";

export interface UserPerformanceDto {
  key: string;   // Ex: "PODIUM"
  label: string; // Ex: "Podium"
}

const endpoint = "/user-performances";

export async function getUserPerformances(): Promise<UserPerformanceDto[]> {
  try {
    const response = await API.get<UserPerformanceDto[]>(endpoint);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user performances:", error);
    throw error;
  }
}

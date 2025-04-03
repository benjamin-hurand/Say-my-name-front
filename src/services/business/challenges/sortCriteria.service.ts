// src/services/sortCriteriaService.ts
import API from "../../api/apiUtils";

export interface SortCriterionDto {
  key: string;   // Ex: "CREATION_DATE"
  label: string; // Ex: "Date de création"
}

const endpoint = "/challenges/sort-criterion-type";

export async function getSortCriteria(): Promise<SortCriterionDto[]> {
  try {
    const response = await API.get<SortCriterionDto[]>(endpoint);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch sort criteria:", error);
    throw error;
  }
}

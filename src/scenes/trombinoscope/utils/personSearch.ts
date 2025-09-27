import { AttributeFilterDto, FollowFilter, PersonSearchRequestDto } from "../../../services/dto/person/search/PersonSearchRequestDto";

export function buildSearchBody(params: {
  text?: string;
  followFilter: "all" | "followed" | "unfollowed";
  selectedFilters: Record<number, { op: AttributeFilterDto["operator"]; values: string[] }>;
  selectedSort?: { kind: "ATTRIBUTE" | "FIELD"; attributeId?: number; field?: string; direction: "ASC" | "DESC" };
}): PersonSearchRequestDto {
  const { text, followFilter, selectedFilters, selectedSort } = params;

  const filters: AttributeFilterDto[] = [];
  Object.entries(selectedFilters).forEach(([idStr, data]) => {
    if (data?.values?.length) {
      filters.push({ attributeId: Number(idStr), operator: data.op, values: data.values });
    }
  });

  if (text && text.trim().length >= 2) {
    // Convention locale : attributeId = -1 = recherche fulltext côté back
    filters.push({ attributeId: -1, operator: "LIKE", values: [text.trim()] } as any);
  }

  const ffMap: Record<typeof followFilter, FollowFilter> = {
    all: "ALL",
    followed: "FOLLOWED",
    unfollowed: "UNFOLLOWED",
  };

  return {
    filters: filters.length ? filters : undefined,
    sort: selectedSort ? [selectedSort] : undefined,
    followFilter: ffMap[followFilter],     // ← on envoie toujours une valeur explicite
    includeContextAttributes: true,
  };
}

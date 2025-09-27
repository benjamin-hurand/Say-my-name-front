// src/services/dto/person/search/PersonCardDtos.ts
export interface PersonAttributeExtraDto {
  attributeId: number;
  value: string;
  displayOrder: number | null;
}

export interface PersonCardDto {
  idPerson: number;
  photoSmallUrl: string | null;
  photoLargeUrl: string | null;
  primaryAttributes: PersonAttributeExtraDto[];
  followed: boolean;
  extraAttributes: PersonAttributeExtraDto[];
}

// src/dto/course/CreateCourseDto.ts
export interface CreateCourseDto {
  userId: number;
  gameModeId: number;
  sortingAttributeId: number;
  sortingOrder: 'ASC' | 'DESC';
  populationIds: number[];
}

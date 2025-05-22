import { Attribute } from "../../../models/commons/Attribute";
import { UserDto } from "../UserDto";

// src/dto/course/CourseAnswerDto.ts
export interface PopulationDto {
  id: number;
  title: string;
  description: string;
  attributeFilter: Attribute;
  minValue: string;
  maxValue: string;
  createdBy: UserDto;
  personCoun: number;
}

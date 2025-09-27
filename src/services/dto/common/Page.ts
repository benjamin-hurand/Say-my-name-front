// src/services/dto/common/Page.ts
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;           // page courante (0-based)
  size: number;             // taille de page demandée
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

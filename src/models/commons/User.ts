export interface User {
    id: number;
    username: string;
    email: string;
    roles: string;
    srsAlgorithm: SrsAlgorithm;
}

export enum SrsAlgorithm {
  SM2  = 'SM2',
  PFA  = 'PFA',
  FSRS = 'FSRS',
}
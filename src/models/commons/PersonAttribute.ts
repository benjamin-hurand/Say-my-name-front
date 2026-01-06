import dayjs from "dayjs";
import { Attribute } from "./Attribute/Attribute";


export interface PersonAttributeMinimalDto {
  id: number;
  value: string;
}

// Domain model: toujours persisté
export interface PersonAttributeLite {
  id: number;
  attribute: Attribute;
  value: string;
  personId: number;
}

export interface PersonAttributeExtraLite {
  id: number;
  attributeId: number;
  value: string;
}

export interface PersonAttribute {
  id: number;
  attributeId: number;
  value: string;
  validFrom: string;
  validTo: string | null;
  pendingDelete: boolean;
}

export interface AttributeValuesResponseDto {
  attributeId: number;
  values: PersonAttribute[];
}

export type PersonAttributeStatus = "ACTIVE" | "FUTURE" | "PENDING_DELETE" | "EXPIRED";

export function computeStatus(pa: Pick<PersonAttribute, "validFrom" | "validTo" | "pendingDelete">): PersonAttributeStatus {
  if (pa.pendingDelete) return "PENDING_DELETE";
  const now = dayjs();
  const from = dayjs(pa.validFrom);
  const to = pa.validTo ? dayjs(pa.validTo) : null;
  if (now.isBefore(from)) return "FUTURE";
  if (to && now.isAfter(to)) return "EXPIRED";
  return "ACTIVE";
}

/** Est-ce futur ? */
export function isFuture(pa: Pick<PersonAttribute, "validFrom">): boolean {
  return dayjs().isBefore(dayjs(pa.validFrom));
}

/** Rang de tri : ACTIVE (0) avant FUTURE (1) ; EXPIRED (98) ; PENDING (99) */
export function statusRank(pa: Pick<PersonAttribute, "validFrom" | "validTo" | "pendingDelete">): number {
  const s = computeStatus(pa);
  if (s === "ACTIVE") return 0;
  if (s === "FUTURE") return 1;
  if (s === "EXPIRED") return 98;
  return 99; // pending
}

// Input pour créer (côté service/API)
export type NewPersonAttributeInput = {
  attributeId: number;
  value: string;
  personId: number;
};


export interface ResultAttr {
  attribute: { id: number; name: string }
  value: string
  isCorrect: boolean            // vrai/faux
  isTarget: boolean             // si c’est l’attribut demandé (ex. prénom)
}
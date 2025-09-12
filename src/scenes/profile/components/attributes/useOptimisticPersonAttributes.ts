// src/pages/profile/components/attributes/useOptimisticPersonAttributes.ts
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Attribute } from "../../../../models/commons/Attribute";
import { PersonAttributeFull, statusRank } from "../../../../models/commons/PersonAttribute";

type Delta = {
  added?: { value: string }[];
  updated?: { id: number; value: string }[];
  deleted?: { id: number }[];
};

export function useOptimisticPersonAttributes(
  allAttributes: Attribute[],
  rawAttributes: PersonAttributeFull[]
) {
  // Map<attributeId, PersonAttributeFull[]>
  const [overridesByAttrId, setOverridesByAttrId] = useState<Record<number, PersonAttributeFull[]>>({});

  // Accès rapide Attribute par id
  const attrById = useMemo(() => {
    const m = new Map<number, Attribute>();
    for (const a of allAttributes) m.set(a.id as number, a);
    return m;
  }, [allAttributes]);

  // Fusion du profil “brut” + overrides locaux
  const effectiveAttributesAll: PersonAttributeFull[] = useMemo(() => {
    if ((!rawAttributes || rawAttributes.length === 0) && !Object.keys(overridesByAttrId).length) return [];
    const overridden = new Set(Object.keys(overridesByAttrId).map(Number));
    const base = rawAttributes.filter((pa) => !overridden.has(pa.attribute?.id ?? -1));
    const injected = Object.values(overridesByAttrId).flat();
    return [...base, ...injected];
  }, [rawAttributes, overridesByAttrId]);

  // Liste finale pour l’affichage
  const profileAttributes: PersonAttributeFull[] = useMemo(
    () =>
      (effectiveAttributesAll ?? [])
        .filter((pa) => !pa.pendingDelete)
        .sort((a, b) => statusRank(a) - statusRank(b)),
    [effectiveAttributesAll]
  );

  // ===== Helpers ciblés par attribut =====

  const getCurrentForAttr = (attributeId: number): PersonAttributeFull[] => {
    if (overridesByAttrId[attributeId]) return overridesByAttrId[attributeId];
    return (effectiveAttributesAll ?? []).filter((pa) => (pa.attribute?.id ?? -1) === attributeId);
  };

  const replaceAttrValues = (attributeId: number, values: PersonAttributeFull[]) => {
    setOverridesByAttrId((prev) => ({ ...prev, [attributeId]: values }));
  };

  const revertAttrOverride = (attributeId: number) => {
    setOverridesByAttrId((prev) => {
      const next = { ...prev };
      delete next[attributeId];
      return next;
    });
  };

  const makeTempPa = (attributeId: number, value: string): PersonAttributeFull => {
    const attr = attrById.get(attributeId);
    const futureFrom = dayjs().add(1, "day").toISOString(); // FUTURE tant que le back n’a pas répondu
    return {
      id: Number(`9${Date.now()}${Math.floor(Math.random() * 1000)}`), // id temporaire
      attribute: attr as Attribute,
      value,
      validFrom: futureFrom,
      validTo: null,
      pendingDelete: false,
    };
  };

  /** Patch optimiste local sur un attribut */
  const applyOptimisticDelta = (attributeId: number, delta: Delta) => {
    const current = [...getCurrentForAttr(attributeId)];

    // delete
    if (delta.deleted?.length) {
      const idsToDel = new Set(delta.deleted.map((d) => d.id));
      for (let i = current.length - 1; i >= 0; i--) {
        if (idsToDel.has(current[i].id)) current.splice(i, 1);
      }
    }

    // update
    if (delta.updated?.length) {
      const byId = new Map(delta.updated.map((u) => [u.id, u.value]));
      for (let i = 0; i < current.length; i++) {
        const nv = byId.get(current[i].id);
        if (nv != null) current[i] = { ...current[i], value: nv };
      }
    }

    // add
    if (delta.added?.length) {
      const temps = delta.added.map((a) => makeTempPa(attributeId, a.value));
      current.push(...temps);
    }

    replaceAttrValues(attributeId, current);
  };

  return {
    // données affichées
    profileAttributes,
    // helpers
    applyOptimisticDelta,
    replaceAttrValues,
    revertAttrOverride,
  };
}

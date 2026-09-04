/**
 * GENDER is a backend-owned canonical enum (see core/model/people/GenderOptions
 * on the backend): the admin can no longer pick a custom option list for it.
 * This fixed, ordered label list is what the form displays and submits;
 * whatever enumOptions the client sends for a GENDER-concept attribute is
 * ignored server-side and replaced by the backend's stable MALE/FEMALE/OTHER
 * codes anyway, so these are display labels only, not the persisted values.
 */
export const GENDER_PRESET_VALUES: readonly string[] = [
  "Homme",
  "Femme",
  "Non-binaire ou autre",
];

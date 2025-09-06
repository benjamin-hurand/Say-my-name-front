export type AttributeChanges = {
  create:   { value: string }[];
  update: { id: number; value: string }[];
  delete: { id: number }[];
};

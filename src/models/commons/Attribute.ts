export type EditPolicy = 'FREE' | 'RESTRICTED';

export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'URL'
  | 'EMAIL';

export interface Attribute {
  id: number;
  name: string;
  maxValues: number;
  filter: boolean;
  sort: boolean;
  initializable: boolean;
  required: boolean;
  type: AttributeType;
  minValue: string | null;
  maxValue: string | null;
  editPolicy: EditPolicy;
}

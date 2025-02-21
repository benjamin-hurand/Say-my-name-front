export type AttributeType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'enum' | 'url' | 'email';

export interface Attribute {
  id: number;
  name: string;
  unique: boolean;
  filter: boolean;
  sort: boolean;
  initializable: boolean;
  type: AttributeType;
  minValue: string;
  maxValue: string;
}

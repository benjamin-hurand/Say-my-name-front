import { Chip } from "@mui/material";
import { Attribute } from "../../../models/commons/Attribute/Attribute";

export const AttributeCard = ({
  attribute,
  isSelected,
  onSelect,
}: {
  attribute: Attribute;
  isSelected: boolean;
  onSelect: (attribute: Attribute) => void;
}) => (
  <Chip
    label={attribute.name}
    onClick={() => onSelect(attribute)}
    color={isSelected ? 'primary' : 'default'}
    sx={{ margin: 1, cursor: 'pointer' }}
  />
);
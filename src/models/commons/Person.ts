import { AttributeValue } from "./AttributeValue";
import { PromotionValue } from "./PromotionValue";
import { User } from "./User";

export interface Person {
    id: number; 
    user?: User;
    firstName: string;
    lastName: string;
    promotions: PromotionValue[];
    attributes: AttributeValue[];
}
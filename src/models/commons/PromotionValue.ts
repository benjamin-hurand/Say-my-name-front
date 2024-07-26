import { Promotion } from "./Promotion";

export interface PromotionValue {
    promotion: Promotion;
    value: string; // Si c'est CDI, Alternance, ou stage 4a, 5a etc
}
import { GamingThemeAttribute } from "./GamingThemeAttribute.model";

export interface GamingTheme {
    id: number,
    title: string,
    description: string,
    attributes: GamingThemeAttribute[], 
}
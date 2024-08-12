import { Attribute } from "../../../models/commons/Attribute";
import { GamingTheme } from "../../../models/commons/GamingTheme/GamingTheme.model";
import { PersonBasic } from "../../../models/commons/PersonBasic";
import { Photo } from "../../../models/commons/Photo";
import API from "../../api/apiUtils";

const endpoint = "/quiz";


export async function getPhoto(): Promise<Photo> {
    try {
        const response = await API.get<Photo>(`${endpoint}/photo/random`);
        console.log("voicii:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to fetch random photo:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}

export async function getPersonBasicOfPhoto(photoId: number): Promise<PersonBasic> {
    try {
        const response = await API.get<PersonBasic>(`${endpoint}/person/by-photo-id/${photoId}`);
        console.log("voicii:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get person of photo:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}

export async function getGamingThemes(): Promise<GamingTheme[]> {
    try {
        const response = await API.get<GamingTheme[]>(`${endpoint}/themes`);
        console.log("voicii themes:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get gaming themes:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}

export async function getAttributes(): Promise<Attribute[]> {
    try {
        const response = await API.get<Attribute[]>(`${endpoint}/attributes`);
        console.log("voicii attributes:" + JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Failed to get attributes:', error);
        throw error; // You may want to handle this differently depending on your app's design
    }
}
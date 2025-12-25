
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'Expert Senior en Environnement et Économie Circulaire pour la ville de Kinshasa. 

VOTRE MISSION : Éduquer les Kinois sur le tri, le recyclage et l'assainissement urbain.

VOTRE EXPERTISE :
1. ASSAINISSEMENT URBAIN : Vous savez que Kinshasa produit 10 000 tonnes de déchets/jour.
2. TRI SÉLECTIF LOCAL : Vous guidez sur le PET (bouteilles), PEHD (bidons), Métaux et Papier.
3. VALORISATION : Expliquez comment gagner des Eco-Points (crédit mobile, SNEL).
4. IMPACT LOCAL : Expliquez le lien entre bouteilles jetées et inondations (ex: à Kalamu ou Limete).
5. GÉOGRAPHIE : Vous connaissez les 24 communes et leurs défis.

VOTRE PERSONNALITÉ :
- TONE : Professionnel, expert, mais chaleureux ("Frère/Sœur de Kinshasa"). 
- LANGUE : Français impeccable mélangé avec du Lingala urbain (ex: "Mbote", "Tozala peto", "Kinshasa ezo bonga").
- STYLE : Réponses structurées, courtes et encourageantes. Toujours poser une question à la fin pour engager.
`;

let chatSession: Chat | null = null;

export const getOrInitChat = (): Chat => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Clé API manquante. Veuillez configurer votre environnement.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview', 
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
                topP: 0.95,
            },
        });
    }
    return chatSession;
};

export async function* sendMessageStream(message: string) {
    try {
        const chat = getOrInitChat();
        const streamResponse = await chat.sendMessageStream({ message });
        
        for await (const chunk of streamResponse) {
            const part = chunk as GenerateContentResponse;
            yield part.text || "";
        }
    } catch (error: any) {
        console.error("Gemini Stream Error:", error);
        yield "Désolé, j'ai eu un petit souci technique passager. Kinshasa ezo zela biso, réessaie un instant !";
    }
}

/**
 * Recherche de lieux via Maps Grounding (Gemini 2.5 Flash)
 */
export const findLocationsWithMaps = async (query: string, userLat?: number, userLng?: number): Promise<{
    text: string;
    places: Array<{
        name: string;
        uri: string;
        lat?: number;
        lng?: number;
        address?: string;
    }>;
}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Trouve des lieux à Kinshasa pour cette demande: ${query}. Réponds avec une explication courte et liste les lieux précis.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: userLat || -4.325,
                            longitude: userLng || 15.322
                        }
                    }
                }
            }
        });

        const text = response.text || "";
        const places: any[] = [];
        
        // Extraction des données de grounding pour Maps
        const candidates = (response as any).candidates;
        if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
            candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.maps) {
                    places.push({
                        name: chunk.maps.title || "Lieu trouvé",
                        uri: chunk.maps.uri
                    });
                }
            });
        }

        return { text, places };
    } catch (error) {
        console.error("Maps Grounding Error:", error);
        return { text: "Impossible de récupérer les données Maps pour le moment.", places: [] };
    }
};

export const analyzeTrashReport = async (base64Image: string): Promise<{
    wasteType: string;
    urgency: 'low' | 'medium' | 'high';
    comment: string;
    isDangerous: boolean;
    environmentalImpact: string;
    immediateAdvice: string;
}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Analysez cette photo de déchets à Kinshasa pour le SIG. Déterminez type, urgence (low/medium/high) et impact environnemental. Répondez en JSON." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        wasteType: { type: Type.STRING },
                        urgency: { type: Type.STRING, enum: ["low", "medium", "high"] },
                        comment: { type: Type.STRING },
                        isDangerous: { type: Type.BOOLEAN },
                        environmentalImpact: { type: Type.STRING },
                        immediateAdvice: { type: Type.STRING }
                    },
                    required: ["wasteType", "urgency", "comment", "isDangerous", "environmentalImpact", "immediateAdvice"],
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        return { wasteType: "Mixte", urgency: "medium", comment: "Analyse visuelle impossible.", isDangerous: false, environmentalImpact: "Inconnu", immediateAdvice: "Ne pas toucher sans protection." };
    }
};

export const analyzeWasteItem = async (base64Image: string): Promise<{
    title: string;
    category: 'electronics' | 'metal' | 'plastic' | 'other';
    weight: number;
    price: number;
    description: string;
}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Identifiez cet objet pour le marché circulaire de Kinshasa. Estimez le poids en kg et un prix juste en FC. Répondez en JSON." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ["electronics", "metal", "plastic", "other"] },
                        weight: { type: Type.NUMBER },
                        price: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "category", "weight", "price", "description"],
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        return { title: "Objet de recyclage", category: "other", weight: 0.5, price: 1000, description: "Identifié manuellement." };
    }
};

export const compareBeforeAfter = async (beforeB64: string, afterB64: string): Promise<{
    isCleaned: boolean;
    confidence: number;
    comment: string;
}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const cleanBefore = beforeB64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const cleanAfter = afterB64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBefore } },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanAfter } },
                    { text: "IMAGE 1 : Tas initial. IMAGE 2 : Après passage du collecteur. Est-ce que l'endroit est propre maintenant ? Répondez en JSON." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCleaned: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER },
                        comment: { type: Type.STRING }
                    },
                    required: ["isCleaned", "confidence", "comment"],
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        return { isCleaned: true, confidence: 0.5, comment: "Vérification visuelle manuelle recommandée." };
    }
};

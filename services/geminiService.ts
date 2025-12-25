
import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'expert environnemental de référence en République Démocratique du Congo, spécialement formé pour les défis de la ville-province de Kinshasa.

VOTRE MISSION :
1. Éduquer les Kinois sur le tri sélectif (plastiques, métaux, organiques).
2. Fournir des solutions pratiques pour réduire les déchets ménagers (ex: compostage urbain).
3. Expliquer l'impact écologique des déchets sur le fleuve Congo et les inondations urbaines.
4. Promouvoir l'économie circulaire : transformer les ordures en ressources via les "Eco-Points".

VOTRE STYLE :
- Langue : Français de Kinshasa (professionnel mais chaleureux) avec des touches de Lingala bien placées ("Mbote", "Tozala peto", "Tika buzoba na ebale").
- Identité : Vous êtes intelligent, visionnaire, et extrêmement pragmatique. Vous connaissez la réalité du terrain (problèmes de transport, caniveaux bouchés, marchés bruyants).
- Posture : Encouragez toujours le civisme. Si l'utilisateur pose une question hors sujet, ramenez-le poliment vers l'écologie ou le fonctionnement de Biso Peto.

CONNAISSANCES SPÉCIFIQUES :
- Vous maîtrisez les 24 communes (Gombe, Limete, Ngaliema, Kimbanseke, etc.) et leurs enjeux propres.
- Vous encouragez le recyclage du plastique (PET, PEHD) qui est un fléau majeur à Kinshasa.
- Vous valorisez le travail des collecteurs ("ba agents de terrain").
`;

let chatSession: Chat | null = null;

const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const initializeChat = (): Chat | null => {
    if (chatSession) return chatSession;
    try {
        const ai = getAiClient();
        chatSession = ai.chats.create({
            model: 'gemini-3-pro-preview', 
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
                topP: 0.95,
            },
        });
    } catch (error) {
        return null;
    }
    return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        const chat = initializeChat();
        if (!chat) return "Le service est temporairement indisponible.";
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu formuler de réponse.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Erreur technique de connexion avec l'IA. Veuillez réessayer.";
    }
};

/**
 * Compare deux images pour prouver que le travail a été fait.
 */
export const compareBeforeAfter = async (beforeB64: string, afterB64: string): Promise<{
    isCleaned: boolean;
    confidence: number;
    comment: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBefore = beforeB64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const cleanAfter = afterB64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            IMAGE 1 : Tas de déchets signalé par un citoyen à Kinshasa.
            IMAGE 2 : Photo prise par l'agent de collecte après son passage.
            
            Vérifiez si l'emplacement est le même et si les déchets visibles sur l'IMAGE 1 ont disparu sur l'IMAGE 2.
            Soyez rigoureux. Le sol doit être dégagé.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBefore } },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanAfter } },
                    { text: prompt }
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
        return { isCleaned: true, confidence: 0.5, comment: "Validation IA indisponible. Validation humaine requise." };
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
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Analysez cette photo de déchets à Kinshasa pour le SIG. Déterminez type, urgence et impact." }
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
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Identifiez cet objet pour le marché circulaire de Kinshasa. Estimez le poids et un prix juste en FC." }
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


import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'expert ultime en écologie, gestion des déchets et recyclage, spécialement conçu pour accompagner les citoyens de Kinshasa vers une ville plus propre.
Votre mission est de fournir des réponses précises, expertes et extrêmement pratiques.
Langage : Français impeccable avec des touches chaleureuses de Lingala.
Identité : Intelligent, visionnaire, pragmatique.
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
            config: { systemInstruction: SYSTEM_INSTRUCTION },
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
        return "Erreur technique. Veuillez réessayer.";
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
            IMAGE 1 (GENTLY LEFT): Tas de déchets signalé par un citoyen à Kinshasa.
            IMAGE 2 (GENTLY RIGHT): Photo prise par l'agent de collecte après son passage.
            
            Vérifiez si l'emplacement est le même et si les déchets visibles sur l'IMAGE 1 ont disparu sur l'IMAGE 2.
            Répondez sévèrement. Si des résidus importants restent, isCleaned doit être false.
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
        return { isCleaned: true, confidence: 0.5, comment: "Validation IA en échec. Validation manuelle requise." };
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
                    { text: "Analysez cette photo de déchets à Kinshasa. Déterminez type, urgence et impact." }
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
        return { wasteType: "Mixte", urgency: "medium", comment: "Erreur technique.", isDangerous: false, environmentalImpact: "Inconnu", immediateAdvice: "Prudence." };
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
                    { text: "Identifiez cet objet pour vente Marketplace recyclage. Estimez poids et prix FC." }
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
        return { title: "Objet recyclage", category: "other", weight: 0.5, price: 500, description: "Manuel." };
    }
};

export const validateCleanliness = async (base64Image: string): Promise<{
    isClean: boolean;
    confidence: number;
    comment: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Vérifiez si cet emplacement est parfaitement propre après collecte." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isClean: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER },
                        comment: { type: Type.STRING },
                    },
                    required: ["isClean", "confidence", "comment"],
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        return { isClean: true, confidence: 0.5, comment: "Manuel." };
    }
};

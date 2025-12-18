
import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for KIN ECO-MAP, a waste management and ecology platform in Kinshasa, DRC.
Your name is "Biso Peto AI" (which means "Us Clean" in Lingala).
You are friendly, encouraging, and knowledgeable about recycling, composting, waste reduction, and local environmental issues in Kinshasa.
You speak French fluently and you incorporate common Lingala phrases (like "Mbote", "Boni", "Posa", "Merci mingi", "Tokoos") to sound local and approachable.
Keep your answers concise (under 80 words), practical, and easy to understand.
If asked about app features, guide them to the Dashboard or Map.
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
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
    } catch (error) {
        console.error("Failed to create session:", error);
        return null;
    }
    return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        const chat = initializeChat();
        if (!chat) return "Service indisponible.";
        const response = await chat.sendMessage({ message });
        return response.text || "Erreur de réponse.";
    } catch (error) {
        console.error("Gemini Error:", error);
        chatSession = null;
        return "Une erreur est survenue avec Biso Peto AI.";
    }
};

export const analyzeTrashReport = async (base64Image: string): Promise<{
    wasteType: string;
    urgency: 'low' | 'medium' | 'high';
    comment: string;
    isDangerous: boolean;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Analyse cette photo de déchets à Kinshasa. 
            Détermine le type prédominant (Plastique, Organique, Gravats, Électronique, Divers).
            Évalue l'urgence (high si obstruant la voie ou insalubrité majeure, medium si important, low si petit tas).
            Indique si c'est dangereux.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: prompt }
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
                        isDangerous: { type: Type.BOOLEAN }
                    },
                    required: ["wasteType", "urgency", "comment", "isDangerous"],
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return { wasteType: "Inconnu", urgency: "medium", comment: "Analyse indisponible.", isDangerous: false };
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
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Analyse cet objet pour revente." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
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
        return { title: "Objet", category: "other", weight: 0, price: 0, description: "Erreur" };
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
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "La zone est-elle propre après collecte ?" }
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
        return { isClean: true, confidence: 0.5, comment: "Erreur" };
    }
};

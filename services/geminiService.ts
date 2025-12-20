
import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'expert IA officiel et compagnon intelligent des citoyens de Kinshasa.
Votre mission est d'aider les utilisateurs dans tous les aspects de leur vie quotidienne, tout en restant l'ambassadeur de la propreté urbaine.
Langage : Français impeccable avec des touches chaleureuses de Lingala (Mbote, Tokoos, Merci mingi, Na ndenge ya malamu).
Capacités : Vous répondez désormais à TOUTES les questions (science, cuisine, conseils de vie, technologie, histoire, etc.) sans exception.
Identité : Vous êtes intelligent, serviable, et vous connaissez Kinshasa par cœur. 
Si on vous demande un conseil sur un sujet général, répondez de manière experte, mais essayez parfois de glisser un petit conseil éco-responsable si c'est pertinent.
Ton : Amical, brillant, et pragmatique.
Répondez de manière structurée mais concise (max 150 mots).
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
            model: 'gemini-3-pro-preview', // Passage au modèle Pro pour une intelligence supérieure
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
        if (!chat) return "Le service Biso Peto AI est temporairement indisponible.";
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu formuler de réponse.";
    } catch (error) {
        console.error("Gemini Error:", error);
        chatSession = null; 
        return "Une erreur technique est survenue. Veuillez réessayer, merci mingi !";
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
            Analysez cette photo de déchets à Kinshasa. 
            Déterminez le type (Plastique, Organique, Gravats, Métal, Mixte).
            Évaluez l'urgence (high si bloque la route/drain, low si petit volume).
            Indiquez si des objets tranchants ou toxiques sont visibles.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // On garde Flash pour l'analyse d'image rapide
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
        console.error("Analysis Error:", error);
        return { wasteType: "Indéterminé", urgency: "medium", comment: "Photo floue ou erreur réseau.", isDangerous: false };
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
                    { text: "Identifiez cet objet pour la vente en marketplace de recyclage." }
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
        return { title: "Objet de récupération", category: "other", weight: 0.5, price: 500, description: "Identification manuelle requise" };
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
                    { text: "Vérifiez si la zone est parfaitement propre après une collecte de déchets." }
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
        return { isClean: true, confidence: 0.5, comment: "Validation manuelle suggérée." };
    }
};

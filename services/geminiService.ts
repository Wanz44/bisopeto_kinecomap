
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

/* Fixed: Use process.env.API_KEY directly as per guidelines */
const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/* Fixed: Use gemini-3-flash-preview for text tasks */
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
        console.error("Failed to create chat session:", error);
        return null;
    }
    return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        const chat = initializeChat();
        if (!chat) {
            return "Service d'assistance indisponible (Clé API manquante).";
        }
        
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu traiter votre demande.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        chatSession = null; // Reset session on error
        return "Une erreur est survenue avec Biso Peto AI. Vérifiez votre connexion.";
    }
};

// Analyse d'image pour le Marketplace (Estimation prix/poids)
/* Fixed: Use gemini-3-flash-preview for image analysis and direct API Key usage */
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

        const prompt = `
            Analyse cette image d'un objet (déchet ou article usagé) à Kinshasa.
            Identifie l'objet.
            Estime son poids (kg) et sa valeur de revente (FC).
            Catégorie doit être l'une des suivantes: electronics, metal, plastic, other.
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
                        title: { type: Type.STRING, description: "Nom de l'objet" },
                        category: { type: Type.STRING, description: "Catégorie" },
                        weight: { type: Type.NUMBER, description: "Poids estimé (kg)" },
                        price: { type: Type.NUMBER, description: "Prix estimé (FC)" },
                        description: { type: Type.STRING, description: "Description de l'état" },
                    },
                    required: ["title", "category", "weight", "price", "description"],
                }
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("No response text");
        
        const data = JSON.parse(textResponse);
        
        const validCategories = ['electronics', 'metal', 'plastic', 'other'];
        if (!validCategories.includes(data.category)) {
            data.category = 'other';
        }

        return data;

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return {
            title: "Objet non identifié",
            category: "other",
            weight: 0,
            price: 0,
            description: "Impossible d'analyser l'image automatiquement."
        };
    }
};

// Validation de la propreté d'un site
/* Fixed: Use gemini-3-flash-preview for validation and direct API Key usage */
export const validateCleanliness = async (base64Image: string): Promise<{
    isClean: boolean;
    confidence: number;
    comment: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Auditeur de propreté Kinshasa. Analyse cette photo après passage éboueur.
            La zone est-elle propre ?
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
                        isClean: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER },
                        comment: { type: Type.STRING },
                    },
                    required: ["isClean", "confidence", "comment"],
                }
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("No response text");

        return JSON.parse(textResponse);

    } catch (error) {
        console.error("Gemini Validation Error:", error);
        return { isClean: true, confidence: 0.5, comment: "Validation IA hors ligne." };
    }
};

import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for KIN ECO-MAP, a waste management and ecology platform in Kinshasa, DRC.
Your name is "Biso Peto AI" (which means "Us Clean" in Lingala).
You are friendly, encouraging, and knowledgeable about recycling, composting, waste reduction, and local environmental issues in Kinshasa.
You speak French fluently and you incorporate common Lingala phrases (like "Mbote", "Boni", "Posa", "Merci mingi") to sound local and approachable.
Keep your answers concise (under 80 words), practical, and easy to understand.
If asked about app features, guide them to the Dashboard or Map.
`;

let chatSession: Chat | null = null;

const getAiClient = () => {
    let apiKey = "";
    try {
        // Safe access to process.env
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            // @ts-ignore
            apiKey = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Error reading API key environment:", e);
    }

    // CRITICAL FIX: The Google GenAI SDK attempts to load Node.js "AuthClient" 
    // if the apiKey is missing/empty, causing a crash in browsers.
    // We provide a dummy key to force "API Key mode" if the real key is missing.
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
        apiKey = "AIzaSy_DUMMY_KEY_PREVENTS_SDK_CRASH";
    }

    return new GoogleGenAI({ apiKey });
};

export const initializeChat = (): Chat | null => {
    if (chatSession) return chatSession;
    
    try {
        const ai = getAiClient();
        chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
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
            return "Service d'assistance indisponible pour le moment.";
        }
        
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu traiter votre demande pour le moment.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Force reset chat session on error
        chatSession = null; 
        return "Une erreur est survenue. Vérifiez votre connexion ou votre clé API.";
    }
};

// Analyse d'image pour le Marketplace (Estimation prix/poids)
export const analyzeWasteItem = async (base64Image: string): Promise<{
    title: string;
    category: 'electronics' | 'metal' | 'plastic' | 'other';
    weight: number;
    price: number;
    description: string;
}> => {
    try {
        const ai = getAiClient();
        // Clean base64 string if needed
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Analyse cette image d'un objet (déchet ou article usagé) à Kinshasa.
            Identifie l'objet.
            Estime son poids (kg) et sa valeur de revente (FC).
            Catégories: electronics, metal, plastic, other.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                        category: { type: Type.STRING, description: "Catégorie de l'objet (electronics, metal, plastic, other)" },
                        weight: { type: Type.NUMBER, description: "Poids estimé en kg" },
                        price: { type: Type.NUMBER, description: "Prix estimé en Francs Congolais" },
                        description: { type: Type.STRING, description: "Brève description de l'état" },
                    },
                    required: ["title", "category", "weight", "price", "description"],
                }
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("No response text");
        
        return JSON.parse(textResponse);

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return {
            title: "Objet détecté",
            category: "other",
            weight: 1,
            price: 0,
            description: "Impossible d'analyser l'image automatiquement."
        };
    }
};

// NOUVEAU : Validation de la propreté d'un site (Preuve de travail)
export const validateCleanliness = async (base64Image: string): Promise<{
    isClean: boolean;
    confidence: number; // 0 à 1
    comment: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Tu es un auditeur de propreté urbaine. Analyse cette photo qui vient d'être prise par un éboueur après son passage.
            Est-ce que la poubelle est vide ? Est-ce que la zone autour est propre ?
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                        isClean: { type: Type.BOOLEAN, description: "True si c'est vide/propre, False sinon" },
                        confidence: { type: Type.NUMBER, description: "Degré de certitude entre 0.0 et 1.0" },
                        comment: { type: Type.STRING, description: "Une phrase courte en français expliquant le verdict" },
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
        // Fallback optimiste pour ne pas bloquer le travailleur en cas d'erreur API
        return { isClean: true, confidence: 0.5, comment: "Validation IA indisponible, validation manuelle requise." };
    }
};

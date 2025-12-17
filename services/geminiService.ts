
import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for KIN ECO-MAP, a waste management and ecology platform in Kinshasa, DRC.
Your name is "Biso Peto AI" (which means "Us Clean" in Lingala).
You are friendly, encouraging, and knowledgeable about recycling, composting, waste reduction, and local environmental issues in Kinshasa.
You speak French fluently and you incorporate common Lingala phrases (like "Mbote", "Boni", "Posa", "Merci mingi", "Tokoos") to sound local and approachable.
Keep your answers concise (under 80 words), practical, and easy to understand.
If asked about app features, guide them to the Dashboard or Map.
`;

let chatSession: Chat | null = null;

// Helper to get API Key safely in Vite environment
const getApiKey = () => {
    let key = "";
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.API_KEY) {
            // @ts-ignore
            key = import.meta.env.API_KEY;
        } 
        // @ts-ignore
        else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            // @ts-ignore
            key = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Error reading API Key:", e);
    }
    return key;
};

const getAiClient = () => {
    const apiKey = getApiKey();
    // Fallback to prevent crash if key is missing during dev (Client-side safety)
    return new GoogleGenAI({ apiKey: apiKey || "AIza_DUMMY_KEY_FOR_DEV" });
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
            return "Service d'assistance indisponible pour le moment (Clé API manquante).";
        }
        
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu traiter votre demande pour le moment.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Force reset chat session on error to recover in next attempt
        chatSession = null; 
        return "Une erreur est survenue avec Biso Peto AI. Vérifiez votre connexion.";
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
            Catégorie doit être l'une des suivantes: electronics, metal, plastic, other.
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
                        title: { type: Type.STRING, description: "Nom de l'objet (ex: Bouteilles Plastique, Vieux Fer...)" },
                        category: { type: Type.STRING, description: "electronics, metal, plastic, or other" },
                        weight: { type: Type.NUMBER, description: "Poids estimé en kg" },
                        price: { type: Type.NUMBER, description: "Prix estimé en Francs Congolais (FC)" },
                        description: { type: Type.STRING, description: "Brève description de l'état en français" },
                    },
                    required: ["title", "category", "weight", "price", "description"],
                }
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("No response text");
        
        const data = JSON.parse(textResponse);
        
        // Safety check for category
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
            description: "Impossible d'analyser l'image automatiquement. Veuillez remplir manuellement."
        };
    }
};

// Validation de la propreté d'un site (Preuve de travail)
export const validateCleanliness = async (base64Image: string): Promise<{
    isClean: boolean;
    confidence: number; // 0 à 1
    comment: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Tu es un auditeur de propreté urbaine à Kinshasa. Analyse cette photo qui vient d'être prise par un éboueur après son passage.
            Est-ce que la poubelle est vide ? Est-ce que la zone autour est propre (pas de déchets au sol) ?
            Sois strict.
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
                        isClean: { type: Type.BOOLEAN, description: "True si c'est propre/vide, False sinon" },
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
        return { isClean: true, confidence: 0.5, comment: "Validation IA hors ligne. Vérification manuelle requise plus tard." };
    }
};

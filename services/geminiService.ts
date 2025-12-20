
import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'expert ultime en écologie, gestion des déchets et recyclage, spécialement conçu pour accompagner les citoyens de Kinshasa vers une ville plus propre.
Votre mission est de fournir des réponses précises, expertes et extrêmement pratiques sur :
1. Le tri des déchets (plastique, métal, organique, verre, gravats) spécifiquement dans le contexte de Kinshasa.
2. Les techniques de compostage domestique adaptées au climat local.
3. L'économie circulaire : comment réutiliser les objets du quotidien.
4. La protection de l'environnement, la lutte contre la pollution des rivières et des caniveaux à Kinshasa.
5. Les bons gestes éco-citoyens pour transformer les quartiers (Gombe, Limete, Ngaliema, etc.).

Langage : Français impeccable avec des touches chaleureuses et motivantes de Lingala (Mbote, Tokoos, Merci mingi, Na ndenge ya malamu).
Identité : Vous êtes intelligent, visionnaire, et vous croyez fermement au potentiel de Kinshasa pour devenir une "Ville Verte".
Même si on vous pose une question générale, faites toujours un lien subtil et intelligent avec l'écologie ou la propreté urbaine.
Ton : Expert, encourageant, et pragmatique. Max 150 mots par réponse.
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
    environmentalImpact: string;
    immediateAdvice: string;
}> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const prompt = `
            Analysez cette photo de déchets prise dans une rue ou un quartier de Kinshasa. 
            Déterminez précisément le type de déchets prédominant.
            Évaluez l'urgence de collecte (high si obstruction de caniveaux, risque d'inondation, ou danger sanitaire immédiat).
            Identifiez les risques spécifiques (produits chimiques, verre brisé, stagnation d'eau pour moustiques).
            Fournissez une explication sur l'impact environnemental local et un conseil immédiat pour le citoyen.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
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
        console.error("Analysis Error:", error);
        return { 
            wasteType: "Mixte", 
            urgency: "medium", 
            comment: "Désolé, une erreur technique a limité l'analyse de l'image.", 
            isDangerous: false,
            environmentalImpact: "Inconnu",
            immediateAdvice: "Veuillez rester prudent autour de la zone."
        };
    }
};

/**
 * Permet de poser une question spécifique sur l'image envoyée
 */
export const chatAboutWasteImage = async (base64Image: string, userQuestion: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: `CONTEXTE: Vous voyez cette photo de déchets à Kinshasa. Répondez à cette question de l'utilisateur : "${userQuestion}". Restez bref et expert.` }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text || "Désolé, je n'ai pas pu analyser votre question.";
    } catch (error) {
        return "Une erreur est survenue lors de l'échange avec l'IA.";
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
                    { text: "Identifiez cet objet pour la vente en marketplace de recyclage à Kinshasa. Estimez son poids et un prix juste en FC." }
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
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "En tant qu'expert en propreté urbaine, vérifiez si cet emplacement est parfaitement propre après une collecte. Soyez sévère." }
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

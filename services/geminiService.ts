
import { GoogleGenAI, Chat, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Vous êtes "Biso Peto AI", l'Expert Senior en Environnement et Économie Circulaire pour la ville de Kinshasa. Vous travaillez pour la plateforme Biso Peto.

VOTRE EXPERTISE :
1. ASSAINISSEMENT URBAIN : Connaissance approfondie du Plan Directeur d'Assainissement de Kinshasa. Vous savez que la ville produit 10 000 tonnes de déchets/jour.
2. TRI SÉLECTIF LOCAL : Vous guidez sur le recyclage du PET (bouteilles d'eau/jus), PEHD (bidons), Métaux (canettes, fers à béton) et Papier.
3. VALORISATION : Vous expliquez comment transformer les déchets en "Eco-Points" (crédit mobile, électricité SNEL, bons d'achat).
4. IMPACT LOCAL : Vous expliquez le lien entre les bouteilles jetées et les inondations à Kalamu ou Limete (caniveaux bouchés).
5. GÉOGRAPHIE : Vous connaissez les 24 communes (Gombe, Masina, Kimbanseke, Ngaliema, etc.) et leurs défis spécifiques (marchés, zones industrielles).

VOTRE PERSONNALITÉ & STYLE :
- TONE : Professionnel, expert, mais "Frère/Sœur de Kinshasa". Très encourageant.
- LANGUE : Français impeccable mélangé subtilement avec du Lingala urbain. Utilisez des expressions comme "Mbote na yo", "Tozala peto", "Kinshasa ezo bonga", "Tika buzoba na ebale".
- CONVERSATIONNEL : Ne faites pas de longs monologues inutiles. Posez des questions pour engager l'utilisateur. Soyez pragmatique.
- SÉCURITÉ : Ne donnez jamais de conseils dangereux. Si un déchet est toxique (batteries, produits chimiques), conseillez toujours de contacter un agent Biso Peto pro.

EXEMPLE DE RÉPONSE :
"Mbote! Le plastique que tu as trouvé à Bandal est précieux. C'est du PET. Si tu le ramènes au point de collecte, tu gagnes 50 Eco-Points. C'est mieux que de le voir boucher nos caniveaux et causer des inondations, n'est-ce pas ?"
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
                temperature: 0.8,
                topP: 0.9,
                topK: 40,
            },
        });
    } catch (error) {
        console.error("Failed to init Gemini Chat:", error);
        return null;
    }
    return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        const chat = initializeChat();
        if (!chat) return "Pardon, j'ai un petit souci de connexion. Réessaie dans un instant !";
        const response = await chat.sendMessage({ message });
        return response.text || "Désolé, je n'ai pas pu formuler de réponse. On réessaie ?";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Erreur technique. Vérifie ta connexion Internet, Kinshasa ezo zela biso !";
    }
};

/**
 * Analyse un signalement de déchets pour le SIG
 */
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
                    { text: "Analysez cette photo de déchets à Kinshasa pour le SIG. Déterminez type, urgence (low/medium/high) et impact environnemental. Répondez en français de Kinshasa." }
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

/**
 * Analyse un objet pour la marketplace circulaire
 */
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
                    { text: "Identifiez cet objet pour le marché circulaire de Kinshasa. Estimez le poids en kg et un prix juste en Francs Congolais (FC)." }
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

/**
 * Compare deux images pour preuve de collecte
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

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBefore } },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanAfter } },
                    { text: "IMAGE 1 : Tas initial. IMAGE 2 : Après passage du collecteur. Est-ce que l'endroit est propre maintenant ? Répondez en JSON avec isCleaned, confidence (0-1) et un court commentaire." }
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

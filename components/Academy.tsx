
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, BookOpen, ChevronRight, Mic, MicOff, Volume2, VolumeX, User, BrainCircuit, Lightbulb, GraduationCap, Sparkles, Loader2 } from 'lucide-react';
import { Course, ChatMessage } from '../types';
import { sendMessageStream } from '../services/geminiService';

interface AcademyProps {
    onBack: () => void;
}

const COURSES: Course[] = [
    { 
        id: '1', 
        title: 'Recyclage 101', 
        description: 'Les bases du tri et du recyclage. Apprenez à distinguer les plastiques à Kinshasa.', 
        progress: 30, 
        icon: 'recycle', 
        color: 'bg-green-100 text-green-600',
        videoUrl: 'https://www.youtube.com/watch?v=OasbYWF4_S8'
    },
    { id: '2', title: 'Compostage Maison', description: 'Transformer l\'organique en or pour vos plantes.', progress: 0, icon: 'leaf', color: 'bg-amber-100 text-amber-600' },
    { id: '3', title: 'Réduction Déchets', description: 'Stratégies zéro déchet au quotidien à Kinshasa.', progress: 80, icon: 'trash', color: 'bg-blue-100 text-blue-600' },
];

const AI_SUGGESTIONS = [
    "💧 Pourquoi recycler les bouteilles ?",
    "💰 Comment échanger mes points ?",
    "🌱 Faire du compost à la maison",
    "🗺️ Centres de tri à Kinshasa",
];

export const Academy: React.FC<AcademyProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'chat'>('learn');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: '0', sender: 'ai', text: 'Mbote na yo! Je suis ton Expert Biso Peto. 🌍 Prêt à transformer Kinshasa avec moi ? Pose-moi n\'importe quelle question sur le recyclage !', timestamp: new Date() }
            ]);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom();
    }, [messages, activeTab, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSend, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        const aiMsgId = (Date.now() + 1).toString();
        // On crée un message vide pour l'IA que l'on va remplir par stream
        setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: "", timestamp: new Date() }]);

        let fullAiText = "";
        let hasStartedStreaming = false;

        try {
            const stream = sendMessageStream(textToSend);
            for await (const chunk of stream) {
                if (!hasStartedStreaming) hasStartedStreaming = true;
                fullAiText += chunk;
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullAiText } : m));
            }

            if (!hasStartedStreaming && !fullAiText) {
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Désolé, je n'ai pas pu générer de réponse. Vérifie ta connexion Internet." } : m));
            }
        } catch (e) {
            console.error("Academy Chat Interface Error:", e);
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Oups ! Une erreur réseau m'empêche de répondre. Réessaie dans quelques secondes." } : m));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b dark:border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => selectedCourse ? setSelectedCourse(null) : onBack()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
                        <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                            {selectedCourse ? selectedCourse.title : 'Biso Peto Academy'}
                        </h2>
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">
                            {activeTab === 'chat' ? 'Conversation avec l\'IA Expert' : 'Formations'}
                        </span>
                    </div>
                </div>
            </div>

            {!selectedCourse && (
                <div className="flex p-3 gap-2 bg-white/50 dark:bg-gray-900/50 border-b dark:border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'learn' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        <BookOpen size={14}/> Apprendre
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        <BrainCircuit size={14}/> Chat Expert
                    </button>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'learn' || selectedCourse ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
                        {selectedCourse ? (
                             <div className="animate-fade-in space-y-6">
                                <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                                    <iframe 
                                        width="100%" height="100%" 
                                        src={`https://www.youtube.com/embed/${selectedCourse.videoUrl?.split('v=')[1]}`} 
                                        frameBorder="0" allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-4">{selectedCourse.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">{selectedCourse.description}</p>
                                    <button className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs">Démarrer le Quiz</button>
                                </div>
                             </div>
                        ) : (
                            <div className="space-y-4">
                                {COURSES.map(c => (
                                    <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-white/5 shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-xl transition-all">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${c.color} bg-opacity-20`}>
                                            <BookOpen size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base">{c.title}</h4>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mr-4">
                                                    <div className="h-full bg-primary" style={{width: `${c.progress}%`}}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400">{c.progress}%</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-300" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden animate-fade-in relative">
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar pb-10">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'ai' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>
                                        {msg.sender === 'ai' ? <Bot size={22} /> : <User size={22} />}
                                    </div>
                                    <div className={`max-w-[85%] px-6 py-5 rounded-[2rem] shadow-sm font-medium text-sm leading-relaxed ${
                                        msg.sender === 'ai' 
                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-bl-none border dark:border-white/5' 
                                        : 'bg-blue-600 text-white rounded-br-none'
                                    }`}>
                                        {msg.text || (isLoading && msg.sender === 'ai' ? "Génération en cours..." : "")}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t dark:border-white/5 shrink-0 pb-12 rounded-t-[3rem] shadow-xl">
                            {messages.length < 3 && (
                                <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 px-2">
                                    {AI_SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => handleSendMessage(s)} className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase whitespace-nowrap border dark:border-white/5">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        className="w-full py-5 pl-7 pr-16 bg-gray-50 dark:bg-gray-800/80 border-none outline-none rounded-[1.8rem] font-bold text-sm dark:text-white"
                                        placeholder="Pose ta question à l'Expert..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={isLoading}
                                    />
                                    <button onClick={() => handleSendMessage()} disabled={isLoading} className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl disabled:opacity-50">
                                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

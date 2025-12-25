
import React, { useState, useRef, useEffect } from 'react';
/* Added GraduationCap to the imports from lucide-react */
import { Send, Bot, ArrowLeft, BookOpen, Leaf, Recycle, Trash2, PlayCircle, MessageSquare, Play, CheckCircle, Clock, Sparkles, Zap, ChevronRight, Mic, MicOff, Volume2, VolumeX, StickyNote, Save, User, BrainCircuit, Lightbulb, GraduationCap } from 'lucide-react';
import { Course, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

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
    "💧 Pourquoi recycler les bouteilles d'eau ?",
    "💰 Comment échanger mes points ?",
    "🌱 Faire du compost avec des peaux de banane",
    "🗺️ Où sont les centres de tri à Gombe ?",
    "⚠️ Signalement : Que faire pour des piles usagées ?",
];

export const Academy: React.FC<AcademyProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'chat'>('learn');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Init first message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: '0', sender: 'ai', text: 'Mbote na yo! Je suis ton Expert Biso Peto. 🌍 Je connais chaque coin de Kinshasa et je sais comment transformer tes ordures en trésor. Qu\'est-ce qu\'on nettoie aujourd\'hui ?', timestamp: new Date() }
            ]);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom();
    }, [messages, activeTab, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- Voice Implementation ---
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'fr-FR';
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSendMessage(transcript);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) recognitionRef.current?.stop();
        else recognitionRef.current?.start();
    };

    const speakText = (text: string) => {
        if (isMuted) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSend, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const aiResponseText = await sendMessageToGemini(textToSend);
            const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponseText, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);
            speakText(aiResponseText);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: "Hmm, ma connexion avec la tour de contrôle est instable. On réessaie ?", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            {/* Header Interne */}
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
                            {activeTab === 'chat' ? 'Conversation avec l\'Expert' : 'Centre de Formation'}
                        </span>
                    </div>
                </div>
                {activeTab === 'chat' && (
                    <div className="flex items-center gap-2">
                         <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black text-blue-600 uppercase">Expert Online</span>
                         </div>
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-xl transition-all ${isMuted ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>
                )}
            </div>

            {/* View Switcher */}
            {!selectedCourse && (
                <div className="flex p-3 gap-2 bg-white/50 dark:bg-gray-900/50 border-b dark:border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'learn' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        <BookOpen size={14}/> Formations
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        <BrainCircuit size={14}/> Expert IA
                    </button>
                </div>
            )}

            {/* Content Area */}
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
                                    <div className="flex items-center gap-2 mb-4 text-primary">
                                        <Sparkles size={16}/>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Leçon Interactive</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight leading-tight">{selectedCourse.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">{selectedCourse.description}</p>
                                    <button className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-500/20 active:scale-95 transition-all">Lancer le Quiz final (+50 XP)</button>
                                </div>
                             </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-8 bg-gradient-to-br from-primary to-green-700 rounded-[3rem] text-white relative overflow-hidden mb-6">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><GraduationCap size={120} /></div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Deviens un <br/> Héros Local</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Apprends à trier, gagne des points</p>
                                </div>
                                {COURSES.map(c => (
                                    <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${c.color} bg-opacity-20 shadow-inner group-hover:scale-110 transition-transform`}>
                                            <BookOpen size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base truncate group-hover:text-primary transition-colors">{c.title}</h4>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mr-4 shadow-inner">
                                                    <div className="h-full bg-primary transition-all duration-1000" style={{width: `${c.progress}%`}}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400">{c.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden animate-fade-in relative">
                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar pb-10">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'ai' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>
                                        {msg.sender === 'ai' ? <Bot size={22} /> : <User size={22} />}
                                    </div>
                                    <div className={`max-w-[85%] px-6 py-5 rounded-[2rem] shadow-sm font-medium text-sm leading-relaxed relative ${
                                        msg.sender === 'ai' 
                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-bl-none border dark:border-white/5' 
                                        : 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                                    }`}>
                                        {msg.text}
                                        <div className={`absolute bottom-[-20px] text-[8px] font-black uppercase text-gray-400 ${msg.sender === 'user' ? 'right-0' : 'left-0'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Bot size={22} className="text-blue-600" /></div>
                                    <div className="bg-white dark:bg-gray-900 px-6 py-5 rounded-[2rem] rounded-bl-none border dark:border-white/5 shadow-sm">
                                        <div className="flex gap-2 items-center h-5">
                                            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t dark:border-white/5 shrink-0 pb-12 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                            {messages.length < 6 && (
                                <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 px-2">
                                    {AI_SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => handleSendMessage(s)} className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase whitespace-nowrap border border-gray-100 dark:border-white/5 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center gap-2">
                                            <Lightbulb size={12} className="text-blue-500" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3 items-center">
                                <button onClick={toggleListening} className={`p-5 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-xl' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                                <div className="flex-1 relative group">
                                    <input 
                                        type="text" 
                                        className="w-full py-5 pl-7 pr-16 bg-gray-50 dark:bg-gray-800/80 border-none outline-none rounded-[1.8rem] font-bold text-sm dark:text-white focus:ring-4 ring-blue-500/10 shadow-inner transition-all"
                                        placeholder="Pose ta question à l'Expert..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 active:scale-90 hover:scale-105 transition-all">
                                        <Send size={20} />
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

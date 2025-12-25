
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, BookOpen, Leaf, Recycle, Trash2, PlayCircle, MessageSquare, Play, CheckCircle, Clock, Sparkles, Zap, ChevronRight, Mic, MicOff, Volume2, VolumeX, StickyNote, Save, User } from 'lucide-react';
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
    "Pourquoi il ne faut pas jeter le plastique dans le caniveau ?",
    "Comment gagner plus d'Eco-Points ?",
    "Faire du compost avec des restes de manioc",
    "Où partent les déchets de Kinshasa ?",
    "Impact de la pollution sur le fleuve Congo",
];

export const Academy: React.FC<AcademyProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'chat'>('learn');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '0', sender: 'ai', text: 'Mbote ! Je suis votre expert écolo. Je connais Kinshasa comme ma poche et je suis là pour vous aider à rendre notre ville "Peto" (propre). Que voulez-vous savoir ? 🌍', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const recognitionRef = useRef<any>(null);

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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            {/* Header Interne (Layout Slim Compatible) */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b dark:border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => selectedCourse ? setSelectedCourse(null) : onBack()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
                        <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                            {selectedCourse ? selectedCourse.title : 'Biso Peto Academy'}
                        </h2>
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">Savoir & Impact</span>
                    </div>
                </div>
                {activeTab === 'chat' && (
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-xl transition-all ${isMuted ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                )}
            </div>

            {/* View Switcher */}
            {!selectedCourse && (
                <div className="flex p-3 gap-2 bg-white/50 dark:bg-gray-900/50 border-b dark:border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'learn' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        Formations
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        Expert IA
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'learn' || selectedCourse ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
                        {selectedCourse ? (
                             <div className="animate-fade-in space-y-6">
                                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                                    <iframe 
                                        width="100%" height="100%" 
                                        src={`https://www.youtube.com/embed/${selectedCourse.videoUrl?.split('v=')[1]}`} 
                                        frameBorder="0" allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-3 tracking-tight">{selectedCourse.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{selectedCourse.description}</p>
                                    <button className="w-full mt-6 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Lancer le Quiz final</button>
                                </div>
                             </div>
                        ) : (
                            COURSES.map(c => (
                                <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-md transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${c.color} bg-opacity-20 shadow-inner`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm truncate group-hover:text-primary transition-colors">{c.title}</h4>
                                        <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-1000" style={{width: `${c.progress}%`}}></div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 w-5 h-5" />
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden animate-fade-in">
                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pb-10">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.sender === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                                        {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] shadow-sm font-medium text-xs leading-relaxed ${
                                        msg.sender === 'ai' 
                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-bl-none border dark:border-white/5' 
                                        : 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Bot size={16} className="text-blue-600" /></div>
                                    <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-[1.8rem] rounded-bl-none border dark:border-white/5 shadow-sm">
                                        <div className="flex gap-1.5 items-center h-4">
                                            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t dark:border-white/5 shrink-0 pb-10">
                            {messages.length < 5 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                                    {AI_SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => handleSendMessage(s)} className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 text-[9px] font-black uppercase whitespace-nowrap border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <button onClick={toggleListening} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        className="w-full py-4 pl-5 pr-14 bg-gray-50 dark:bg-gray-800/80 border-none outline-none rounded-2xl font-bold text-xs dark:text-white focus:ring-2 ring-blue-500/20 shadow-inner"
                                        placeholder="Posez votre question écolo..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                                        <Send size={16} />
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

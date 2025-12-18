
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
    "Comment trier les bouteilles plastiques ?",
    "Boni, où sont les points de recyclage ?",
    "C'est quoi le compostage ?",
    "Comment gagner plus d'Eco Points ?",
];

export const Academy: React.FC<AcademyProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'chat'>('learn');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '0', sender: 'ai', text: 'Mbote ! Je suis Biso Peto AI, votre guide pour une ville plus propre. Comment puis-je vous aider aujourd\'hui ?', timestamp: new Date() }
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
    }, [messages, activeTab]);

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
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center sticky top-0 z-10 border-b dark:border-gray-800 shrink-0">
                <button onClick={() => selectedCourse ? setSelectedCourse(null) : onBack()} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                    {selectedCourse ? selectedCourse.title : 'Biso Peto Academy'}
                </h2>
                {activeTab === 'chat' && (
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`ml-auto p-2 rounded-xl transition-all ${isMuted ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                )}
            </div>

            {/* Global Tabs */}
            {!selectedCourse && (
                <div className="flex p-4 gap-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shrink-0">
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'learn' ? 'bg-[#00C853] text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                    >
                        Formation
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-[#2962FF] text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                    >
                        Assistant IA
                    </button>
                </div>
            )}

            {/* Content Switcher */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'learn' || selectedCourse ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
                        {selectedCourse ? (
                             <div className="animate-fade-in space-y-6">
                                <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <iframe 
                                        width="100%" height="100%" 
                                        src={`https://www.youtube.com/embed/${selectedCourse.videoUrl?.split('v=')[1]}`} 
                                        frameBorder="0" allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tighter">{selectedCourse.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{selectedCourse.description}</p>
                                    <button className="w-full mt-8 py-5 bg-[#00C853] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all">Lancer le Quiz final</button>
                                </div>
                             </div>
                        ) : (
                            COURSES.map(c => (
                                <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm flex items-center gap-6 cursor-pointer hover:scale-[1.02] transition-all group">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${c.color} bg-opacity-20`}>
                                        <BookOpen size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-[#00C853] transition-colors">{c.title}</h4>
                                        <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#00C853] transition-all duration-1000" style={{width: `${c.progress}%`}}></div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300" />
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden animate-fade-in">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-10">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-[#2962FF] text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                                        {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] shadow-sm font-medium text-sm leading-relaxed ${
                                        msg.sender === 'ai' 
                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-bl-none border dark:border-gray-800' 
                                        : 'bg-[#2962FF] text-white rounded-br-none shadow-blue-500/20'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Bot size={16} className="text-[#2962FF] animate-pulse" /></div>
                                    <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-[1.8rem] rounded-bl-none border dark:border-gray-800">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shrink-0">
                            {messages.length < 3 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                                    {AI_SUGGESTIONS.map((s, i) => (
                                        <button key={i} onClick={() => handleSendMessage(s)} className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] text-[10px] font-black uppercase whitespace-nowrap border border-blue-100 dark:border-blue-900/40">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <button onClick={toggleListening} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#2962FF]'}`}>
                                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                                </button>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        className="w-full py-4 pl-5 pr-14 bg-gray-50 dark:bg-gray-800 border-none outline-none rounded-[1.5rem] font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20"
                                        placeholder="Posez votre question sur l'écologie..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 p-3 bg-[#2962FF] text-white rounded-xl shadow-lg active:scale-90 transition-all">
                                        <Send size={18} />
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

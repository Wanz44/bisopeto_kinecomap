
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, BookOpen, Leaf, Recycle, Trash2, PlayCircle, MessageSquare, Play, CheckCircle, Clock, Sparkles, Zap, ChevronRight, Mic, MicOff, Volume2, VolumeX, StickyNote, Save } from 'lucide-react';
import { Course, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface AcademyProps {
    onBack: () => void;
}

const COURSES: Course[] = [
    { 
        id: '1', 
        title: 'Recyclage 101', 
        description: 'Les bases du tri et du recyclage. Apprenez à distinguer les différents types de plastiques.', 
        progress: 30, 
        icon: 'recycle', 
        color: 'bg-green-100 text-green-600',
        videoUrl: 'https://www.youtube.com/watch?v=OasbYWF4_S8'
    },
    { id: '2', title: 'Compostage Maison', description: 'Transformer l\'organique en or pour vos plantes.', progress: 0, icon: 'leaf', color: 'bg-amber-100 text-amber-600' },
    { id: '3', title: 'Réduction Déchets', description: 'Stratégies zéro déchet au quotidien à Kinshasa.', progress: 80, icon: 'trash', color: 'bg-blue-100 text-blue-600' },
];

const AI_SUGGESTIONS = [
    "Comment trier les bouteilles en plastique ?",
    "Où jeter les piles usagées ?",
    "C'est quoi le compostage ?",
    "Horaire de passage du camion ?",
];

export const Academy: React.FC<AcademyProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'chat'>('learn');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    // Course Detail States
    const [courseSubTab, setCourseSubTab] = useState<'details' | 'notes'>('details');
    const [courseNotes, setCourseNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '0', sender: 'ai', text: 'Mbote! Je suis Biso Peto AI. Posez-moi une question sur le recyclage à Kinshasa!', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom();
    }, [messages, activeTab]);

    // --- Course Notes Logic ---
    useEffect(() => {
        if (selectedCourse) {
            const savedNotes = localStorage.getItem(`kinecomap_notes_${selectedCourse.id}`) || '';
            setCourseNotes(savedNotes);
            setCourseSubTab('details');
        }
    }, [selectedCourse]);

    const handleSaveNotes = () => {
        if (selectedCourse) {
            setIsSavingNotes(true);
            localStorage.setItem(`kinecomap_notes_${selectedCourse.id}`, courseNotes);
            // Simulate network delay for UX
            setTimeout(() => setIsSavingNotes(false), 500);
        }
    };

    // --- Voice Logic (Speech-to-Text) ---
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'fr-FR'; // Par défaut Français (Kinshasa)

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSendMessage(transcript); // Auto-send on voice end
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    // --- Speech Logic (Text-to-Speech) ---
    const speakText = (text: string) => {
        if (isMuted) return;
        window.speechSynthesis.cancel(); // Stop previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.pitch = 1;
        utterance.rate = 1.1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        const aiResponseText = await sendMessageToGemini(textToSend);

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        speakText(aiResponseText); // Read response
    };

    const handleBackClick = () => {
        if (selectedCourse) {
            setSelectedCourse(null);
        } else {
            onBack();
        }
    };

    const getIcon = (name: string) => {
        switch(name) {
            case 'recycle': return <Recycle size={24} />;
            case 'leaf': return <Leaf size={24} />;
            case 'trash': return <Trash2 size={24} />;
            default: return <BookOpen size={24} />;
        }
    };

    // Helper to get YouTube Embed URL
    const getEmbedUrl = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <button onClick={handleBackClick} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedCourse ? 'Détails du Cours' : 'BISO PETO Academy'}
                </h2>
                {activeTab === 'chat' && !selectedCourse && (
                    <button 
                        onClick={() => { window.speechSynthesis.cancel(); setIsMuted(!isMuted); }}
                        className={`ml-auto p-2 rounded-full ${isMuted ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                )}
            </div>

            {/* Tabs (Hidden when in Course Detail) */}
            {!selectedCourse && (
                <div className="flex p-4 gap-4 shrink-0 bg-[#F5F7FA] dark:bg-gray-900 z-10">
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'learn' ? 'bg-[#00C853] text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                    >
                        <BookOpen size={18} /> Cours
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-[#2962FF] text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                    >
                        <Sparkles size={18} /> Assistant Vocal
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'chat' && !selectedCourse ? 'p-0' : 'px-4 pb-4'}`}>
                {activeTab === 'learn' || selectedCourse ? (
                    <div className="flex-1 overflow-y-auto">
                    {selectedCourse ? (
                        /* --- COURSE DETAIL VIEW --- */
                        <div className="animate-fade-in space-y-4 pt-2 pb-20">
                            
                            {/* Video Player Section */}
                            {selectedCourse.videoUrl && getEmbedUrl(selectedCourse.videoUrl) && (
                                <div className="w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-black relative group">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={getEmbedUrl(selectedCourse.videoUrl) || ''} 
                                        title={selectedCourse.title}
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        className="absolute inset-0"
                                    ></iframe>
                                </div>
                            )}

                            {/* Internal Course Tabs */}
                            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={() => setCourseSubTab('details')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${courseSubTab === 'details' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    <BookOpen size={16} /> Contenu
                                </button>
                                <button 
                                    onClick={() => setCourseSubTab('notes')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${courseSubTab === 'notes' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    <StickyNote size={16} /> Mes Notes
                                </button>
                            </div>

                            {/* Course Content Switcher */}
                            {courseSubTab === 'details' ? (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedCourse.color} bg-opacity-20`}>
                                                {getIcon(selectedCourse.icon)}
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{selectedCourse.title}</h1>
                                            </div>
                                        </div>
                                        <div className="radial-progress text-[#00C853] text-xs font-bold" style={{"--value":selectedCourse.progress, "--size": "3rem"} as any}>
                                            {selectedCourse.progress}%
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">{selectedCourse.description}</p>
                                    
                                    {!selectedCourse.videoUrl && (
                                        <button className="w-full py-4 bg-[#2962FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                            <Play size={20} fill="currentColor" /> Commencer le cours
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in flex flex-col h-96">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            <StickyNote size={18} className="text-[#2962FF]" /> Notes personnelles
                                        </h3>
                                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Privé</span>
                                    </div>
                                    
                                    <textarea 
                                        className="flex-1 w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 outline-none border border-transparent focus:border-blue-200 dark:focus:border-blue-800 resize-none leading-relaxed placeholder-gray-400"
                                        placeholder="Notez ici vos idées clés, questions ou rappels..."
                                        value={courseNotes}
                                        onChange={(e) => setCourseNotes(e.target.value)}
                                    ></textarea>
                                    
                                    <div className="mt-4 flex justify-end">
                                        <button 
                                            onClick={handleSaveNotes}
                                            disabled={isSavingNotes}
                                            className="px-6 py-2 bg-[#2962FF] hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-500/20"
                                        >
                                            {isSavingNotes ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                                            {isSavingNotes ? 'Sauvegarde...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- COURSE LIST VIEW --- */
                        <div className="space-y-6 animate-fade-in pb-20">
                            <div className="grid grid-cols-1 gap-4">
                                {COURSES.map(course => (
                                    <div 
                                        key={course.id} 
                                        onClick={() => setSelectedCourse(course)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start cursor-pointer hover:shadow-md transition-all hover:border-[#00C853] group"
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 shrink-0 ${course.color} dark:bg-opacity-20 transition-transform group-hover:scale-105`}>
                                            {getIcon(course.icon)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-[#00C853] transition-colors">{course.title}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">{course.description}</p>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#00C853] rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                ) : (
                    /* --- CHAT VIEW --- */
                    <div className="flex flex-col h-full bg-white dark:bg-gray-800 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:dark:border-gray-700 overflow-hidden animate-fade-in relative md:mx-0 md:mb-0">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center gap-2 shrink-0">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                                <Bot size={18} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-700 dark:text-white text-sm">Assistant Biso Peto</h3>
                                 <p className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    En ligne (Parlez-moi!)
                                 </p>
                             </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                            {messages.length <= 1 && !isLoading && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                                        Je parle Français et Lingala. Appuyez sur le micro pour me poser une question.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                                        {AI_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                                            <button key={idx} onClick={() => handleSendMessage(suggestion)} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-[#2962FF] dark:hover:border-blue-500 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-full transition-all flex items-center gap-1">
                                                <Zap size={10} className="text-yellow-500" />
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-scale-up`}>
                                    <div className={`max-w-[90%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm relative group ${msg.sender === 'user' ? 'bg-[#2962FF] text-white rounded-tr-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                        <Bot size={16} className="text-[#2962FF] animate-pulse" />
                                        <div className="flex space-x-1">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 relative shrink-0">
                            <div className="flex gap-2 items-end">
                                <button 
                                    onClick={toggleListening}
                                    className={`p-3 rounded-full transition-all shadow-md ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white'}`}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:bg-white dark:focus-within:bg-gray-800">
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isListening ? "Je vous écoute..." : "Écrivez votre message..."}
                                        className="flex-1 bg-transparent text-gray-800 dark:text-white border-none text-sm outline-none w-full"
                                        autoComplete="off"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={isLoading || !inputValue.trim()}
                                    className="bg-[#00C853] text-white p-3 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { Sparkles, Leaf, Recycle, MapPin } from 'lucide-react';

interface SplashScreenProps {
    appLogo?: string;
}

const LOADING_MESSAGES = [
    { text: "Mbote! Préparation de votre espace Eco...", icon: Sparkles },
    { text: "Chargement de la carte de Kinshasa...", icon: MapPin },
    { text: "Optimisation des tournées de collecte...", icon: Leaf },
    { text: "Calcul de votre impact environnemental...", icon: Recycle },
    { text: "Agir localement, impacter durablement.", icon: Sparkles },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ appLogo = 'logobisopeto.png' }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Cycle des messages toutes le 1.2 secondes
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 1500);

        // Simulation de progression réelle
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                // Progression plus lente vers la fin pour l'effet "finition"
                const inc = prev > 80 ? 0.5 : 2;
                return prev + inc;
            });
        }, 50);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const CurrentIcon = LOADING_MESSAGES[messageIndex].icon;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#050505] transition-colors duration-700 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

            <style>
                {`
                @keyframes soft-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                .logo-pulse {
                    animation: soft-pulse 3s ease-in-out infinite;
                }
                .message-fade {
                    animation: fadeInOut 1.5s ease-in-out infinite;
                }
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0.3; transform: translateY(5px); }
                    50% { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
            
            <div className="flex flex-col items-center relative z-10">
                {/* Logo Section */}
                <div className="w-32 h-32 mb-12 flex items-center justify-center logo-pulse">
                    <img 
                        src={appLogo} 
                        alt="BISO PETO" 
                        className="w-full h-full object-contain drop-shadow-2xl" 
                    />
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-64 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-10 shadow-inner relative">
                    <div 
                        className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(46,125,50,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Animated Info Text */}
                <div className="h-12 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2 message-fade">
                        <CurrentIcon size={14} />
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] font-sans">
                            {LOADING_MESSAGES[messageIndex].text}
                        </p>
                    </div>
                </div>

                {/* Branding */}
                <div className="mt-16 flex flex-col items-center">
                    <h1 className="text-2xl font-black tracking-[-0.05em] text-gray-900 dark:text-white uppercase">
                        BISO <span className="text-primary italic">PETO</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                            KIN ECO-MAP
                        </p>
                        <div className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>

            {/* Footer Build info */}
            <div className="absolute bottom-10 flex flex-col items-center gap-2">
                <p className="text-[9px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-widest">
                    V1.4.0 • PRODUCTION RDC
                </p>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    );
};

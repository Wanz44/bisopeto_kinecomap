
import React from 'react';

interface SplashScreenProps {
    appLogo?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ appLogo = './logo.png' }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#00C853] to-[#2962FF] text-white">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-bounce overflow-hidden p-3">
                <img src={appLogo} alt="KIN ECO-MAP Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight animate-pulse">KIN ECO-MAP</h1>
            <p className="text-white/80 text-sm">Chargement de votre expérience...</p>
            <div className="mt-8 flex gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            </div>
        </div>
    );
};

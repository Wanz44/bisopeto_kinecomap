
import React from 'react';

interface SplashScreenProps {
    appLogo?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ appLogo = './logo%20bisopeto.png' }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f3f3f3] dark:bg-[#000000] transition-colors duration-700">
            <style>
                {`
                .win11-spinner {
                    position: relative;
                    width: 40px;
                    height: 40px;
                }
                .win11-dot {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #0067c0;
                    border-radius: 50%;
                    opacity: 0;
                    animation: win11-move 2.5s infinite;
                }
                .dark .win11-dot {
                    background: #ffffff;
                }
                .win11-dot:nth-child(1) { animation-delay: 0.1s; }
                .win11-dot:nth-child(2) { animation-delay: 0.25s; }
                .win11-dot:nth-child(3) { animation-delay: 0.4s; }
                .win11-dot:nth-child(4) { animation-delay: 0.55s; }
                .win11-dot:nth-child(5) { animation-delay: 0.7s; }

                @keyframes win11-move {
                    0% { transform: rotate(225deg); opacity: 1; animation-timing-function: ease-out; }
                    7% { transform: rotate(345deg); animation-timing-function: linear; }
                    30% { transform: rotate(455deg); animation-timing-function: ease-in-out; }
                    39% { transform: rotate(570deg); animation-timing-function: linear; }
                    70% { transform: rotate(815deg); opacity: 1; animation-timing-function: ease-out; }
                    75% { transform: rotate(945deg); animation-timing-function: ease-out; }
                    76% { transform: rotate(945deg); opacity: 0; }
                    100% { transform: rotate(945deg); opacity: 0; }
                }
                `}
            </style>
            
            <div className="flex flex-col items-center animate-fade-in">
                <div className="w-24 h-24 mb-12 flex items-center justify-center">
                    <img 
                        src={appLogo} 
                        alt="BISO PETO" 
                        className="w-full h-full object-contain" 
                    />
                </div>
                
                {/* Windows 11 style dots spinner */}
                <div className="win11-spinner mt-10">
                    <div className="win11-dot"></div>
                    <div className="win11-dot"></div>
                    <div className="win11-dot"></div>
                    <div className="win11-dot"></div>
                    <div className="win11-dot"></div>
                </div>

                <div className="mt-20 flex flex-col items-center">
                    <h1 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white/90">
                        BISO PETO
                    </h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">
                        KIN ECO-MAP
                    </p>
                </div>
            </div>

            <div className="absolute bottom-10 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                Production DRC
            </div>
        </div>
    );
};

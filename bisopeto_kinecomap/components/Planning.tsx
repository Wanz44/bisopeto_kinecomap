
import React from 'react';
import { ArrowLeft, Calendar, Trash2, Recycle, Leaf, AlertCircle, Clock } from 'lucide-react';

interface PlanningProps {
    onBack: () => void;
}

export const Planning: React.FC<PlanningProps> = ({ onBack }) => {
    const events = [
        { id: 1, type: 'trash', title: 'Déchets Ménagers', time: '10:30', date: 'Aujourd\'hui', status: 'pending' },
        { id: 2, type: 'recycle', title: 'Recyclage (Plastique)', time: '14:00', date: 'Mercredi 24 Mai', status: 'upcoming' },
        { id: 3, type: 'organic', title: 'Déchets Organiques', time: '09:00', date: 'Vendredi 26 Mai', status: 'upcoming' },
        { id: 4, type: 'trash', title: 'Déchets Ménagers', time: '10:30', date: 'Lundi 29 Mai', status: 'upcoming' },
    ];

    const getIcon = (type: string) => {
        switch(type) {
            case 'trash': return <Trash2 size={24} />;
            case 'recycle': return <Recycle size={24} />;
            case 'organic': return <Leaf size={24} />;
            default: return <Calendar size={24} />;
        }
    };

    const getColor = (type: string) => {
        switch(type) {
            case 'trash': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
            case 'recycle': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'organic': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Planning de Collecte</h2>
            </div>

            <div className="p-5 space-y-6">
                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">Sortez vos poubelles au moins 30 minutes avant l'heure de passage prévue.</p>
                </div>

                <div className="space-y-3">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getColor(event.type)}`}>
                                {getIcon(event.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white">{event.title}</h4>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    <Clock size={14} className="mr-1" />
                                    <span>{event.date} à {event.time}</span>
                                </div>
                            </div>
                            {event.status === 'pending' && (
                                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    Bientôt
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

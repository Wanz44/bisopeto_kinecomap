

import React from 'react';
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, Clock } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsProps {
    onBack: () => void;
    notifications: NotificationItem[];
    onMarkAllRead: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, notifications, onMarkAllRead }) => {
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <CheckCircle size={20} className="text-white" />;
            case 'warning': return <Clock size={20} className="text-white" />;
            case 'alert': return <AlertTriangle size={20} className="text-white" />;
            default: return <Info size={20} className="text-white" />;
        }
    };

    const getBgColor = (type: string) => {
        switch(type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-amber-500';
            case 'alert': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h2>
                </div>
                <button 
                    onClick={onMarkAllRead}
                    className="text-sm text-[#00C853] font-semibold hover:underline"
                >
                    Tout marquer lu
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Bell size={48} className="mb-4 opacity-50" />
                        <p>Aucune notification pour le moment</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getBgColor(notif.type)}`}>
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{notif.title}</h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                            </div>
                            {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
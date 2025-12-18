
import React, { useState } from 'react';
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, Clock, Send, Users, MapPin, X, Trash2, Calendar, Target, ShieldAlert, MessageSquare } from 'lucide-react';
import { NotificationItem, UserType } from '../types';

interface NotificationsProps {
    onBack: () => void;
    notifications: NotificationItem[];
    onMarkAllRead: () => void;
    isAdmin?: boolean;
    onSendNotification?: (notif: Partial<NotificationItem>) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, notifications, onMarkAllRead, isAdmin, onSendNotification }) => {
    const [viewMode, setViewMode] = useState<'inbox' | 'compose' | 'history'>(isAdmin ? 'compose' : 'inbox');
    const [newNotif, setNewNotif] = useState({
        title: '',
        message: '',
        targetRole: 'ALL',
        targetCommune: 'ALL',
        type: 'info' as any
    });

    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <CheckCircle size={20} className="text-white" />;
            case 'warning': return <Clock size={20} className="text-white" />;
            case 'alert': return <AlertTriangle size={20} className="text-white" />;
            default: return <Info size={20} className="text-white" />;
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSendNotification) {
            onSendNotification({
                ...newNotif,
                id: Date.now().toString(),
                time: 'À l\'instant',
                read: false,
                targetUserId: newNotif.targetRole === 'ALL' ? 'ALL' : newNotif.targetRole
            });
            setNewNotif({ title: '', message: '', targetRole: 'ALL', targetCommune: 'ALL', type: 'info' });
            setViewMode('history');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{isAdmin ? 'Centre de Comm' : 'Mes Messages'}</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flux d'information Biso Peto</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <button onClick={() => setViewMode('compose')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'compose' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Envoi</button>
                            <button onClick={() => setViewMode('history')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'history' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Logs</button>
                        </div>
                    )}
                    {!isAdmin && (
                        <button onClick={onMarkAllRead} className="text-sm font-black text-[#00C853] hover:underline uppercase tracking-tighter">Tout marquer lu</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 no-scrollbar">
                {viewMode === 'compose' && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm space-y-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3 uppercase"><MessageSquare size={24} className="text-blue-500"/> Nouveau Message</h3>
                            <form onSubmit={handleSend} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cible Rôle</label>
                                        <select value={newNotif.targetRole} onChange={e => setNewNotif({...newNotif, targetRole: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-blue-500 border-none dark:text-white">
                                            <option value="ALL">Tous les utilisateurs</option>
                                            <option value={UserType.CITIZEN}>Citoyens</option>
                                            <option value={UserType.BUSINESS}>Entreprises</option>
                                            <option value={UserType.COLLECTOR}>Collecteurs</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cible Commune</label>
                                        <select value={newNotif.targetCommune} onChange={e => setNewNotif({...newNotif, targetCommune: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-blue-500 border-none dark:text-white">
                                            <option value="ALL">Toutes les zones</option>
                                            <option value="Gombe">Gombe</option><option value="Ngaliema">Ngaliema</option><option value="Limete">Limete</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sujet du message</label>
                                    <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-sm outline-none focus:ring-2 ring-blue-500 border-none dark:text-white" placeholder="Titre de la notification..." value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contenu</label>
                                    <textarea className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-blue-500 border-none dark:text-white resize-none" rows={4} placeholder="Mbote, voici une annonce importante..." value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['info', 'success', 'warning', 'alert'].map(t => (
                                        <button key={t} type="button" onClick={() => setNewNotif({...newNotif, type: t as any})} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${newNotif.type === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-gray-100 text-gray-400'}`}>{t}</button>
                                    ))}
                                </div>
                                <button type="submit" className="w-full py-5 bg-[#2962FF] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"><Send size={20}/> Diffuser le message</button>
                            </form>
                        </div>
                    </div>
                )}

                {(viewMode === 'inbox' || viewMode === 'history') && (
                    <div className="space-y-4 animate-fade-in">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Bell size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase text-xs tracking-widest">Aucun message pour le moment</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm flex gap-6 items-start transition-all hover:shadow-md ${!notif.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        notif.type === 'success' ? 'bg-green-50 text-green-600' : 
                                        notif.type === 'warning' ? 'bg-orange-50 text-orange-600' : 
                                        notif.type === 'alert' ? 'bg-red-50 text-red-600' : 
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{notif.title}</h4>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{notif.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{notif.message}</p>
                                        {isAdmin && (
                                            <div className="mt-4 flex gap-4 text-[9px] font-black uppercase text-gray-400 tracking-widest border-t dark:border-gray-800 pt-3">
                                                <span className="flex items-center gap-1"><Users size={12}/> {notif.targetUserId}</span>
                                                <span className="text-green-500">Envoyé</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

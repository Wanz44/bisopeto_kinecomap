
import React, { useState, useMemo } from 'react';
import { 
    ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, Clock, Send, Users, 
    MapPin, X, Trash2, Calendar, Target, ShieldAlert, MessageSquare, 
    Filter, Smartphone, Monitor, LayoutTemplate, Sparkles, Plus, 
    ChevronRight, Search, Hash, Timer, Globe, Check, Layers, AlertCircle, History
} from 'lucide-react';
import { NotificationItem, UserType } from '../types';

const PRESET_TEMPLATES = [
    { 
        id: 'collect-today', 
        title: '🚚 Passage imminent', 
        message: 'Mbote! Nos équipes de collecte passeront dans votre rue d\'ici 30 minutes. Sortez vos bacs !',
        type: 'info'
    },
    { 
        id: 'points-bonus', 
        title: '✨ Bonus Eco-Points', 
        message: 'Exceptionnel ! Gagnez le double de points pour tout apport de plastique PET ce weekend.',
        type: 'success'
    },
    { 
        id: 'weather-alert', 
        title: '⚠️ Alerte Météo / Inondation', 
        message: 'Fortes pluies prévues. Veuillez ne pas déposer de sacs près des caniveaux pour éviter les obstructions.',
        type: 'alert'
    },
    { 
        id: 'maintenance', 
        title: '🔧 Maintenance App', 
        message: 'Le service de paiement sera indisponible cette nuit de 02:00 à 04:00 pour mise à jour.',
        type: 'warning'
    }
];

const KINSHASA_COMMUNES = [
    "ALL", "Gombe", "Ngaliema", "Limete", "Bandalungwa", "Kintambo", "Lemba", "Victoire", "Matete", "Masina", "Nsele"
];

interface NotificationsProps {
    onBack: () => void;
    notifications: NotificationItem[];
    onMarkAllRead: () => void;
    isAdmin?: boolean;
    onSendNotification?: (notif: Partial<NotificationItem & { commune?: string; neighborhood?: string }>) => void;
    onDeleteNotification?: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
    onBack, notifications, onMarkAllRead, isAdmin, onSendNotification, onDeleteNotification 
}) => {
    const [viewMode, setViewMode] = useState<'inbox' | 'compose' | 'history'>(isAdmin ? 'compose' : 'inbox');
    const [isScheduling, setIsScheduling] = useState(false);
    
    // State de composition
    const [newNotif, setNewNotif] = useState({
        title: '',
        message: '',
        targetRole: 'ALL',
        targetCommune: 'ALL',
        targetNeighborhood: '',
        type: 'info' as any,
        scheduleDate: ''
    });

    const charCount = newNotif.message.length;
    const isOverLimit = charCount > 160;

    const applyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
        setNewNotif({ ...newNotif, title: tpl.title, message: tpl.message, type: tpl.type });
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSendNotification) {
            onSendNotification({
                title: newNotif.title,
                message: newNotif.message,
                type: newNotif.type,
                targetUserId: newNotif.targetRole,
                commune: newNotif.targetCommune,
                neighborhood: newNotif.targetNeighborhood
            });
            setViewMode('history');
            // Reset
            setNewNotif({ title: '', message: '', targetRole: 'ALL', targetCommune: 'ALL', targetNeighborhood: '', type: 'info', scheduleDate: '' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-300 overflow-hidden">
            {/* GLOBAL HEADER PRO */}
            <div className="bg-white dark:bg-gray-900 px-8 py-5 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={22} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Centre de Communication</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <Globe size={12} className="text-blue-500" /> Diffusion Multicanal Biso Peto
                            </p>
                        </div>
                    </div>

                    {isAdmin ? (
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                            <button onClick={() => setViewMode('compose')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'compose' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>
                                <Plus size={14}/> Nouveau
                            </button>
                            <button onClick={() => setViewMode('history')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-400'}`}>
                                <History size={14}/> Journal
                            </button>
                        </div>
                    ) : (
                        <button onClick={onMarkAllRead} className="px-6 py-3 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-green-100">Tout marquer lu</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {viewMode === 'compose' && (
                    <div className="h-full flex flex-col lg:flex-row animate-fade-in">
                        
                        {/* LEFT: CONFIGURATION TOOLS */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar space-y-10 border-r dark:border-gray-800">
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={16} className="text-blue-500"/> Modèles Rapides</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {PRESET_TEMPLATES.map(tpl => (
                                        <button 
                                            key={tpl.id}
                                            onClick={() => applyTemplate(tpl)}
                                            className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-left hover:border-blue-500 hover:shadow-md transition-all group"
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-tight dark:text-white group-hover:text-blue-500">{tpl.title}</p>
                                            <p className="text-[9px] text-gray-400 font-bold mt-1 line-clamp-1 italic">{tpl.message}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="space-y-8">
                                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b dark:border-gray-800 pb-4">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Target size={20}/></div>
                                            <h4 className="font-black uppercase text-sm tracking-tight dark:text-white">Paramètres d'audience</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cible Rôle</label>
                                                <select value={newNotif.targetRole} onChange={e => setNewNotif({...newNotif, targetRole: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-blue-500/20 border-none dark:text-white appearance-none">
                                                    <option value="ALL">Tous les comptes</option>
                                                    <option value="ADMIN">Administrateurs</option>
                                                    <option value={UserType.CITIZEN}>Citoyens</option>
                                                    <option value={UserType.BUSINESS}>Entreprises</option>
                                                    <option value={UserType.COLLECTOR}>Collecteurs</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone de diffusion</label>
                                                <select value={newNotif.targetCommune} onChange={e => setNewNotif({...newNotif, targetCommune: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-blue-500/20 border-none dark:text-white appearance-none">
                                                    {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'Toutes les communes' : c}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrage par quartier (Optionnel)</label>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                                                <input className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-xs dark:text-white outline-none focus:ring-2 ring-blue-500/20" placeholder="ex: Quartier GB, Limete Industriel..." value={newNotif.targetNeighborhood} onChange={e => setNewNotif({...newNotif, targetNeighborhood: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b dark:border-gray-800 pb-4">
                                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
                                            <h4 className="font-black uppercase text-sm tracking-tight dark:text-white">Contenu du message</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titre de l'alerte</label>
                                                <input required className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" placeholder="Objet de la notification..." value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corps du texte</label>
                                                    <span className={`text-[10px] font-black ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>{charCount} / 160</span>
                                                </div>
                                                <textarea required rows={4} className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border-none outline-none font-bold text-sm dark:text-white resize-none focus:ring-2 ring-blue-500/20" placeholder="Rédigez votre annonce professionnelle ici..." value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {['info', 'success', 'warning', 'alert'].map(t => (
                                                <button key={t} type="button" onClick={() => setNewNotif({...newNotif, type: t as any})} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-2 ${newNotif.type === t ? 'border-[#2962FF] bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                                                    <Layers size={14}/> {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-[2rem] border dark:border-gray-800 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Timer size={18} className="text-blue-500" />
                                                <span className="text-xs font-black uppercase dark:text-white">Planifier l'envoi</span>
                                            </div>
                                            <button type="button" onClick={() => setIsScheduling(!isScheduling)} className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${isScheduling ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isScheduling ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                        {isScheduling && (
                                            <input type="datetime-local" className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 font-bold text-xs dark:text-white outline-none animate-fade-in" value={newNotif.scheduleDate} onChange={e => setNewNotif({...newNotif, scheduleDate: e.target.value})} />
                                        )}
                                    </div>

                                    <button type="submit" className="w-full py-6 bg-[#2962FF] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all text-sm">
                                        {isScheduling ? <><Calendar size={20}/> Programmer la diffusion</> : <><Send size={20}/> Diffuser Immédiatement</>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT: PREVIEW PANEL */}
                        <div className="hidden lg:flex w-[500px] bg-gray-100 dark:bg-[#050505] p-12 flex-col items-center justify-center border-l dark:border-gray-800 relative">
                            <div className="absolute top-10 flex items-center gap-3">
                                <Smartphone size={18} className="text-blue-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prévisualisation Mobile Live</span>
                            </div>

                            {/* PHONE MOCKUP */}
                            <div className="w-[320px] h-[640px] bg-white dark:bg-black rounded-[4rem] border-[14px] border-gray-900 dark:border-gray-800 shadow-2xl overflow-hidden relative transition-all duration-500">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-20"></div>
                                
                                {/* Lock Screen Style Preview */}
                                <div className="h-full w-full bg-gradient-to-b from-blue-600/20 to-purple-600/20 dark:from-blue-900/40 dark:to-black p-6 pt-16 flex flex-col gap-4">
                                    <div className="text-center mb-8">
                                        <p className="text-5xl font-light text-gray-800 dark:text-white">12:45</p>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-2">Mardi 25 Mai</p>
                                    </div>

                                    {/* THE NOTIFICATION CARD */}
                                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/50 dark:border-white/5 animate-fade-in-up">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-[#2962FF] rounded-lg flex items-center justify-center p-1 shadow-inner">
                                                    <img src="logobisopeto.png" alt="B" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Biso Peto</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-400">Maintenant</span>
                                        </div>
                                        <h5 className="font-black text-gray-900 dark:text-white text-xs uppercase leading-tight mb-1">{newNotif.title || "Titre du message"}</h5>
                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                            {newNotif.message || "Votre message s'affichera ici tel qu'il sera reçu sur les téléphones de Kinshasa."}
                                        </p>
                                    </div>

                                    <div className="mt-auto flex justify-center pb-4">
                                        <div className="w-32 h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col items-center gap-3">
                                <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1"><Smartphone size={12}/> iOS / Android</div>
                                    <div className="flex items-center gap-1"><Monitor size={12}/> Desktop</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100 dark:border-blue-900/30">
                                    <Sparkles size={12} className="text-blue-500" />
                                    <span className="text-[8px] font-black text-blue-600 uppercase">Optimisé pour la 4G de Kinshasa</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'history' && (
                    <div className="h-full overflow-y-auto p-8 lg:p-12 space-y-6 no-scrollbar pb-32 animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrer par période</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="date" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white" />
                                    <input type="date" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type d'audience</label>
                                <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white appearance-none">
                                    <option>Tous</option><option>Citoyens</option><option>Entreprises</option>
                                </select>
                            </div>
                            <button className="p-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl shadow-xl transition-all hover:scale-105"><Search size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {notifications.length === 0 ? (
                                <div className="col-span-full py-32 text-center opacity-30">
                                    <Bell size={64} className="mx-auto mb-4" />
                                    <p className="font-black uppercase tracking-widest">Aucun historique de diffusion</p>
                                </div>
                            ) : notifications.map(notif => (
                                <div key={notif.id} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-sm group hover:border-blue-500 transition-all flex gap-8 items-start relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                        notif.type === 'success' ? 'bg-green-50 text-green-600' : 
                                        notif.type === 'warning' ? 'bg-orange-50 text-orange-600' : 
                                        notif.type === 'alert' ? 'bg-red-50 text-red-600' : 
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {notif.type === 'alert' ? <AlertCircle size={28}/> : <Bell size={28}/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none text-sm truncate">{notif.title}</h4>
                                            <span className="text-[10px] font-black text-gray-400 uppercase whitespace-nowrap ml-4">{notif.time || 'Envoyé'}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed line-clamp-2">{notif.message}</p>
                                        
                                        <div className="mt-6 pt-4 border-t dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between">
                                            <div className="flex gap-3">
                                                <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[8px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1"><Users size={10}/> {notif.targetUserId}</span>
                                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[8px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1"><CheckCircle size={10}/> Reçu par 100%</span>
                                            </div>
                                            <button onClick={() => onDeleteNotification?.(notif.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {viewMode === 'inbox' && (
                    <div className="p-8 lg:p-12 space-y-6 pb-32 animate-fade-in scroll-container overflow-y-auto h-full">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                <Bell size={80} className="mb-6" />
                                <p className="font-black uppercase text-sm tracking-[0.3em]">Aucun message</p>
                            </div>
                        ) : notifications.map(notif => (
                            <div key={notif.id} className={`bg-white dark:bg-gray-900 p-8 rounded-[3rem] border-2 shadow-sm flex gap-8 items-start transition-all hover:shadow-xl ${!notif.read ? 'border-blue-500 dark:border-blue-600' : 'border-gray-50 dark:border-gray-800'}`}>
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${
                                    notif.type === 'success' ? 'bg-green-50 text-green-600' : 
                                    notif.type === 'warning' ? 'bg-orange-50 text-orange-600' : 
                                    notif.type === 'alert' ? 'bg-red-50 text-red-600' : 
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                    <Bell size={32}/>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg">{notif.title}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{notif.time || 'Récent'}</p>
                                        </div>
                                        {!notif.read && <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-[8px] font-black uppercase">Nouveau</div>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{notif.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

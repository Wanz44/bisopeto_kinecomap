
import React, { useState } from 'react';
import { 
    ArrowLeft, BookOpen, Plus, Video, Edit2, Trash2, Save, X, Check, 
    HelpCircle, Layout, ListChecks, BarChart3, Users, Clock, Award, 
    GripVertical, FileText, Image as ImageIcon, PlayCircle, Eye, MoreVertical,
    TrendingUp, Filter, Search, GraduationCap, CheckCircle2
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Course, QuizQuestion } from '../types';

interface AdminAcademyProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface ExtendedCourse extends Course {
    difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
    duration: string;
    xp: number;
    enrolled: number;
    completionRate: number;
    category: string;
    modulesCount: number;
    lastUpdated: string;
}

export const AdminAcademy: React.FC<AdminAcademyProps> = ({ onBack, onToast }) => {
    const [courses, setCourses] = useState<ExtendedCourse[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'learners' | 'editor'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCourse, setEditingCourse] = useState<Partial<ExtendedCourse> | null>(null);
    const [editorTab, setEditorTab] = useState<'meta' | 'curriculum'>('meta');

    // Mock des apprenants pour le suivi
    const learners = [
        { name: 'Archange S.', email: 'archange@test.com', course: 'Recyclage 101', progress: 85, score: '18/20' },
        { name: 'Sarah M.', email: 'sarah@test.com', course: 'Compostage', progress: 30, score: '-' },
    ];

    const handleCreateCourse = () => {
        setEditingCourse({
            title: '',
            description: '',
            difficulty: 'Débutant',
            duration: '1h',
            category: 'Général',
            status: 'draft',
            xp: 100,
            icon: 'book',
            color: 'bg-blue-100 text-blue-600',
            quiz: []
        });
        setViewMode('editor');
    };

    const handleSaveCourse = () => {
        if (!editingCourse?.title) return;
        const newCourse: ExtendedCourse = {
            ...(editingCourse as ExtendedCourse),
            id: editingCourse.id || Date.now().toString(),
            progress: 0, enrolled: 0, completionRate: 0, modulesCount: 0,
            lastUpdated: new Date().toLocaleDateString()
        };
        setCourses([newCourse, ...courses.filter(c => c.id !== newCourse.id)]);
        setViewMode('list');
        if (onToast) onToast("Contenu académique sauvegardé", "success");
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            {viewMode !== 'editor' && (
                <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Eco Academy CMS</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gestion des Savoirs & Certifications</p>
                            </div>
                        </div>
                        <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Cours</button>
                            <button onClick={() => setViewMode('learners')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'learners' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Apprenants</button>
                            <button onClick={() => setViewMode('analytics')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Stats</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pb-24 no-scrollbar">
                
                {viewMode === 'list' && (
                    <div className="space-y-6 animate-fade-in">
                        <button onClick={handleCreateCourse} className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] text-gray-400 font-black uppercase text-xs tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-3"><Plus/> Créer un nouveau cours</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(c => (
                                <div key={c.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><BookOpen size={24}/></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => {setEditingCourse(c); setViewMode('editor');}} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={16}/></button>
                                            <button onClick={() => setCourses(prev => prev.filter(x => x.id !== c.id))} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{c.title}</h4>
                                    <div className="flex items-center gap-4 mt-6 pt-4 border-t dark:border-gray-800">
                                        <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase">Inscrits</span><span className="text-sm font-black dark:text-white">{c.enrolled}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase">XP</span><span className="text-sm font-black text-[#00C853]">{c.xp}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {viewMode === 'learners' && (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6">Apprenant</th>
                                    <th className="p-6">Cours Actuel</th>
                                    <th className="p-6">Progression</th>
                                    <th className="p-6 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {learners.map((l, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-6">
                                            <div className="font-black text-gray-900 dark:text-white uppercase text-sm">{l.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">{l.email}</div>
                                        </td>
                                        <td className="p-6 text-xs font-bold text-gray-500">{l.course}</td>
                                        <td className="p-6">
                                            <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{width: `${l.progress}%`}}></div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-black text-blue-600">{l.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {viewMode === 'editor' && editingCourse && (
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-8 border dark:border-gray-800 max-w-4xl mx-auto animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Studio Academy</h3>
                            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Configuration Principale</label>
                                    <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black dark:text-white" placeholder="Titre du cours" value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
                                    <textarea className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white resize-none" rows={4} placeholder="Description détaillée..." value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vidéos & Quiz</label>
                                    <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <Video size={32}/>
                                        <span className="text-[10px] font-black uppercase">Uploader MP4 / YouTube URL</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                                            <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">Difficulté</span>
                                            <select className="bg-transparent font-black text-xs text-blue-600 outline-none" value={editingCourse.difficulty} onChange={e => setEditingCourse({...editingCourse, difficulty: e.target.value as any})}>
                                                <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                                            </select>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                                            <span className="text-[9px] font-black text-green-400 uppercase block mb-1">XP Points</span>
                                            <input type="number" className="bg-transparent font-black text-xs text-green-600 outline-none w-full text-center" value={editingCourse.xp} onChange={e => setEditingCourse({...editingCourse, xp: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSaveCourse} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Save size={20}/> Enregistrer le cours</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
